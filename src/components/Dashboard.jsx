import React, { useState, useEffect } from 'react';
import { CONFIG } from '../config';
import { dataWorker } from '../backend/dataWorker';
import { bankrollManager } from '../logic/bankrollManager';
import { FAQ } from './FAQ';
import { translations } from '../locales/translations';
import { AdminPanel } from './AdminPanel';
import '../styles/global.css';

export const Dashboard = ({ user, onLogout }) => {
    const [matches, setMatches] = useState([]);
    const [signals, setSignals] = useState({});
    const [bankState, setBankState] = useState(bankrollManager.getState());
    const [lastFetchSeconds, setLastFetchSeconds] = useState(0);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [decisionMode, setDecisionMode] = useState(dataWorker.decisionMode);
    const [showFAQ, setShowFAQ] = useState(false);
    const [lang, setLang] = useState('tr');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [activeTierFilter, setActiveTierFilter] = useState('ALL');
    const [leagueTierMap, setLeagueTierMap] = useState({
        tier1: [...CONFIG.MODULAR_SYSTEM.LEAGUE_TIERS.TIER_1],
        tier2: [...CONFIG.MODULAR_SYSTEM.LEAGUE_TIERS.TIER_2]
    });
    const [advancedSettings, setAdvancedSettings] = useState({
        ...CONFIG.MODULAR_SYSTEM.OPTIONAL_MODULES
    });
    const [view, setView] = useState('DASHBOARD'); // 'DASHBOARD' or 'ADMIN'
    const isAdmin = user?.email === 'karabulut.hamza@gmail.com';

    const t = translations[lang];

    useEffect(() => {
        dataWorker.start();
        const interval = setInterval(() => {
            const currentFixtures = dataWorker.fixtures;
            if (currentFixtures.length === 0) {
                setMatches([]);
                setSignals({});
                return;
            }

            setMatches(currentFixtures);

            const updatedSignals = {};
            currentFixtures.forEach(m => {
                const sig = dataWorker.getSignalForMatch(m.id);
                if (sig) {
                    updatedSignals[m.id] = sig;
                    bankrollManager.logVerdict(m.id, sig.verdict);
                }
            });
            setSignals(updatedSignals);
            setBankState(bankrollManager.getState());

            if (dataWorker.healthStats.lastFetch) {
                setLastFetchSeconds(Math.floor((Date.now() - dataWorker.healthStats.lastFetch) / 1000));
            }
        }, CONFIG.DATA.POLLING_INTERVAL_MS);

        return () => {
            clearInterval(interval);
            dataWorker.stop();
        };
    }, []);

    const analytics = bankrollManager.getAnalytics();
    const eligibleMatches = matches.filter(m => m.dqs >= CONFIG.DECISION.DQS_THRESHOLD);
    const observationMatches = matches
        .filter(m => (m.dqs || 0) < CONFIG.DECISION.DQS_THRESHOLD)
        .sort((a, b) => (b.dqs || 0) - (a.dqs || 0));

    const filterByTier = (m) => activeTierFilter === 'ALL' || m.tier === activeTierFilter;

    return (
        <div className="dashboard-container" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh', background: 'radial-gradient(circle at top right, #1e293b, #030712)' }}>
            {/* Header */}
            <header className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)' }}>
                <div className="header-title-area">
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-1px', background: 'linear-gradient(to right, var(--text-primary), var(--accent-color))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t.title}</h1>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{t.subtitle}</p>
                    <div className="header-stats-bar" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', fontSize: '0.8rem' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--success-color)', fontWeight: 600 }}>
                            {t.pass_rate}: {(analytics.passRate || 0).toFixed(1)}%
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {t.no_bet_rate}: {(analytics.noBetRate || 0).toFixed(1)}%
                        </div>
                        <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1px solid rgba(56, 189, 248, 0.2)', color: 'var(--accent-color)', fontWeight: 600 }}>
                            {t.limit}: {bankState.daily_bet_count}/{CONFIG.BANKROLL.HIERARCHY.THRESHOLDS.DAILY_BET_LIMIT}
                        </div>
                        <button onClick={() => setShowFAQ(true)} className="faq-btn" style={{ width: '1.8rem', height: '1.8rem', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--glass-border)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem' }}>?</button>
                    </div>
                </div>

                <div className="header-actions" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div className="auth-user-info" style={{ textAlign: 'right' }}>
                        <div style={{ color: 'var(--accent-color)', fontWeight: 800, fontSize: '0.7rem', opacity: 0.8 }}>{user?.email}</div>
                        <button
                            onClick={onLogout}
                            className="logout-btn"
                            style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: '#ef4444',
                                fontSize: '0.6rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                padding: '0.35rem 0.7rem',
                                borderRadius: '6px',
                                marginTop: '0.4rem',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            🚪 {lang === 'tr' ? 'ÇIKIŞ YAP' : 'LOGOUT'}
                        </button>
                    </div>

                    {isAdmin && (
                        <div className="admin-toggle-wrapper" style={{ display: 'flex', gap: '0.3rem', background: 'rgba(15, 23, 42, 0.8)', padding: '0.2rem', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                            <button
                                onClick={() => setView('DASHBOARD')}
                                style={{
                                    padding: '0.4rem 0.8rem',
                                    fontSize: '0.65rem',
                                    cursor: 'pointer',
                                    background: view === 'DASHBOARD' ? 'var(--accent-color)' : 'transparent',
                                    color: view === 'DASHBOARD' ? '#000' : 'var(--text-secondary)',
                                    border: 'none',
                                    borderRadius: '7px',
                                    fontWeight: 800,
                                    transition: 'all 0.2s'
                                }}
                            >📊</button>
                            <button
                                onClick={() => setView('ADMIN')}
                                style={{
                                    padding: '0.4rem 0.8rem',
                                    fontSize: '0.65rem',
                                    cursor: 'pointer',
                                    background: view === 'ADMIN' ? 'var(--warning-color)' : 'transparent',
                                    color: view === 'ADMIN' ? '#000' : 'var(--text-secondary)',
                                    border: 'none',
                                    borderRadius: '7px',
                                    fontWeight: 800,
                                    transition: 'all 0.2s'
                                }}
                            >🛡️</button>
                        </div>
                    )}

                    <div className="lang-toggle" style={{ display: 'flex', gap: '0.3rem', background: 'rgba(15, 23, 42, 0.8)', padding: '0.2rem', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                        {['tr', 'en'].map(l => (
                            <button
                                key={l}
                                onClick={() => setLang(l)}
                                style={{
                                    padding: '0.4rem 0.8rem',
                                    fontSize: '0.65rem',
                                    cursor: 'pointer',
                                    background: lang === l ? 'var(--accent-color)' : 'transparent',
                                    color: lang === l ? '#000' : 'var(--text-secondary)',
                                    border: 'none',
                                    borderRadius: '7px',
                                    fontWeight: 800,
                                    transition: 'all 0.2s'
                                }}
                            >{l.toUpperCase()}</button>
                        ))}
                    </div>

                    <div className="utility-btns" style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                        <button onClick={() => setShowAdvanced(true)} className="settings-btn" style={{ fontSize: '1.1rem', background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.7 }}>⚙️</button>
                        <button
                            onClick={() => {
                                console.log('[DEBUG] Reset button clicked - executing immediately!');
                                localStorage.removeItem('lbm_bankroll_state');
                                window.location.reload();
                            }}
                            style={{
                                background: 'rgba(239, 68, 68, 0.2)',
                                border: '1px solid rgba(239, 68, 68, 0.5)',
                                borderRadius: '8px',
                                padding: '0.4rem 0.8rem',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                color: 'var(--danger-color)',
                                fontWeight: 700
                            }}
                        >
                            🔄 SIFIRLA
                        </button>
                    </div>
                </div>
            </header>

            {view === 'ADMIN' ? (
                <AdminPanel lang={lang} />
            ) : (
                <>
                    {/* Bankroll Strategy Panel (Phase 13) */}
                    <div className="bankroll-binding-panel bankroll-ledger-container">
                        <div className="glass-panel" style={{ padding: '2rem', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '1px', color: 'var(--accent-color)' }}>{t.bankroll_panel}</h3>
                                <div className="engine-status-area" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.6 }}>{t.active_mod}: {bankrollManager.getModeLabel(lang)}</span>
                                    {bankState.current_mode === CONFIG.BANKROLL.HIERARCHY.MODES.NO_BET ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem 1.2rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', animation: 'pulse 2s infinite' }}>
                                            <span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }}></span>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '1px' }}>{t.no_bet} (STOP)</span>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem 1.2rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                                            <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></span>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '1px' }}>{t.active}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="metrics-grid">
                                <div className="br-metric">
                                    <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{t.current_balance}</span>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{bankState.current_balance.toLocaleString()} ₺</div>
                                </div>
                                <div className="br-metric">
                                    <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{t.daily_pl}</span>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: bankState.daily_pl >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                                        {bankState.daily_pl > 0 ? '+' : ''}{bankState.daily_pl.toLocaleString()} ₺
                                    </div>
                                </div>
                                <div className="br-metric">
                                    <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{t.active_mode}</span>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.5rem' }}>
                                        {bankrollManager.getModeLabel(lang)}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.75rem', color: 'var(--danger-color)', fontWeight: 600 }}>
                                <span style={{ marginRight: '0.5rem' }}>⚠️</span> {t.local_storage_warning}
                            </div>
                        </div>

                        {/* Mini Ledger */}
                        <div className="glass-panel ledger-view" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)', maxHeight: '250px', overflowY: 'auto' }}>
                            <h4 style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '1rem', opacity: 0.6, letterSpacing: '1px' }}>{t.ledger_title}</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.86rem' }}>
                                {bankState.ledger.slice(-10).reverse().map(entry => (
                                    <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem' }}>
                                        <div style={{ flexGrow: 1 }}>
                                            <span style={{
                                                color: entry.type.includes('WIN') ? 'var(--success-color)' : entry.type.includes('LOSS') ? 'var(--danger-color)' : 'var(--accent-color)',
                                                fontWeight: 800,
                                                marginRight: '0.8rem'
                                            }}>{t[`${entry.type.toLowerCase().replace('bet_', '').replace('system_', '')}_short`] || entry.type}</span>
                                            <span style={{ opacity: 0.8 }}>{entry.match_name || t[entry.reason] || entry.reason || t.system_event}</span>

                                            {entry.type === 'BET_OPEN' && (
                                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                    <button
                                                        onClick={() => { bankrollManager.processResult(entry.match_id, true, entry.stake_amount); setBankState(bankrollManager.getState()); }}
                                                        style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success-color)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '4px', fontSize: '0.6rem', padding: '0.2rem 0.6rem', cursor: 'pointer', fontWeight: 800 }}
                                                    >{t.win_btn}</button>
                                                    <button
                                                        onClick={() => { bankrollManager.processResult(entry.match_id, false, entry.stake_amount); setBankState(bankrollManager.getState()); }}
                                                        style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger-color)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '4px', fontSize: '0.6rem', padding: '0.2rem 0.6rem', cursor: 'pointer', fontWeight: 800 }}
                                                    >{t.loss_btn}</button>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ fontWeight: 700, textAlign: 'right', minWidth: '60px' }}>
                                            {entry.profit ? (entry.profit > 0 ? `+${entry.profit}` : entry.profit) : (entry.stake_amount ? `-${entry.stake_amount}` : '')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Health Monitor */}
                    <div className="glass-panel health-monitor" style={{ marginBottom: '3rem', padding: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '3rem' }}>
                            <div className="status-indicator" style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(16, 185, 129, 0.05)', padding: '0.8rem 1.5rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                <div className="pulse" style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success-color)', boxShadow: '0 0 10px var(--success-color)' }}></div>
                                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>{t.system_status}: {t.active}</span>
                            </div>

                            <div className="health-metrics-grid">
                                <div className="metric">
                                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.5, letterSpacing: '1px' }}>{t.last_update}</div>
                                    <div className={lastFetchSeconds > 15 ? 'danger' : 'success'} style={{ fontWeight: 800, fontSize: '1.1rem', marginTop: '0.3rem' }}>
                                        {lastFetchSeconds} <span style={{ fontSize: '0.8rem' }}>{t.seconds_ago}</span>
                                    </div>
                                </div>
                                <div className="metric">
                                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.5, letterSpacing: '1px' }}>{t.live_matches}</div>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem', marginTop: '0.3rem' }}>{dataWorker.healthStats.totalDiscovered}</div>
                                </div>
                                <div className="metric">
                                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.5, letterSpacing: '1px' }}>{t.dqs_filter}</div>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem', marginTop: '0.3rem' }}>
                                        <span style={{ color: 'var(--success-color)' }}>{dataWorker.healthStats.dqsAbove}</span> <span style={{ opacity: 0.3 }}>/</span> <span style={{ opacity: 0.5 }}>{dataWorker.healthStats.dqsBelow}</span>
                                    </div>
                                </div>
                                <div className="metric">
                                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.5, letterSpacing: '1px' }}>{t.security_nobet}</div>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem', marginTop: '0.3rem', color: dataWorker.healthStats.noBetCount > 0 ? 'var(--warning-color)' : 'inherit' }}>
                                        {dataWorker.healthStats.noBetCount} <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{t.triggered}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="engine-controls" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <select
                                    value={decisionMode}
                                    onChange={(e) => { dataWorker.decisionMode = e.target.value; setDecisionMode(e.target.value); }}
                                    style={{ background: 'rgba(15, 23, 42, 0.9)', color: 'var(--accent-color)', border: '1px solid var(--accent-color)', borderRadius: '10px', padding: '0.6rem 1.2rem', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', outline: 'none' }}
                                >
                                    <option value={CONFIG.DECISION.MODES.CORE_DQS}>{t.mode_core_label}</option>
                                    <option value={CONFIG.DECISION.MODES.DQS_RISK}>{t.mode_risk_label}</option>
                                    <option value={CONFIG.DECISION.MODES.FULL_STACK}>{t.mode_full_label}</option>
                                </select>
                                <div style={{ textAlign: 'right', fontSize: '0.7rem', paddingRight: '0.5rem' }}>
                                    <span style={{ color: 'var(--accent-color)', fontWeight: 700 }}>{dataWorker.dataSource}</span>
                                    <span style={{ opacity: 0.4, marginLeft: '0.5rem' }}>{t.settings_frozen}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tier Filter Bar */}
                    <div className="tier-filter-bar" style={{ display: 'flex', gap: '1.5rem', marginBottom: '4rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                        {['ALL', 1, 2, 3].map(tier => (
                            <button
                                key={tier}
                                onClick={() => setActiveTierFilter(tier)}
                                style={{
                                    background: activeTierFilter === tier ? 'var(--accent-color)' : 'rgba(255,255,255,0.02)',
                                    color: activeTierFilter === tier ? '#000' : 'var(--text-secondary)',
                                    border: '1px solid ' + (activeTierFilter === tier ? 'var(--accent-color)' : 'var(--glass-border)'),
                                    borderRadius: '12px',
                                    padding: '0.8rem 1.5rem',
                                    fontSize: '0.85rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: activeTierFilter === tier ? '0 0 20px var(--accent-glow)' : 'none',
                                }}
                            >
                                {tier === 'ALL' ? t.tier_filter_all : t[`tier_${tier}_label`]}
                            </button>
                        ))}
                    </div>

                    {/* Analysis Candidates */}
                    <section className="dashboard-section" style={{ marginBottom: '5rem' }}>
                        <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px' }}>DQS {t.analysis_candidates}</h2>
                            <span style={{ padding: '0.3rem 0.8rem', borderRadius: '8px', background: 'var(--success-color)', color: '#000', fontSize: '0.75rem', fontWeight: 800 }}>{eligibleMatches.filter(filterByTier).length}</span>
                        </div>
                        {/* Active Matches Grid */}
                        <div className="match-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                            gap: '2rem',
                            marginBottom: '4rem'
                        }}>
                            {eligibleMatches.filter(filterByTier).map(match => {
                                const signal = signals[match.id];
                                if (!signal) return null;
                                const isVip = match.tier === 1;
                                return (
                                    <div key={match.id} className={`match-card glass-panel ${isVip ? 'vip-glow' : ''}`} style={{
                                        padding: '2rem',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        border: isVip ? '1px solid var(--success-color)' : '1px solid var(--glass-border)',
                                        boxShadow: isVip ? '0 0 20px rgba(16, 185, 129, 0.15)' : 'none'
                                    }} onClick={() => setSelectedMatch(match)}>
                                        {isVip && (
                                            <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--success-color)', color: '#000', padding: '0.2rem 1rem', fontSize: '0.6rem', fontWeight: 900, borderBottomLeftRadius: '10px', letterSpacing: '1px' }}>VIP</div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                            <div>
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{match.homeTeam} <span style={{ opacity: 0.3 }}>vs</span> {match.awayTeam}</h3>
                                                <div className="match-meta" style={{ marginTop: '0.5rem' }}>
                                                    <span style={{ fontSize: '0.9rem', color: 'var(--accent-color)', fontWeight: 800 }}>
                                                        {match.minute?.includes('HT') || match.minute?.includes('Halftime') ? t.halftime_short :
                                                            (match.minute?.includes('half') || match.minute?.includes('Half')) ? match.minute :
                                                                (match.minute ? (match.minute.toString().replace("'", "") + '. ' + t.minute_label) : ("0'"))}
                                                        <span style={{ opacity: 0.5, margin: '0 0.5rem' }}>|</span>
                                                        {match.score.home} - {match.score.away}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={`tier-badge tier-${match.tier}`} style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, background: match.tier === 1 ? 'var(--success-color)' : match.tier === 2 ? 'var(--warning-color)' : 'var(--text-secondary)', color: '#000' }}>TIER {match.tier}</span>
                                        </div>

                                        {/* Match Stats & Status */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.6rem', opacity: 0.4, textTransform: 'uppercase', marginBottom: '0.4rem' }}>{t.shots_on_target || 'SOG'}</div>
                                                <div style={{ fontWeight: 800, color: 'var(--success-color)' }}>
                                                    {match.stats?.shotsOnGoal?.home || 0} - {match.stats?.shotsOnGoal?.away || 0}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ fontSize: '0.6rem', opacity: 0.4, textTransform: 'uppercase', marginBottom: '0.4rem' }}>{t.dangerous_attacks || 'DA'}</div>
                                                <div style={{ fontWeight: 800, color: '#ff9800' }}>
                                                    {match.stats?.dangerousAttacks?.home || 0} - {match.stats?.dangerousAttacks?.away || 0}
                                                </div>
                                            </div>
                                            {match.stats?.xg && (match.stats.xg.home > 0 || match.stats.xg.away > 0) && (
                                                <div style={{ textAlign: 'center', gridColumn: 'span 2', marginTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.6rem' }}>
                                                    <div style={{ fontSize: '0.6rem', opacity: 0.4, textTransform: 'uppercase', marginBottom: '0.2rem' }}>xG (Expected Goals)</div>
                                                    <div style={{ fontWeight: 800, color: 'var(--warning-color)', fontSize: '0.9rem' }}>
                                                        {match.stats.xg.home.toFixed(2)} - {match.stats.xg.away.toFixed(2)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Partial Data Indicator */}
                                        {match.isPartial && (
                                            <div style={{
                                                padding: '0.5rem',
                                                background: 'rgba(255, 152, 0, 0.1)',
                                                borderRadius: '8px',
                                                fontSize: '0.65rem',
                                                color: '#ff9800',
                                                marginBottom: '1rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                border: '1px solid rgba(255, 152, 0, 0.2)'
                                            }}>
                                                <span style={{ fontSize: '1rem' }}>⚠️</span>
                                                {t.partial_data_warning || 'Temel veri kullanılıyor, detaylar yükleniyor...'}
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 600 }}>{t.dqs_score_label.replace(':', '')}: <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{(match.dqs || 0).toFixed(2)}</span></div>
                                            <div style={{
                                                padding: '0.5rem 1.2rem',
                                                borderRadius: '8px',
                                                background: signal.verdict === 'BET' ? 'var(--success-color)' : 'rgba(255,255,255,0.05)',
                                                color: signal.verdict === 'BET' ? '#000' : 'var(--text-secondary)',
                                                fontWeight: 800,
                                                fontSize: '0.8rem',
                                                letterSpacing: '1px'
                                            }}>
                                                {signal.verdict === 'BET' ? t.verdict_bet : t.verdict_pass}
                                            </div>
                                        </div>

                                        {signal.verdict === 'BET' && (
                                            <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                                                    <span style={{ fontSize: '0.65rem', opacity: 0.5, display: 'block' }}>{t.recom_stake_short}</span>
                                                    <span style={{ fontWeight: 800, color: 'var(--accent-color)' }}>{bankrollManager.calculateRecommendedStake(match, signal)} ₺</span>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const stake = bankrollManager.calculateRecommendedStake(match, signal);
                                                        if (bankrollManager.approveBet(match, signal, stake)) {
                                                            alert(t.bet_approved_alert);
                                                            setBankState(bankrollManager.getState());
                                                        }
                                                    }}
                                                    style={{ background: 'var(--accent-color)', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer' }}
                                                >
                                                    {t.approve_bet}
                                                </button>
                                            </div>
                                        )}

                                        {signal.verdict === 'PASS' && (
                                            <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: signal.reasonKey === 'bankroll_stop' ? 'var(--danger-color)' : 'var(--warning-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                                                <span style={{ opacity: 0.6 }}>{signal.reasonKey === 'bankroll_stop' ? '🛑' : '⚠️'}</span> {t[signal.reasonKey] || signal.mainReason}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Observation Only */}
                    <section className="dashboard-section observational" style={{ marginBottom: '5rem', opacity: 0.7 }}>
                        <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, opacity: 0.7 }}>{t.observation_only}</h2>
                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 800 }}>{observationMatches.filter(filterByTier).length}</span>
                        </div>
                        <div className="matches-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                            {observationMatches.filter(filterByTier).map(match => (
                                <div key={match.id} className="match-card glass-panel" style={{ padding: '1.5rem', filter: 'grayscale(1)', opacity: 0.5 }} onClick={() => setSelectedMatch(match)}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{match.homeTeam} vs {match.awayTeam}</h4>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                                                {match.minute?.includes('HT') || match.minute?.includes('Halftime') ? t.halftime_short :
                                                    (match.minute?.includes('half') || match.minute?.includes('Half')) ? match.minute :
                                                        (match.minute ? (match.minute.toString().replace("'", "") + '. ' + t.minute_label) : "0'")}
                                                {match.score.home} - {match.score.away}
                                                {match.stats?.xg && (match.stats.xg.home > 0 || match.stats.xg.away > 0) && (
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--warning-color)', marginLeft: '0.5rem', fontWeight: 800 }}>
                                                        (xG {match.stats.xg.home.toFixed(2)} - {match.stats.xg.away.toFixed(2)})
                                                    </span>
                                                )}
                                                {match.isPartial && (
                                                    <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginLeft: '0.8rem', opacity: 0.5 }}>
                                                        [BASIC]
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.6 }}>{t.dqs_label} {(match.dqs || 0).toFixed(2)}</div>
                                            <div style={{ fontSize: '0.6rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--danger-color)' }}>{t.rejected.toUpperCase()}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Tier 3 Performance Monitor */}
                        {Object.keys(dataWorker.tier3Performance).length > 0 && (
                            <div className="glass-panel" style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(56, 189, 248, 0.03)', border: '1px solid rgba(56, 189, 248, 0.1)' }}>
                                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--accent-color)' }}>{t.tier3_monitor_title}</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                    {Object.entries(dataWorker.tier3Performance).map(([league, stats]) => {
                                        const winRate = stats.totalObserved > 0 ? (stats.potentialWins / stats.totalObserved * 100).toFixed(0) : 0;
                                        return (
                                            <div key={league} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', fontSize: '0.75rem' }}>
                                                <div style={{ fontWeight: 800, marginBottom: '0.3rem' }}>{league}</div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ opacity: 0.6 }}>{t.est_success}</span>
                                                    <span style={{ color: winRate > 70 ? 'var(--success-color)' : 'inherit', fontWeight: 800 }}>%{winRate}</span>
                                                </div>
                                                {winRate > 75 && (
                                                    <div style={{ marginTop: '0.5rem', fontSize: '0.6rem', color: 'var(--warning-color)', fontWeight: 800 }}>↑ {t.promotion_candidate}</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Raw Data Explorer */}
                    <section className="dashboard-section explorer" style={{ marginBottom: '5rem' }}>
                        <div className="section-header" style={{ marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{t.raw_data_explorer}</h2>
                        </div>
                        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--glass-border)' }}>
                                            <th style={{ padding: '1.5rem 2rem', color: 'var(--accent-color)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '2px', fontWeight: 800 }}>{t.match_score}</th>
                                            <th style={{ padding: '1.5rem 1rem', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '2px', fontWeight: 800 }}>{t.minute_short}</th>
                                            <th style={{ padding: '1rem', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '2px', fontWeight: 800 }}>{t.dqs}</th>
                                            <th style={{ padding: '1rem', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '2px', fontWeight: 800 }}>{t.tier_label}</th>
                                            <th style={{ padding: '1rem', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '2px', fontWeight: 800 }}>{t.sog}</th>
                                            <th style={{ padding: '1.5rem 2rem', textAlign: 'right', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '2px', fontWeight: 800 }}>{t.status}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {matches.map(m => (
                                            <tr key={m.id} onClick={() => setSelectedMatch(m)} style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                                <td style={{ padding: '1.5rem 2rem' }}>
                                                    <div style={{ fontWeight: 800 }}>{m.homeTeam} <span style={{ opacity: 0.3 }}>-</span> {m.awayTeam}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)', marginTop: '0.25rem', fontWeight: 600 }}>{m.score.home} : {m.score.away}</div>
                                                </td>
                                                <td style={{ padding: '1.5rem 1rem', fontWeight: 800 }}>{m.minute?.includes('half') || m.minute?.includes('Half') || m.minute?.includes('HT') ? m.minute : (m.minute ? m.minute + "'" : "0'")}</td>
                                                <td style={{ padding: '1rem', fontWeight: 800, color: (m.dqs || 0) >= CONFIG.DECISION.DQS_THRESHOLD ? 'var(--success-color)' : 'var(--danger-color)' }}>
                                                    {m.dqs ? m.dqs.toFixed(2) : '0.00'}
                                                </td>
                                                <td style={{ padding: '1rem' }}><span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>T{m.tier}</span></td>
                                                <td style={{ padding: '1rem', opacity: 0.7, fontWeight: 700 }}>{m.stats?.shotsOnGoal?.home || 0} <span style={{ opacity: 0.3 }}>/</span> {m.stats?.shotsOnGoal?.away || 0}</td>
                                                <td style={{ padding: '1.5rem 2rem', textAlign: 'right' }}>
                                                    <span style={{
                                                        padding: '0.4rem 0.8rem',
                                                        borderRadius: '6px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 800,
                                                        background: (m.dqs || 0) >= CONFIG.DECISION.DQS_THRESHOLD ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                        color: (m.dqs || 0) >= CONFIG.DECISION.DQS_THRESHOLD ? 'var(--success-color)' : 'var(--danger-color)',
                                                        border: `1px solid ${(m.dqs || 0) >= CONFIG.DECISION.DQS_THRESHOLD ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                                                    }}>
                                                        {(m.dqs || 0) >= CONFIG.DECISION.DQS_THRESHOLD ? t.in_analysis : t.rejected}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    {/* Match Details Modal */}
                    {selectedMatch && (
                        (() => {
                            const currentMatch = matches.find(m => m.id === selectedMatch?.id) || selectedMatch;
                            if (!currentMatch) return null;

                            return (
                                <div className="modal-overlay" onClick={() => setSelectedMatch(null)}>
                                    <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
                                        <button className="close-btn" onClick={() => setSelectedMatch(null)}>×</button>

                                        <div className="modal-header">
                                            <div className="header-top">
                                                <span className="label-text">MAÇ İSTİHBARAT RAPORU</span>
                                                <h2>{currentMatch.homeTeam} vs {currentMatch.awayTeam}</h2>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                                                    <span className="tier-badge">TIER {currentMatch.tier}</span>
                                                    <span className="minute-badge">{currentMatch.minute}'</span>
                                                    <span className="score-badge">{currentMatch.score.home} - {currentMatch.score.away}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="modal-grid">
                                            {/* Column 1: Engine Quality */}
                                            <div className="grid-col">
                                                <h3><span style={{ marginRight: '0.5rem' }}>⚡</span> DQS MOTORU</h3>
                                                <div className="stats-card">
                                                    <div className="dqs-display">
                                                        <div className="dqs-label">
                                                            <span>DQS Skoru:</span>
                                                            <span style={{ color: 'var(--accent-color)', fontWeight: 800 }}>{currentMatch.dqs.toFixed(4)}</span>
                                                        </div>
                                                        <div className="dqs-bar-bg">
                                                            <div className="dqs-bar-fill" style={{ width: `${currentMatch.dqs * 100}%` }}></div>
                                                        </div>
                                                    </div>

                                                    <div className="stat-row-pill" style={{ marginTop: '1.5rem' }}>
                                                        <span style={{ opacity: 0.6 }}>LATANS:</span>
                                                        <span style={{ fontWeight: 700 }}>{currentMatch.latency || 0}ms</span>
                                                    </div>

                                                    <div className="stat-row-pill" style={{ marginTop: '1rem' }}>
                                                        <span style={{ opacity: 0.6 }}>{t.data_integrity}:</span>
                                                        <span className={`status-pill ${currentMatch.dataQuality === 'OK' ? 'ok' : (currentMatch.dataQuality === 'LIMITED' ? 'warning' : 'fail')}`}>
                                                            {currentMatch.dataQuality === 'PARTIAL' ? 'BEKLENİYOR' : (currentMatch.dataQuality === 'LIMITED' ? 'KISITLI' : 'TAM')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Column 2: Risk Analysis */}
                                            <div className="grid-col">
                                                <h3><span style={{ marginRight: '0.5rem' }}>🛡️</span> {t.risk_guard}</h3>
                                                <div className="stats-card">
                                                    {Object.entries(dataWorker.checkRiskFilters(currentMatch)).map(([key, f]) => (
                                                        <div key={key} className="stat-row-pill" style={{ marginBottom: '0.8rem' }}>
                                                            <span style={{ opacity: 0.8 }}>{t[key] || key}</span>
                                                            <span className={`status-pill ${f.status === 'OK' ? 'ok' : f.status === 'FAIL' ? 'fail' : 'warning'}`}>
                                                                {f.status === 'OK' ? t.status_ok : t.status_fail}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    <div style={{ marginTop: '1.5rem', padding: '0.8rem', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '8px', border: '1px dotted var(--accent-color)', fontSize: '0.7rem', opacity: 0.8 }}>
                                                        {t.analysis_protocol_active}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Column 3: Live Snapshot */}
                                            <div className="grid-col">
                                                <h3><span style={{ marginRight: '0.5rem' }}>📊</span> {t.stats_title}</h3>
                                                <div className="stats-card" style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                                    {currentMatch.stats?.groups && currentMatch.stats.groups.length > 0 ? (
                                                        currentMatch.stats.groups.map(group => (
                                                            <div key={group.groupName} style={{ marginBottom: '1.8rem' }}>
                                                                <h4 style={{ fontSize: '0.6rem', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.8rem', paddingBottom: '0.3rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--accent-color)' }}>
                                                                    {t[group.groupName] || group.groupName}
                                                                </h4>
                                                                {group.statisticsItems.map(item => {
                                                                    const parseVal = (v) => {
                                                                        if (typeof v === 'string') return parseFloat(v.replace('%', '')) || 0;
                                                                        return parseFloat(v) || 0;
                                                                    };
                                                                    const homeVal = parseVal(item.home);
                                                                    const awayVal = parseVal(item.away);
                                                                    const total = homeVal + awayVal;
                                                                    const homePct = total > 0 ? (homeVal / total) * 100 : 50;

                                                                    const isXG = item.name.toLowerCase().includes('expected') || item.name.toLowerCase() === 'xg';

                                                                    return (
                                                                        <div key={item.name} className="stat-item" style={{ marginBottom: '1rem' }}>
                                                                            <div className="stat-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.75rem' }}>
                                                                                <span style={{ opacity: 0.8, color: isXG ? 'var(--warning-color)' : 'inherit' }}>
                                                                                    {t[item.name] || item.name}
                                                                                </span>
                                                                                <span style={{ fontWeight: 800 }}>
                                                                                    {isXG ? `${homeVal.toFixed(2)} - ${awayVal.toFixed(2)}` : `${item.home} - ${item.away}`}
                                                                                </span>
                                                                            </div>
                                                                            <div className="stat-bar-bg" style={{ display: 'flex', height: '3px', borderRadius: '1.5px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                                                                <div className="stat-bar-home" style={{ width: `${homePct}%`, background: isXG ? 'var(--warning-color)' : 'var(--accent-color)', height: '100%', transition: 'width 0.5s ease' }}></div>
                                                                                <div className="stat-bar-away" style={{ width: `${100 - homePct}%`, background: 'rgba(255,255,255,0.15)', height: '100%', transition: 'width 0.5s ease' }}></div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
                                                            {currentMatch.isPartial ? (t.loading_stats || 'Detaylar yükleniyor...') : (t.no_stats_available || 'İstatistik verisi bulunamadı')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)' }}>
                                            <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', opacity: 0.5 }}>
                                                <span style={{ width: '8px', height: '8px', background: 'var(--success-color)', borderRadius: '50%' }}></span>
                                                {t.live_feed_connected}
                                            </div>
                                            <button
                                                onClick={() => setSelectedMatch(null)}
                                                className="btn btn-outline"
                                                style={{ padding: '0.8rem 2rem', borderRadius: '10px' }}
                                            >
                                                {t.close_intelligence}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()
                    )}

                    {showFAQ && <FAQ onClose={() => setShowFAQ(false)} lang={lang} />}

                    {showAdvanced && (
                        <div className="modal-overlay" onClick={() => setShowAdvanced(false)}>
                            <div className="modal-content settings glass-panel" onClick={e => e.stopPropagation()}>
                                <button className="close-btn" onClick={() => setShowAdvanced(false)}>×</button>
                                <h2>{t.advanced_settings_title}</h2>

                                <div className="settings-list">
                                    {[
                                        { id: 'XG_ANALYSIS', label: t.toggle_xg },
                                        { id: 'BAYESIAN_PRICING', label: t.toggle_bayesian },
                                        { id: 'LEAGUE_PROFILES', label: t.toggle_league_profiles }
                                    ].map(setting => (
                                        <div key={setting.id} className="setting-item">
                                            <span>{setting.label}</span>
                                            <div
                                                className={`toggle ${advancedSettings[setting.id] ? 'on' : ''}`}
                                                onClick={() => {
                                                    const newVal = !advancedSettings[setting.id];
                                                    setAdvancedSettings(prev => ({ ...prev, [setting.id]: newVal }));
                                                    CONFIG.MODULAR_SYSTEM.OPTIONAL_MODULES[setting.id] = newVal;
                                                }}
                                            ><div className="knob"></div></div>
                                        </div>
                                    ))}
                                </div>

                                <div className="league-management">
                                    <h4>{t.league_tier_management}</h4>
                                    {['tier1', 'tier2'].map(tierKey => (
                                        <div key={tierKey} className="tier-group">
                                            <label>{tierKey === 'tier1' ? t.tier_1_label : t.tier_2_label}</label>
                                            <div className="leagues">
                                                {leagueTierMap[tierKey].map(league => (
                                                    <span key={league} className="league-chip" onClick={() => {
                                                        const otherTier = tierKey === 'tier1' ? 'tier2' : 'tier1';
                                                        const newMap = { ...leagueTierMap };
                                                        newMap[tierKey] = newMap[tierKey].filter(l => l !== league);
                                                        newMap[otherTier].push(league);
                                                        setLeagueTierMap(newMap);
                                                        CONFIG.MODULAR_SYSTEM.LEAGUE_TIERS.TIER_1 = newMap.tier1;
                                                        CONFIG.MODULAR_SYSTEM.LEAGUE_TIERS.TIER_2 = newMap.tier2;
                                                    }}>{league} ⇄</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
