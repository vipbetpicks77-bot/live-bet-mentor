import React, { useState, useEffect } from 'react';
import { CONFIG } from '../config';
import { dataWorker } from '../backend/dataWorker';
import { bankrollManager } from '../logic/bankrollManager';
import { FAQ } from './FAQ';
import { translations } from '../locales/translations';
import { AdminPanel } from './AdminPanel';
import { consensusAdapter } from '../backend/consensusAdapter';
import '../styles/global.css';

const RADAR_SOURCES = [
    { id: 'forebet', label: 'Forebet', color: '#34d399' },
    { id: 'prosoccer', label: 'ProSoccer', color: '#38bdf8' },
    { id: 'predictz', label: 'PredictZ', color: '#f87171' },
    { id: 'windrawwin', label: 'WDW', color: '#60a5fa' },
    { id: 'statarea', label: 'Statarea', color: '#fbbf24' },
    { id: 'vitibet', label: 'Vitibet', color: '#a78bfa' },
    { id: 'zulubet', label: 'Zulubet', color: '#f472b6' },
    { id: 'olbg', label: 'OLBG', color: '#00f2fe' }
];

const RADAR_BASE_URLS = {
    forebet: 'https://www.forebet.com',
    predictz: 'https://www.predictz.com',
    windrawwin: 'https://www.windrawwin.com',
    statarea: 'https://www.statarea.com',
    vitibet: 'https://www.vitibet.com',
    zulubet: 'https://www.zulubet.com',
    prosoccer: 'https://www.prosoccer.eu',
    olbg: 'https://www.olbg.com/betting-tips/Football/1'
};

