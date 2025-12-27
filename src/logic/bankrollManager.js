/**
 * BANKROLL MANAGER - Phase 13
 * Handles binding discipline, stake calculation, and append-only ledger.
 */

import { CONFIG } from '../config';

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
            stats: {
                passCount: 0,
                noBetCount: 0,
                betCount: 0
            }
        };

        if (saved) {
            try {
                this.state = JSON.parse(saved);
                if (!this.state.stats) this.state.stats = defaultState.stats;
                // Dynamic daily reset
                const today = new Date().toDateString();
                if (this.state.last_reset_date !== today) {
                    this.state.daily_pl = 0;
                    this.state.daily_bet_count = 0;
                    this.state.daily_loss_count = 0;
                    this.state.last_reset_date = today;
                    this.saveState();
                    this.addToLedger('SYSTEM_RESET', { reason: 'New Day Started' });
                }
            } catch (e) {
                console.error('Error parsing bankroll state, resetting to default', e);
                this.state = defaultState;
            }
        } else {
            this.state = defaultState;
            this.saveState();
            this.addToLedger('SYSTEM_INIT', { balance: defaultState.starting_balance });
        }
    }

    saveState() {
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

    logVerdict(verdict) {
        if (verdict === 'PASS') this.state.stats.passCount++;
        if (verdict === 'NO-BET') this.state.stats.noBetCount++;
        if (verdict === 'BET') this.state.stats.betCount++;
        this.saveState();
    }

    getAnalytics() {
        const total = (this.state.stats.passCount || 0) + (this.state.stats.noBetCount || 0) + (this.state.stats.betCount || 0);
        return {
            passRate: total > 0 ? (this.state.stats.passCount / total) * 100 : 0,
            noBetRate: total > 0 ? (this.state.stats.noBetCount / total) * 100 : 0,
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

        this.addToLedger('BET_OPEN', {
            match_id: fixture.id,
            match_name: `${fixture.homeName} vs ${fixture.awayName}`,
            league: fixture.leagueName,
            tier: fixture.tier,
            stake_amount: approvedStake,
            balance_before: this.state.current_balance,
            reason: signal.mainReason
        });

        return true;
    }

    processResult(matchId, isWin, stake, odds = 2.0) {
        const profit = isWin ? stake * (odds - 1) : -stake;
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

        if (this.state.loss_streak >= h.THRESHOLDS.STOP_LOSS_STREAK ||
            this.state.daily_loss_count >= h.THRESHOLDS.DAILY_LOSS_LIMIT ||
            this.state.daily_bet_count >= h.THRESHOLDS.DAILY_BET_LIMIT) {
            newMode = h.MODES.NO_BET;
        }
        else if (this.state.loss_streak >= h.THRESHOLDS.CAUTION_LOSS_STREAK) {
            newMode = h.MODES.CAUTION;
        }

        if (newMode !== prevMode) {
            this.state.current_mode = newMode;
            this.addToLedger('MODE_CHANGE', {
                from: prevMode,
                to: newMode,
                reason: `Triggered by ${newMode === h.MODES.NO_BET ? 'STOP' : 'CAUTION'} rules`
            });
        }
    }

    getState() {
        return this.state;
    }

    reset() {
        localStorage.removeItem('lbm_bankroll_state');
        this.loadState();
    }
}

export const bankrollManager = new BankrollManager();
