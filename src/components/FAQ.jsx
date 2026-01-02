import React from 'react';
import { translations } from '../locales/translations';

export const FAQ = ({ onClose, lang = 'tr', mode = 'live' }) => {
    const t = translations[lang] || translations['tr'];

    const safeSplit = (str, idx = 1) => {
        if (!str) return '';
        const parts = str.split(':');
        if (idx === 0) return parts[0] || '';
        return parts.slice(1).join(':').trim();
    };

    const isLive = mode === 'live';
    const isRadar = mode === 'radar';

    return (
        <div
            className="modal-overlay"
            onClick={onClose}
            style={{
                background: 'rgba(3, 7, 18, 0.98)',
                zIndex: 4000, // Z-index increased for safety
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)'
            }}
        >
            <div
                className="glass-panel faq-modal-content"
                onClick={e => e.stopPropagation()}
                style={{
                    animation: 'modalEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'var(--accent-color) transparent',
                    maxWidth: '1200px',
                    width: '90%'
                }}
            >
                <button
                    onClick={onClose}
                    className="close-btn-enhanced"
                    style={{
                        position: 'absolute',
                        top: '1.5rem',
                        right: '1.5rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid var(--danger-color)',
                        color: 'var(--danger-color)',
                        width: '3rem',
                        height: '3rem',
                        borderRadius: '50%',
                        fontSize: '1.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s',
                        zIndex: 100
                    }}
                >
                    ×
                </button>

                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h1 style={{
                        background: isRadar ? 'linear-gradient(to right, #00f2fe, #34d399)' : 'linear-gradient(to right, var(--text-primary), var(--accent-color))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: '2.5rem',
                        fontWeight: 800,
                        letterSpacing: '-1px'
                    }}>
                        {isRadar ? t.faq_radar_title : t.faq_live_title}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
                        {isRadar ? t.faq_radar_subtitle : t.faq_live_subtitle}
                    </p>
                </div>

                <div className="faq-grid">
                    {/* Live Specific Sections */}
                    {isLive && (
                        <>
                            {/* DQS Section */}
                            <section>
                                <h2 style={{ color: 'var(--accent-color)', fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <span style={{ width: '8px', height: '24px', background: 'var(--accent-color)', borderRadius: '4px' }}></span>
                                    {t.faq_q1_title}
                                </h2>
                                <p style={{ lineHeight: '1.8', color: 'var(--text-secondary)', fontSize: '1rem' }}>
                                    {t.faq_q1_desc}
                                </p>
                                <div style={{ background: 'rgba(56, 189, 248, 0.05)', padding: '1.5rem', borderRadius: '12px', marginTop: '1.5rem', fontSize: '0.95rem', border: '1px solid rgba(56, 189, 248, 0.1)', borderLeft: '4px solid var(--accent-color)' }}>
                                    <b style={{ color: 'var(--accent-color)' }}>{safeSplit(t.faq_q1_example, 0)}:</b> {safeSplit(t.faq_q1_example, 1)}
                                </div>
                            </section>

                            {/* Risk Guard Section */}
                            <section>
                                <h2 style={{ color: 'var(--warning-color)', fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <span style={{ width: '8px', height: '24px', background: 'var(--warning-color)', borderRadius: '4px' }}></span>
                                    {t.faq_q2_title}
                                </h2>
                                <p style={{ lineHeight: '1.8', color: 'var(--text-secondary)', fontSize: '1rem' }}>
                                    {t.faq_q2_desc}
                                </p>
                                <div className="faq-bankroll-grid">
                                    <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.8rem', color: 'var(--warning-color)', fontWeight: 800 }}>{t.faq_momentum_title}</h3>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.6' }}>{t.faq_momentum_desc}</p>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--accent-color)', background: 'rgba(56, 189, 248, 0.05)', padding: '0.8rem', borderRadius: '8px' }}>
                                            <b>{safeSplit(t.faq_momentum_scenario, 0)}:</b> {safeSplit(t.faq_momentum_scenario, 1)}
                                        </div>
                                    </div>
                                    <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.8rem', color: 'var(--warning-color)', fontWeight: 800 }}>{t.faq_deadmatch_title}</h3>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.6' }}>{t.faq_deadmatch_desc}</p>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--accent-color)', background: 'rgba(56, 189, 248, 0.05)', padding: '0.8rem', borderRadius: '8px' }}>
                                            <b>{safeSplit(t.faq_deadmatch_scenario, 0)}:</b> {safeSplit(t.faq_deadmatch_scenario, 1)}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Tier System Section */}
                            <section>
                                <h2 style={{ color: 'var(--accent-color)', fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <span style={{ width: '8px', height: '24px', background: 'var(--accent-color)', borderRadius: '4px' }}></span>
                                    {t.faq_q10_title}
                                </h2>
                                <p style={{ lineHeight: '1.8', color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1.5rem' }}>
                                    {t.faq_q10_desc}
                                </p>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                                        <b style={{ color: 'var(--success-color)', display: 'block', marginBottom: '0.4rem' }}>{t.faq_tier1_title}</b>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t.faq_tier1_desc}</span>
                                    </div>
                                    <div style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                                        <b style={{ color: 'var(--warning-color)', display: 'block', marginBottom: '0.4rem' }}>{t.faq_tier2_title}</b>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t.faq_tier2_desc}</span>
                                    </div>
                                    <div style={{ background: 'rgba(148, 163, 184, 0.05)', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
                                        <b style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>{t.faq_tier3_title}</b>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t.faq_tier3_desc}</span>
                                    </div>
                                </div>
                            </section>

                            {/* Bankroll Management Section */}
                            <section>
                                <h2 style={{ color: 'var(--accent-color)', fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <span style={{ width: '8px', height: '24px', background: 'var(--accent-color)', borderRadius: '4px' }}></span>
                                    {t.bankroll_panel}
                                </h2>
                                <div className="faq-bankroll-grid">
                                    <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(56, 189, 248, 0.02)' }}>
                                        <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-color)', fontWeight: 800, marginBottom: '0.8rem' }}>{t.faq_bankroll_q1_title}</h3>
                                        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{t.faq_bankroll_q1_desc}</p>
                                    </div>
                                    <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(245, 158, 11, 0.02)' }}>
                                        <h3 style={{ fontSize: '1.1rem', color: 'var(--warning-color)', fontWeight: 800, marginBottom: '0.8rem' }}>{t.faq_bankroll_q2_title}</h3>
                                        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{t.faq_bankroll_q2_desc}</p>
                                    </div>
                                    <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.02)' }}>
                                        <h3 style={{ fontSize: '1.1rem', color: 'var(--danger-color)', fontWeight: 800, marginBottom: '0.8rem' }}>{t.faq_bankroll_q3_title}</h3>
                                        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{t.faq_bankroll_q3_desc}</p>
                                    </div>
                                    <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(56, 189, 248, 0.02)' }}>
                                        <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-color)', fontWeight: 800, marginBottom: '0.8rem' }}>{t.faq_bankroll_q4_title}</h3>
                                        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{t.faq_bankroll_q4_desc}</p>
                                    </div>
                                </div>
                            </section>

                            {/* Expert Features Section */}
                            <section>
                                <h2 style={{ color: 'var(--accent-color)', fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <span style={{ width: '8px', height: '24px', background: 'var(--accent-color)', borderRadius: '4px' }}></span>
                                    {t.faq_q7_title}
                                </h2>
                                <div className="faq-modules-grid">
                                    <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(56, 189, 248, 0.02)' }}>
                                        <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-color)', fontWeight: 800, marginBottom: '0.6rem' }}>{t.faq_q8_title}</h3>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{t.faq_q8_desc}</p>
                                    </div>
                                    <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(56, 189, 248, 0.02)' }}>
                                        <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-color)', fontWeight: 800, marginBottom: '0.6rem' }}>{t.faq_q9_title}</h3>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{t.faq_q9_desc}</p>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}

                    {/* Radar / Collective Intelligence Section */}
                    {isRadar && (
                        <section style={{ gridColumn: '1 / -1' }}>
                            <h2 style={{ color: '#00f2fe', fontSize: '1.8rem', fontWeight: 900, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ width: '12px', height: '32px', background: '#00f2fe', borderRadius: '4px' }}></span>
                                {t.radar_faq_title}
                            </h2>
                            <div className="faq-modules-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                                <div className="glass-panel" style={{ padding: '2rem', background: 'rgba(0, 242, 254, 0.05)', border: '1px solid rgba(0, 242, 254, 0.2)' }}>
                                    <h3 style={{ fontSize: '1.2rem', color: '#00f2fe', fontWeight: 800, marginBottom: '1rem' }}>{t.radar_faq_q1_title}</h3>
                                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>{t.radar_faq_q1_desc}</p>
                                </div>
                                <div className="glass-panel" style={{ padding: '2rem', background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                                    <h3 style={{ fontSize: '1.2rem', color: '#34d399', fontWeight: 800, marginBottom: '1rem' }}>{t.radar_faq_q2_title}</h3>
                                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>{t.radar_faq_q2_desc}</p>
                                </div>
                                <div className="glass-panel" style={{ padding: '2rem', background: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                                    <h3 style={{ fontSize: '1.2rem', color: '#fbbf24', fontWeight: 800, marginBottom: '1rem' }}>{t.radar_faq_q3_title}</h3>
                                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>{t.radar_faq_q3_desc}</p>
                                </div>
                                <div className="glass-panel" style={{ padding: '2rem', background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                                    <h3 style={{ fontSize: '1.2rem', color: '#f43f5e', fontWeight: 800, marginBottom: '1rem' }}>{t.radar_faq_q4_title}</h3>
                                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>{t.radar_faq_q4_desc}</p>
                                </div>
                                <div className="glass-panel" style={{ padding: '2rem', background: 'rgba(167, 139, 250, 0.05)', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
                                    <h3 style={{ fontSize: '1.2rem', color: '#a78bfa', fontWeight: 800, marginBottom: '1rem' }}>{t.radar_faq_q5_title}</h3>
                                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>{t.radar_faq_q5_desc}</p>
                                </div>
                            </div>
                        </section>
                    )}
                </div>

                <div style={{
                    marginTop: '5rem',
                    padding: '2.5rem',
                    background: isRadar ? 'rgba(0, 242, 254, 0.05)' : 'rgba(56, 189, 248, 0.05)',
                    borderRadius: '20px',
                    textAlign: 'center',
                    border: isRadar ? '1px solid rgba(0, 242, 254, 0.2)' : '1px solid rgba(56, 189, 248, 0.2)'
                }}>
                    <p style={{ fontWeight: 800, color: isRadar ? '#00f2fe' : 'var(--accent-color)', fontSize: '1.2rem', letterSpacing: '1px' }}>
                        {t.faq_footer_main}
                    </p>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.8rem' }}>
                        {t.faq_footer_sub}
                    </p>
                </div>
            </div>
        </div>
    );
};