export const Dashboard = ({ user, onLogout }) => {
    const [matches, setMatches] = useState([]);
    const [signals, setSignals] = useState({});
    const [bankState, setBankState] = useState(bankrollManager.getState());
    const [lastFetchSeconds, setLastFetchSeconds] = useState(0);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [decisionMode, setDecisionMode] = useState(dataWorker.decisionMode);
    const [showFAQ, setShowFAQ] = useState(false);
    const [faqMode, setFaqMode] = useState('live');
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
    const [view, setView] = useState('DASHBOARD'); // 'DASHBOARD', 'ADMIN', 'RADAR'
    const [consensusData, setConsensusData] = useState({});

    // Radar Filters State
    const [radarFilters, setRadarFilters] = useState({
        sources: ['forebet', 'predictz', 'windrawwin', 'statarea', 'vitibet', 'zulubet', 'prosoccer', 'olbg'],
        minSources: 1,
        search: '',
        valueOnly: false,
        hideDivergent: false,
        todayOnly: true
    });
    const [selectedMarket, setSelectedMarket] = useState('1X2');

    const radarMatches = React.useMemo(() => {
        return consensusAdapter.getAllConsensusSummary(consensusData, selectedMarket);
    }, [consensusData, selectedMarket]);

    const filteredRadarMatches = React.useMemo(() => {
        return radarMatches.filter(m => {
            const matchSourceIds = Object.keys(m.predictions);
            const activeMatchSources = matchSourceIds.filter(s => radarFilters.sources.includes(s));

            if (activeMatchSources.length === 0) return false;
            if (activeMatchSources.length < radarFilters.minSources) return false;

            if (radarFilters.valueOnly && !m.isValue) return false;
            if (radarFilters.hideDivergent && m.divergence > CONFIG.MODULAR_SYSTEM.ADVANCED_ANALYSIS.DIVERGENCE_RADAR.THRESHOLD) return false;

            if (radarFilters.search) {
                const query = radarFilters.search.toLowerCase();
                return m.home.toLowerCase().includes(query) ||
                    m.away.toLowerCase().includes(query) ||
                    (m.league && m.league.toLowerCase().includes(query));
            }

            if (radarFilters.todayOnly) {
                const d = new Date();
                const todayStr = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
                if (m.date !== todayStr) return false;
            }

            return true;
        });
    }, [radarMatches, radarFilters]);

    const isAdmin = user?.email === 'karabulut.hamza@gmail.com';

    const t = translations[lang];

    useEffect(() => {
        if (selectedMatch) {
            dataWorker.setSelectedMatch(selectedMatch.id);
        } else {
            dataWorker.setSelectedMatch(null);
        }
    }, [selectedMatch]);

    useEffect(() => {
        dataWorker.start();
        const interval = setInterval(() => {
            // ALWAYS sync consensus data regardless of live matches
            const freshConsensus = { ...dataWorker.consensusData };
            console.log('[DASHBOARD] Syncing Consensus Data:', Object.entries(freshConsensus).map(([k, v]) => `${k}:${v?.length}`).join(', '));
            setConsensusData(freshConsensus);

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
                        <button onClick={() => { setFaqMode('live'); setShowFAQ(true); }} className="faq-btn" style={{ width: '1.8rem', height: '1.8rem', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--glass-border)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem' }}>?</button>
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
                                onClick={() => setView('RADAR')}
                                style={{
                                    padding: '0.4rem 0.8rem',
                                    fontSize: '0.65rem',
                                    cursor: 'pointer',
                                    background: view === 'RADAR' ? 'var(--accent-color)' : 'transparent',
                                    color: view === 'RADAR' ? '#000' : 'var(--text-secondary)',
                                    border: 'none',
                                    borderRadius: '7px',
                                    fontWeight: 800,
                                    transition: 'all 0.2s'
                                }}
                            >🎯</button>
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
            ) : view === 'RADAR' ? (
                <div className="radar-view" style={{ animation: 'fadeIn 0.5s ease-out' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem', flexWrap: 'wrap', gap: '2rem' }}>
                        <div>
                            <h3 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px' }}>
                                <span style={{ marginRight: '1rem' }}>🎯</span>
                                {t.daily_radar || 'GÜNLÜK RADAR (PRE-MATCH)'}
                            </h3>
                            <div style={{ marginTop: '0.5rem', opacity: 0.6, fontSize: '0.85rem' }}>
                                {filteredRadarMatches.length} / {radarMatches.length} {t.matches_found || 'Maç Bulundu'}
                            </div>

                            {/* Market Selector Tabs */}
                            <div className="market-tabs" style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                                {[
                                    { id: '1X2', label: '1X2', icon: '🎯' },
                                    { id: 'OU25', label: lang === 'tr' ? 'Alt/Üst 2.5' : 'Over/Under 2.5', icon: '📊' },
                                    { id: 'BTTS', label: lang === 'tr' ? 'KG Var/Yok' : 'Both Teams to Score', icon: '🔥' }
                                ].map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setSelectedMarket(m.id)}
                                        style={{
                                            padding: '0.6rem 1.2rem',
                                            borderRadius: '10px',
                                            border: '1px solid ' + (selectedMarket === m.id ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)'),
                                            background: selectedMarket === m.id ? 'var(--accent-color)' : 'rgba(255,255,255,0.03)',
                                            color: selectedMarket === m.id ? '#000' : 'var(--text-secondary)',
                                            fontSize: '0.75rem',
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <span>{m.icon}</span> {m.label}
                                    </button>
                                ))}

                                <button
                                    onClick={() => { setFaqMode('radar'); setShowFAQ(true); }}
                                    style={{
                                        padding: '0.6rem 1.2rem',
                                        borderRadius: '10px',
                                        border: '1px solid var(--accent-color)',
                                        background: 'rgba(0, 242, 254, 0.05)',
                                        color: 'var(--accent-color)',
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        marginLeft: '1.5rem'
                                    }}
                                >
                                    <span>❓</span> {lang === 'tr' ? 'Ortak Akıl Rehberi' : 'Consensus Guide'}
                                </button>
                            </div>
                        </div>

                        {/* Radar Filter Bar */}
                        <div className="glass-panel" style={{
                            padding: '1.2rem 2rem',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '16px',
                            border: '1px solid var(--glass-border)',
                            display: 'flex',
                            gap: '2rem',
                            alignItems: 'center',
                            flexWrap: 'wrap'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.5, letterSpacing: '1px' }}>{t.source_selection}</span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {RADAR_SOURCES.map(source => {
                                        const isActive = radarFilters.sources.includes(source.id);
                                        return (
                                            <button
                                                key={source.id}
                                                onClick={(e) => {
                                                    const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
                                                    setRadarFilters(prev => {
                                                        if (isMultiSelect) {
                                                            // Toggle logic for multi-select
                                                            return {
                                                                ...prev,
                                                                sources: isActive
                                                                    ? prev.sources.filter(s => s !== source.id)
                                                                    : [...prev.sources, source.id]
                                                            };
                                                        } else {
                                                            // Single-select focus (standard click)
                                                            // If already active and only one, keep it OR if many, focus this one
                                                            return {
                                                                ...prev,
                                                                sources: [source.id]
                                                            };
                                                        }
                                                    });
                                                }}
                                                style={{
                                                    background: isActive ? source.color + '22' : 'rgba(255,255,255,0.03)',
                                                    color: isActive ? source.color : 'rgba(255,255,255,0.3)',
                                                    border: `1px solid ${isActive ? source.color + '66' : 'rgba(255,255,255,0.1)'}`,
                                                    borderRadius: '8px',
                                                    padding: '0.4rem 0.8rem',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 800,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {source.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' }}></div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.5, letterSpacing: '1px' }}>{t.min_sources}</span>
                                <select
                                    value={radarFilters.minSources}
                                    onChange={(e) => setRadarFilters(prev => ({ ...prev, minSources: parseInt(e.target.value) }))}
                                    style={{
                                        background: 'rgba(0,0,0,0.2)',
                                        color: '#fff',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        padding: '0.4rem',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        outline: 'none'
                                    }}
                                >
                                    {[1, 2, 3, 4, 5, 6].map(n => (
                                        <option key={n} value={n}>{n}+ Source</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.5, letterSpacing: '1px' }}>{t.search_label || 'ARA'}</span>
                                <input
                                    type="text"
                                    placeholder={t.search_team}
                                    value={radarFilters.search}
                                    onChange={(e) => setRadarFilters(prev => ({ ...prev, search: e.target.value }))}
                                    style={{
                                        background: 'rgba(0,0,0,0.2)',
                                        color: '#fff',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        padding: '0.4rem 1rem',
                                        fontSize: '0.75rem',
                                        width: '180px',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.2rem' }}>
                                <button
                                    onClick={() => setRadarFilters(prev => ({ ...prev, valueOnly: !prev.valueOnly }))}
                                    style={{
                                        background: radarFilters.valueOnly ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)',
                                        color: radarFilters.valueOnly ? 'var(--success-color)' : 'rgba(255,255,255,0.3)',
                                        border: `1px solid ${radarFilters.valueOnly ? 'var(--success-color)' : 'rgba(255,255,255,0.1)'}`,
                                        borderRadius: '8px', padding: '0.4rem 0.8rem', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer'
                                    }}
                                >💎 VALUE</button>
                                <button
                                    onClick={() => setRadarFilters(prev => ({ ...prev, hideDivergent: !prev.hideDivergent }))}
                                    style={{
                                        background: radarFilters.hideDivergent ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255,255,255,0.03)',
                                        color: radarFilters.hideDivergent ? 'var(--danger-color)' : 'rgba(255,255,255,0.3)',
                                        border: `1px solid ${radarFilters.hideDivergent ? 'var(--danger-color)' : 'rgba(255,255,255,0.1)'}`,
                                        borderRadius: '8px', padding: '0.4rem 0.8rem', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer'
                                    }}
                                >⚠️ SAFE MODE</button>
                                <button
                                    onClick={() => setRadarFilters(prev => ({ ...prev, todayOnly: !prev.todayOnly }))}
                                    style={{
                                        background: radarFilters.todayOnly ? 'rgba(124, 58, 237, 0.2)' : 'rgba(255,255,255,0.03)',
                                        color: radarFilters.todayOnly ? '#a78bfa' : 'rgba(255,255,255,0.3)',
                                        border: `1px solid ${radarFilters.todayOnly ? '#a78bfa66' : 'rgba(255,255,255,0.1)'}`,
                                        borderRadius: '8px', padding: '0.4rem 0.8rem', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer'
                                    }}
                                >📅 {radarFilters.todayOnly ? (lang === 'tr' ? 'BUGÜN' : 'TODAY') : (lang === 'tr' ? 'HEPSİ' : 'ALL')}</button>
                            </div>

                            <button
                                onClick={() => setRadarFilters({
                                    sources: RADAR_SOURCES.map(s => s.id),
                                    minSources: 1,
                                    search: '',
                                    valueOnly: false,
                                    hideDivergent: false,
                                    todayOnly: true
                                })}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--accent-color)',
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    marginTop: '1.2rem',
                                    opacity: 0.7
                                }}
                            >
                                {t.clear_filters}
                            </button>
                        </div>
                    </div>

                    <div className="radar-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                        gap: '2rem'
                    }}>
                        {filteredRadarMatches.length > 0 ? (
                            filteredRadarMatches.map(s => {
                                const maxAgreement = Math.max(...Object.values(s.agreement));
                                const agreementPercent = (maxAgreement / s.totalSources) * 100;
                                const consensusPred = Object.entries(s.agreement).find(([p, c]) => c === maxAgreement)?.[0];

                                return (
                                    <div
                                        key={s.match}
                                        className="radar-card glass-panel"
                                        onClick={() => s.forebetUrl && window.open(s.forebetUrl, '_blank')}
                                        style={{
                                            padding: '2rem',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                            border: s.totalSources >= 6 ? '2px solid var(--accent-color)' : '1px solid var(--glass-border)',
                                            boxShadow: s.totalSources >= 7
                                                ? '0 10px 30px rgba(0, 242, 254, 0.2), 0 0 15px rgba(0, 242, 254, 0.1)'
                                                : (s.totalSources >= 6 ? '0 5px 20px rgba(0, 242, 254, 0.1)' : 'none'),
                                            background: 'rgba(15, 23, 42, 0.4)',
                                            cursor: s.forebetUrl ? 'pointer' : 'default',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (s.forebetUrl) {
                                                e.currentTarget.style.transform = 'translateY(-5px)';
                                                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(16, 185, 129, 0.1)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'none';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        {s.totalSources >= 4 && (
                                            <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--success-color)', color: '#000', padding: '0.3rem 1rem', fontSize: '0.65rem', fontWeight: 900, borderBottomLeftRadius: '12px', letterSpacing: '1px', zIndex: 10 }}>HIGH CONSENSUS</div>
                                        )}

                                        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '0.5rem', zIndex: 10 }}>
                                            {s.isValue && (
                                                <div title="High Edge Detection" style={{ background: 'var(--accent-color)', color: '#000', padding: '0.2rem 0.6rem', fontSize: '0.6rem', fontWeight: 900, borderRadius: '4px' }}>VALUE</div>
                                            )}
                                            {s.divergence > CONFIG.MODULAR_SYSTEM.ADVANCED_ANALYSIS.DIVERGENCE_RADAR.THRESHOLD && (
                                                <div title="Conflicting Source Predictions" style={{ background: 'var(--danger-color)', color: '#fff', padding: '0.2rem 0.6rem', fontSize: '0.6rem', fontWeight: 900, borderRadius: '4px' }}>DİKKAT</div>
                                            )}
                                        </div>

                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent-color)', fontWeight: 800 }}>
                                                    {s.league && s.league !== 'Others' && s.league !== 'Unknown' ? s.league : (t.match_overview || 'MAÇ ÖZETİ')}
                                                </div>
                                                {s.date && (
                                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent-color)', display: 'flex', gap: '0.5rem' }}>
                                                        <span>🗓️ {s.date}</span>
                                                        {s.time && <span style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '0.5rem' }}>🕒 {s.time}</span>}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                                {s.home} <span style={{ opacity: 0.3, fontWeight: 400 }}>vs</span> {s.away}
                                            </div>
                                            {s.forebetUrl && (
                                                <div style={{ fontSize: '0.6rem', color: 'var(--accent-color)', marginTop: '0.4rem', fontWeight: 700 }}>🔗 ANALİZ İÇİN TIKLA</div>
                                            )}
                                        </div>

                                        <div style={{ marginBottom: '2rem' }}>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '1rem' }}>{t.global_consensus_report} ({s.totalSources}/{RADAR_SOURCES.length} {t.active_badges || 'Kaynak'})</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                                {Object.entries(s.predictions).map(([site, pred]) => {
                                                    const sourceConfig = RADAR_SOURCES.find(rs => rs.id === site);
                                                    const color = sourceConfig ? sourceConfig.color : '#94a3b8';
                                                    const url = RADAR_BASE_URLS[site];

                                                    return (
                                                        <div
                                                            key={site}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (url) window.open(url, '_blank');
                                                            }}
                                                            title={url ? `${sourceConfig?.label || site} sitesine git` : ''}
                                                            style={{
                                                                padding: '0.8rem',
                                                                background: 'rgba(255,255,255,0.02)',
                                                                borderRadius: '10px',
                                                                border: `1px solid ${color}33`,
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                cursor: url ? 'pointer' : 'default',
                                                                transition: 'transform 0.2s, background 0.2s'
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                {url && <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>🔗</span>}
                                                                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: color, textTransform: 'uppercase' }}>{site}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                <span style={{ fontWeight: 900, fontSize: '0.9rem' }}>{pred}</span>
                                                                {s.probabilities[site] && (
                                                                    <span style={{ fontSize: '0.65rem', color: color, opacity: 0.8, fontWeight: 700 }}>
                                                                        (%{s.probabilities[site]}{s.tipCounts[site] ? ` - ${s.tipCounts[site]}` : ''})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.2rem', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.6 }}>{t.consensus_agreement || 'ORTAK AKIL SKORU'}</div>
                                                <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--success-color)' }}>%{agreementPercent.toFixed(0)}</div>
                                            </div>
                                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${agreementPercent}%`,
                                                    height: '100%',
                                                    background: `linear-gradient(to right, ${agreementPercent > 60 ? 'var(--success-color)' : 'var(--warning-color)'}, #fff)`,
                                                    boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)'
                                                }}></div>
                                            </div>
                                            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                                <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>{t.consensus_verdict || 'AĞIRLIKLI TAHMİN'}:</span>
                                                <span style={{ marginLeft: '0.5rem', fontWeight: 900, fontSize: '1.2rem', color: 'var(--accent-color)' }}>{consensusPred}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ gridColumn: '1 / -1', padding: '10rem 2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed var(--glass-border)' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📡</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, opacity: 0.5 }}>{t.waiting_for_sources || 'Dış kaynak verileri senkronize ediliyor...'}</div>
                            </div>
                        )}
                    </div>
                </div>
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
                                        {bankState.current_mode === CONFIG.BANKROLL.HIERARCHY.MODES.NO_BET && (
                                            <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger-color)', borderRadius: '8px', fontSize: '0.7rem', color: 'var(--danger-color)', fontWeight: 800 }}>
                                                {bankState.daily_pl / CONFIG.BANKROLL.HIERARCHY.INITIAL_BALANCE >= 0.05 ? t.daily_target_reached :
                                                    bankState.daily_pl / CONFIG.BANKROLL.HIERARCHY.INITIAL_BALANCE <= -0.03 ? t.daily_stoploss_reached : t.bankroll_stop}
                                            </div>
                                        )}
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
                                            <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--success-color)', color: '#000', padding: '0.2rem 1rem', fontSize: '0.6rem', fontWeight: 900, borderBottomLeftRadius: '10px', letterSpacing: '1px', zIndex: 10 }}>VIP</div>
                                        )}
                                        {signal.observations?.reverseSignal && (
                                            <div style={{ position: 'absolute', top: isVip ? '25px' : 0, right: 0, background: 'var(--danger-color)', color: '#fff', padding: '0.2rem 1rem', fontSize: '0.6rem', fontWeight: 900, borderBottomLeftRadius: '10px', letterSpacing: '1px', animation: 'pulse 2s infinite', zIndex: 10 }}>REVERSE SIGNAL</div>
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

                                        <div className="intelligence-modal-content">
                                            {/* AI & Consensus Layer (Fusion) */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                                {/* AI Expert Column */}
                                                {currentMatch.aiSummary && (
                                                    <div style={{ background: 'rgba(56, 189, 248, 0.08)', borderRadius: '15px', padding: '1.5rem', border: '1px solid rgba(56, 189, 248, 0.2)', boxShadow: '0 0 30px rgba(56, 189, 248, 0.1)' }}>
                                                        <h4 style={{ margin: 0, fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                            {t.ai_expert_summary}
                                                        </h4>
                                                        <p style={{ marginTop: '1rem', fontSize: '0.9rem', lineHeight: '1.6', color: '#fff', fontStyle: 'italic', opacity: 0.95 }}>
                                                            {currentMatch.aiSummary || "Uzman AI sahayı analiz ediyor..."}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Global Consensus Column */}
                                                {currentMatch.consensusReport?.totalSources > 0 && (
                                                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '15px', padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                                        <h4 style={{ margin: 0, fontSize: '0.75rem', opacity: 0.6, fontWeight: 800, textTransform: 'uppercase' }}>
                                                            {t.global_consensus_report}
                                                        </h4>
                                                        <div style={{ marginTop: '1rem' }}>
                                                            {currentMatch.consensusReport?.totalSources > 0 ? (
                                                                <>
                                                                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--success-color)' }}>
                                                                        {currentMatch.consensusReport.totalSources}/{RADAR_SOURCES.length} <span style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 400 }}>{t.active_badges}</span>
                                                                    </div>
                                                                    <div style={{ marginTop: '0.5rem', fontSize: '0.65rem', opacity: 0.7 }}>
                                                                        {Object.entries(currentMatch.consensusReport.agreement).map(([pred, count]) => (
                                                                            <div key={pred} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                                                                <span>{pred}:</span>
                                                                                <span style={{ fontWeight: 800 }}>{count} Site</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Dış kaynak verisi bekleniyor...</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

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

                                                {/* Column 2: Expert Analysis & Risk */}
                                                <div className="grid-col">
                                                    <h3><span style={{ marginRight: '0.5rem' }}>🛡️</span> {t.risk_guard}</h3>
                                                    <div className="stats-card">
                                                        {/* Expert Metrics Display */}
                                                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.1)' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                                                                <span>{t.pressure_label}</span>
                                                                <span style={{ color: 'var(--warning-color)' }}>%{currentMatch.observations?.pressure?.total || 0}</span>
                                                            </div>
                                                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '1rem' }}>
                                                                <div style={{ width: `${currentMatch.observations?.pressure?.total || 0}%`, height: '100%', background: 'var(--warning-color)', transition: 'width 1s ease' }}></div>
                                                            </div>

                                                            <div style={{ fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.5rem' }}>{t.velocity_label}</div>
                                                            <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, textAlign: 'center' }}>
                                                                {currentMatch.observations?.velocity?.trend === 'HOT' ? t.velocity_hot :
                                                                    currentMatch.observations?.velocity?.trend === 'WARMING' ? t.velocity_warming :
                                                                        currentMatch.observations?.velocity?.trend === 'COOLING' ? t.velocity_cooling : t.velocity_stable}
                                                            </div>
                                                        </div>

                                                        {Object.entries(dataWorker.checkRiskFilters(currentMatch)).map(([key, f]) => (
                                                            <div key={key} className="stat-row-pill" style={{ marginBottom: '0.8rem' }}>
                                                                <span style={{ opacity: 0.8 }}>{t[key] || key}</span>
                                                                <span className={`status-pill ${f.status === 'OK' ? 'ok' : f.status === 'FAIL' ? 'fail' : 'warning'}`}>
                                                                    {f.status === 'OK' ? t.status_ok : t.status_fail}
                                                                </span>
                                                            </div>
                                                        ))}
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
                                </div>
                            );
                        })()
                    )}
                    {/* Match Details Modal end */}
                </>
            )}

            {showFAQ && <FAQ onClose={() => setShowFAQ(false)} lang={lang} mode={faqMode} />}

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
        </div>
    );
};
