/**
 * BANKROLL MANAGER - Phase 13
 * Handles binding discipline, stake calculation, and append-only ledger.
 */

import { CONFIG } from '../config';
import { translations } from '../locales/translations';

class BankrollManager {
    constructor() {
        this.loadState();
    }

    loadState() {
        const saved = localStorage.getItem('lbm_bankroll_state');
        const defaultState = {
            starting_balance: CONFIG.BANKROLL.HIERARCHY.INITIAL_BALANCE,
            current_balance: CONFIG.BANKROLL.HIERARCHY.INITIAL_BALANCE,
            max_balance_seen: CONFIG.BANKROLL.HIERARCHY.INITIAL_BALANCE,
            daily_pl: 0,
            win_streak: 0,
            loss_streak: 0,
            current_mode: CONFIG.BANKROLL.HIERARCHY.MODES.NORMAL,
            daily_bet_count: 0,
            daily_loss_count: 0,
            last_reset_date: new Date().toDateString(),
            ledger: [],
            processedToday: {},
            stats: {
                passCount: 0,
                noBetCount: 0,
                betCount: 0
            }
        };

        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Deep merge logic to ensure nested objects exist
                this.state = {
                    ...defaultState,
                    ...parsed,
                    stats: { ...defaultState.stats, ...(parsed.stats || {}) },
                    processedToday: parsed.processedToday || {}
                };

                // Dynamic daily reset
                const today = new Date().toDateString();
                if (this.state.last_reset_date !== today) {
                    console.log('[BankrollManager] New day detected. Resetting daily counters.');
                    this.state.daily_pl = 0;
                    this.state.daily_bet_count = 0;
                    this.state.daily_loss_count = 0;
                    this.state.last_reset_date = today;
                    this.state.processedToday = {};
                    this.saveState();
                    this.addToLedger('SYSTEM_RESET', { reason: 'new_day_reason' });
                }
                console.log('[BankrollManager] Loaded state. Balance:', this.state.current_balance);
            } catch (e) {
                console.error('[BankrollManager] Error parsing saved state, resetting to default', e);
                this.state = defaultState;
            }
        } else {
            console.log('[BankrollManager] No saved state found, initializing system.');
            this.state = defaultState;
            this.saveState();
            this.addToLedger('SYSTEM_INIT', {
                balance: defaultState.starting_balance,
                reason: 'system_init_reason'
            });
        }
    }

    saveState() {
        console.log('[BankrollManager] Saving state. Balance:', this.state.current_balance);
        localStorage.setItem('lbm_bankroll_state', JSON.stringify(this.state));
    }

    addToLedger(type, data) {
        if (!this.state.ledger) this.state.ledger = [];
        const entry = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            type,
            ...data,
            balance_after: this.state.current_balance,
            current_mode: this.state.current_mode
        };
        this.state.ledger.push(entry);
        if (this.state.ledger.length > 500) {
            this.state.ledger = this.state.ledger.slice(-500);
        }
        this.saveState();
    }

    logVerdict(matchId, verdict) {
        if (!this.state.processedToday) this.state.processedToday = {};

        const key = `${matchId}_${verdict}`;
        if (this.state.processedToday[key]) return; // Already counted this verdict for this match

        console.log(`[BankrollManager] Logging new verdict: ${verdict} for match: ${matchId}`);
        if (verdict === 'PASS') this.state.stats.passCount++;
        if (verdict === 'NO-BET') this.state.stats.noBetCount++;
        if (verdict === 'BET') this.state.stats.betCount++;

        this.state.processedToday[key] = true;
        this.saveState();
    }

    getAnalytics() {
        const stats = this.state.stats || { passCount: 0, noBetCount: 0, betCount: 0 };
        const total = (stats.passCount || 0) + (stats.noBetCount || 0) + (stats.betCount || 0);
        return {
            passRate: total > 0 ? (stats.passCount / total) * 100 : 0,
            noBetRate: total > 0 ? (stats.noBetCount / total) * 100 : 0,
            totalAnalysed: total
        };
    }

    calculateRecommendedStake(fixture, signal) {
        if (this.state.current_mode === CONFIG.BANKROLL.HIERARCHY.MODES.NO_BET) {
            return 0;
        }

        const h = CONFIG.BANKROLL.HIERARCHY;
        let percentage = fixture.tier === 2 ? h.STAKE_PERCENTAGE.TIER_2 : h.STAKE_PERCENTAGE.TIER_1;

        if (this.state.current_mode === h.MODES.CAUTION) {
            percentage *= CONFIG.BANKROLL.LOSS_STREAK_STAKE_MODIFIER;
        }

        const stake = this.state.current_balance * percentage;
        return Math.round(stake * 100) / 100;
    }

    approveBet(fixture, signal, approvedStake) {
        if (this.state.current_mode === CONFIG.BANKROLL.HIERARCHY.MODES.NO_BET) {
            return false;
        }

        const balanceBefore = Number(this.state.current_balance);
        const stake = Number(approvedStake);

        this.state.current_balance = balanceBefore - stake;
        console.log(`[BankrollManager] Bet Approved. Balance: ${balanceBefore} -> ${this.state.current_balance}`);

        this.addToLedger('BET_OPEN', {
            match_id: fixture.id,
            match_name: `${fixture.homeTeam} vs ${fixture.awayTeam}`,
            league: fixture.leagueName,
            tier: fixture.tier,
            stake_amount: stake,
            balance_before: balanceBefore,
            reason: signal.mainReason
        });

        this.saveState(); // Explict save after ledger
        return true;
    }

    processResult(matchId, isWin, stake, odds = 2.0) {
        const profit = isWin ? stake * odds : 0; // Stake was already deducted
        const balanceBefore = this.state.current_balance;

        this.state.current_balance += profit;
        if (this.state.current_balance > this.state.max_balance_seen) {
            this.state.max_balance_seen = this.state.current_balance;
        }

        this.state.daily_pl += profit;
        this.state.daily_bet_count++;

        if (isWin) {
            this.state.win_streak++;
            this.state.loss_streak = 0;
        } else {
            this.state.loss_streak++;
            this.state.win_streak = 0;
            this.state.daily_loss_count++;
        }

        this.addToLedger(isWin ? 'BET_WIN' : 'BET_LOSS', {
            match_id: matchId,
            match_name: this.state.ledger.find(l => l.match_id === matchId)?.match_name || 'Match',
            stake,
            profit,
            balance_before: balanceBefore,
            loss_streak: this.state.loss_streak
        });

        this.checkModeTransitions();
        this.saveState();
    }

    checkModeTransitions() {
        const h = CONFIG.BANKROLL.HIERARCHY;
        const prevMode = this.state.current_mode;
        let newMode = h.MODES.NORMAL;

        // EXPERT DISCIPLINE: Stop-Loss & Target Profit
        const dailyProfitPercent = (this.state.daily_pl / this.state.starting_balance);
        const targetReached = dailyProfitPercent >= 0.05; // %5 Kar Hedefi
        const stopLossReached = dailyProfitPercent <= -0.03; // %3 Zarar Durdur

        if (this.state.loss_streak >= h.THRESHOLDS.STOP_LOSS_STREAK ||
            this.state.daily_loss_count >= h.THRESHOLDS.DAILY_LOSS_LIMIT ||
            this.state.daily_bet_count >= h.THRESHOLDS.DAILY_BET_LIMIT ||
            targetReached || stopLossReached) {
            newMode = h.MODES.NO_BET;
        }
        else if (this.state.loss_streak >= h.THRESHOLDS.CAUTION_LOSS_STREAK) {
            newMode = h.MODES.CAUTION;
        }

        if (newMode !== prevMode) {
            this.state.current_mode = newMode;
            let reasonKey = 'stop_rules_reason';
            if (targetReached) reasonKey = 'SSS: Günlük %5 kar hedefine ulaşıldı. Kasa koruma modu aktif.';
            else if (stopLossReached) reasonKey = 'SSS: Günlük %3 zarar limitine ulaşıldı. Disiplin molası.';

            this.addToLedger('MODE_CHANGE', {
                from: prevMode,
                to: newMode,
                reason: reasonKey
            });
        }
    }

    getState() {
        // Return a copy to ensure React re-renders on state change
        return JSON.parse(JSON.stringify(this.state));
    }

    getModeLabel(lang) {
        const mode = this.state.current_mode;
        const t = translations[lang] || translations['tr'];
        if (mode === CONFIG.BANKROLL.HIERARCHY.MODES.NORMAL) return t.mode_normal;
        if (mode === CONFIG.BANKROLL.HIERARCHY.MODES.CAUTION) return t.mode_caution;
        if (mode === CONFIG.BANKROLL.HIERARCHY.MODES.NO_BET) return t.mode_no_bet;
        return mode;
    }

    reset() {
        localStorage.removeItem('lbm_bankroll_state');
        this.loadState();
    }
}

export const bankrollManager = new BankrollManager();
