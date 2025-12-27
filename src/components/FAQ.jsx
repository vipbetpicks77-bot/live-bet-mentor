import React from 'react';
import { translations } from '../locales/translations';

export const FAQ = ({ onClose, lang = 'tr' }) => {
    const t = translations[lang];

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(3, 7, 18, 0.95)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(20px)'
        }}>
            <div className="glass-panel faq-modal-content" style={{
                animation: 'modalSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '2rem',
                        right: '2rem',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-secondary)',
                        width: '3rem',
                        height: '3rem',
                        borderRadius: '50%',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                    ×
                </button>

                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h1 style={{ background: 'linear-gradient(to right, var(--text-primary), var(--accent-color))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px' }}>{t.faq_title}</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1.1rem' }}>{t.faq_subtitle}</p>
                </div>

                <div className="faq-grid">
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
                            <b style={{ color: 'var(--accent-color)' }}>{t.faq_q1_example.split(':')[0]}:</b> {t.faq_q1_example.split(':')[1]}
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
                                    <b>{t.faq_momentum_scenario.split(':')[0]}:</b> {t.faq_momentum_scenario.split(':')[1]}
                                </div>
                            </div>
                            <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.8rem', color: 'var(--warning-color)', fontWeight: 800 }}>{t.faq_deadmatch_title}</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.6' }}>{t.faq_deadmatch_desc}</p>
                                <div style={{ fontSize: '0.85rem', color: 'var(--accent-color)', background: 'rgba(56, 189, 248, 0.05)', padding: '0.8rem', borderRadius: '8px' }}>
                                    <b>{t.faq_deadmatch_scenario.split(':')[0]}:</b> {t.faq_deadmatch_scenario.split(':')[1]}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Tier System Section (New) */}
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
                            {t.bankroll_panel} (FAQ)
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

                    {/* Karar Modları Section */}
                    <section>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <span style={{ width: '8px', height: '24px', background: 'var(--text-primary)', borderRadius: '4px' }}></span>
                            {t.faq_q3_title}
                        </h2>
                        <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                            {[t.faq_mode_core, t.faq_mode_risk, t.faq_mode_full].map((mode, idx) => (
                                <div key={idx} style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--glass-border)', fontSize: '0.95rem' }}>
                                    <b style={{ color: 'var(--accent-color)' }}>{mode.split(':')[0]}:</b> {mode.split(':')[1]}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Shadow Portfolio Section */}
                    <section>
                        <h2 style={{ color: 'var(--danger-color)', fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <span style={{ width: '8px', height: '24px', background: 'var(--danger-color)', borderRadius: '4px' }}></span>
                            {t.faq_q4_title}
                        </h2>
                        <p style={{ lineHeight: '1.8', color: 'var(--text-secondary)', fontSize: '1rem' }}>
                            {t.faq_q4_desc}
                        </p>
                        <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1.5rem', borderRadius: '12px', marginTop: '1.5rem', fontSize: '0.95rem', border: '1px solid rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--danger-color)' }}>
                            <b style={{ color: 'var(--danger-color)' }}>{t.faq_q4_example.split(':')[0]}:</b> {t.faq_q4_example.split(':')[1]}
                        </div>
                    </section>

                    {/* Optional Modules Section */}
                    <section>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <span style={{ width: '8px', height: '24px', background: 'var(--accent-color)', borderRadius: '4px' }}></span>
                            {t.faq_q7_title}
                        </h2>
                        <p style={{ lineHeight: '1.8', color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '2rem' }}>
                            {t.faq_q7_desc}
                        </p>

                        <div className="faq-modules-grid">
                            {/* xG */}
                            <div className="glass-panel" style={{ padding: '2rem', background: 'rgba(56, 189, 248, 0.02)' }}>
                                <h3 style={{ fontSize: '1.2rem', color: 'var(--accent-color)', fontWeight: 800, marginBottom: '1rem' }}>{t.faq_q8_title}</h3>
                                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1.5rem' }}>{t.faq_q8_desc}</p>
                                <div style={{ fontSize: '0.85rem', opacity: 0.8, padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                                    <p style={{ marginBottom: '0.5rem' }}><b>{t.faq_q8_purpose.split(':')[0]}:</b> {t.faq_q8_purpose.split(':')[1]}</p>
                                    <p style={{ color: 'var(--accent-color)' }}><b>{t.faq_q8_feature.split(':')[0]}:</b> {t.faq_q8_feature.split(':')[1]}</p>
                                </div>
                            </div>
                            {/* Bayesian */}
                            <div className="glass-panel" style={{ padding: '2rem', background: 'rgba(56, 189, 248, 0.02)' }}>
                                <h3 style={{ fontSize: '1.2rem', color: 'var(--accent-color)', fontWeight: 800, marginBottom: '1rem' }}>{t.faq_q9_title}</h3>
                                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1.5rem' }}>{t.faq_q9_desc}</p>
                                <div style={{ fontSize: '0.85rem', opacity: 0.8, padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                                    <p style={{ marginBottom: '0.5rem' }}><b>{t.faq_q9_purpose.split(':')[0]}:</b> {t.faq_q9_purpose.split(':')[1]}</p>
                                    <p style={{ color: 'var(--accent-color)' }}><b>{t.faq_q9_feature.split(':')[0]}:</b> {t.faq_q9_feature.split(':')[1]}</p>
                                </div>
                            </div>
                        </div>
                    </section>
                    {/* Phase 12: VIP & Tier 3 Tracking */}
                    <section>
                        <h2 style={{ color: 'var(--success-color)', fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <span style={{ width: '8px', height: '24px', background: 'var(--success-color)', borderRadius: '4px' }}></span>
                            {t.faq_q11_title}
                        </h2>
                        <p style={{ lineHeight: '1.8', color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1.5rem' }}>
                            {t.faq_q11_desc}
                        </p>

                        <h2 style={{ color: 'var(--accent-color)', fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '3rem' }}>
                            <span style={{ width: '8px', height: '24px', background: 'var(--accent-color)', borderRadius: '4px' }}></span>
                            {t.faq_q12_title}
                        </h2>
                        <p style={{ lineHeight: '1.8', color: 'var(--text-secondary)', fontSize: '1rem' }}>
                            {t.faq_q12_desc}
                        </p>
                    </section>
                </div>

                <div style={{ marginTop: '5rem', padding: '2.5rem', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '20px', textAlign: 'center', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                    <p style={{ fontWeight: 800, color: 'var(--accent-color)', fontSize: '1.2rem', letterSpacing: '1px' }}>{t.faq_footer_main}</p>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.8rem' }}>{t.faq_footer_sub}</p>
                </div>
            </div>
        </div>
    );
};
