import React, { useState, useEffect } from 'react';
import '../styles/global.css';

export const LandingPage = ({ onNavigate, lang = 'tr' }) => {
    const [scrollY, setScrollY] = useState(0);
    const [activeFeature, setActiveFeature] = useState(0);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Auto-cycle features
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFeature(prev => (prev + 1) % 6);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const t = {
        tr: {
            heroTitle: 'Profesyonel Bahis Analizi',
            heroSubtitle: 'AI Destekli',
            heroDesc: 'Yapay zeka ve algoritmik analiz ile canlı maç tahminleri. Profesyonel yatırımcılar için tasarlandı.',
            cta1: 'ÜCRETSİZ KAYIT OL',
            cta2: 'GİRİŞ YAP',
            statsAccuracy: 'Başarı Oranı',
            statsUsers: 'Aktif Kullanıcı',
            statsMatches: 'Analiz Edilen Maç',
            statsAlerts: 'AI Bildirimi',
            howTitle: 'Nasıl Çalışır?',
            step1Title: 'Kayıt Ol',
            step1Desc: 'Hızlı kayıt ile sisteme dahil ol. Admin onayı sonrası erişim sağla.',
            step2Title: 'AI Analizi İzle',
            step2Desc: 'Canlı maçları takip et, DQS skorlarını ve AI tahminlerini incele.',
            step3Title: 'Akıllı Kararlar Ver',
            step3Desc: 'Konsensüs verilerini kullan, risk yönetimi ile profesyonel bahis yap.',
            featuresTitle: 'Özellikler',
            feature1: 'DQS Skoru',
            feature1Desc: 'Data Quality Score - Her maçın veri kalitesini ölç',
            feature2: 'AI Tahmin Motoru',
            feature2Desc: 'Gemini AI ile gerçek zamanlı maç analizleri',
            feature3: 'Konsensüs Radar',
            feature3Desc: '10+ kaynaktan toplu tahmin verileri',
            feature4: 'Risk Yönetimi',
            feature4Desc: 'Otomatik bankroll ve stop-loss sistemi',
            feature5: 'Canlı Fırsatlar',
            feature5Desc: 'Isı haritası ve momentum göstergeleri',
            feature6: 'Smart Alerts',
            feature6Desc: 'AI destekli akıllı bildirim sistemi',
            previewTitle: 'Dashboard Önizleme',
            previewBlur: 'Tam versiyonu görmek için kayıt olun',
            pricingTitle: 'Üyelik Paketleri',
            trialTitle: 'Deneme',
            trialDays: '7 Gün',
            trialPrice: 'ÜCRETSİZ',
            trialFeatures: ['Tüm maçlara erişim', 'DQS skorları', 'AI raporu (günlük 3)', 'Smart Alerts (günlük 5)', 'Konsensüs Radar'],
            proTitle: 'Pro',
            proDays: '30 Gün',
            proPrice: '€29',
            proFeatures: ['Sınırsız maç erişimi', 'AI raporu (günlük 15)', 'Smart Alerts (günlük 150)', 'Konsensüs Radar', 'Risk yönetimi'],
            premiumTitle: 'Premium',
            premiumDays: '90 Gün',
            premiumPrice: '€59',
            premiumFeatures: ['Pro özellikleri +', 'AI raporu (günlük 50)', 'Smart Alerts (SINIRSIZ)', 'Öncelikli destek', 'Telegram VIP grubu'],
            popular: 'EN POPÜLER',
            selectPlan: 'SEÇ',
            faqTitle: 'Sık Sorulan Sorular',
            faq1Q: 'Sistem nasıl çalışıyor?',
            faq1A: 'AI motorumuz canlı maç istatistiklerini, xG verilerini ve momentum göstergelerini analiz ederek tahminler üretir.',
            faq2Q: 'Kayıt olduktan sonra ne oluyor?',
            faq2A: 'Kayıt sonrası admin onayı beklersiniz. Onay verildiğinde belirtilen süre kadar sisteme erişim sağlarsınız.',
            faq3Q: 'Hangi ligler destekleniyor?',
            faq3A: 'Majör ligler (Premier League, La Liga, Bundesliga, Serie A vb.) ve birçok ikinci lig desteklenmektedir.',
            faq4Q: 'Garanti var mı?',
            faq4A: 'Bahis yatırımı risk içerir. Sistem karar destek aracıdır, kesin kazanç garantisi vermez.',
            footerCta: 'Profesyonel analizlere hemen başla',
            footerBtn: 'ÜCRETSİZ KAYIT OL',
            footerNote: 'Kredi kartı gerekmez • Admin onayı ile aktifleşir'
        },
        en: {
            heroTitle: 'Professional Betting Analysis',
            heroSubtitle: 'AI Powered',
            heroDesc: 'Live match predictions with artificial intelligence and algorithmic analysis. Designed for professional bettors.',
            cta1: 'FREE SIGN UP',
            cta2: 'LOGIN',
            statsAccuracy: 'Accuracy Rate',
            statsUsers: 'Active Users',
            statsMatches: 'Matches Analyzed',
            statsAlerts: 'AI Alerts',
            howTitle: 'How It Works?',
            step1Title: 'Sign Up',
            step1Desc: 'Quick registration to join. Access after admin approval.',
            step2Title: 'Watch AI Analysis',
            step2Desc: 'Track live matches, check DQS scores and AI predictions.',
            step3Title: 'Make Smart Decisions',
            step3Desc: 'Use consensus data, bet professionally with risk management.',
            featuresTitle: 'Features',
            feature1: 'DQS Score',
            feature1Desc: 'Data Quality Score - Measure data quality of each match',
            feature2: 'AI Prediction Engine',
            feature2Desc: 'Real-time match analysis with Gemini AI',
            feature3: 'Consensus Radar',
            feature3Desc: 'Aggregated predictions from 10+ sources',
            feature4: 'Risk Management',
            feature4Desc: 'Automatic bankroll and stop-loss system',
            feature5: 'Live Opportunities',
            feature5Desc: 'Heat map and momentum indicators',
            feature6: 'Smart Alerts',
            feature6Desc: 'AI-powered smart notification system',
            previewTitle: 'Dashboard Preview',
            previewBlur: 'Sign up to see full version',
            pricingTitle: 'Membership Plans',
            trialTitle: 'Trial',
            trialDays: '7 Days',
            trialPrice: 'FREE',
            trialFeatures: ['Full match access', 'DQS scores', 'AI report (3/day)', 'Smart Alerts (5/day)', 'Consensus Radar'],
            proTitle: 'Pro',
            proDays: '30 Days',
            proPrice: '€29',
            proFeatures: ['Unlimited match access', 'AI report (15/day)', 'Smart Alerts (150/day)', 'Consensus Radar', 'Risk management'],
            premiumTitle: 'Premium',
            premiumDays: '90 Days',
            premiumPrice: '€59',
            premiumFeatures: ['Pro features +', 'AI report (50/day)', 'Smart Alerts (UNLIMITED)', 'Priority support', 'VIP Telegram group'],
            popular: 'MOST POPULAR',
            selectPlan: 'SELECT',
            faqTitle: 'Frequently Asked Questions',
            faq1Q: 'How does the system work?',
            faq1A: 'Our AI engine analyzes live match statistics, xG data, and momentum indicators to generate predictions.',
            faq2Q: 'What happens after registration?',
            faq2A: 'After registration, you wait for admin approval. Once approved, you get access for the specified period.',
            faq3Q: 'Which leagues are supported?',
            faq3A: 'Major leagues (Premier League, La Liga, Bundesliga, Serie A, etc.) and many second tier leagues.',
            faq4Q: 'Is there a guarantee?',
            faq4A: 'Betting involves risk. The system is a decision support tool, not a guarantee of profit.',
            footerCta: 'Start professional analysis now',
            footerBtn: 'FREE SIGN UP',
            footerNote: 'No credit card required • Activated with admin approval'
        }
    }[lang];

    const features = [
        { icon: '📊', title: t.feature1, desc: t.feature1Desc, color: '#38bdf8' },
        { icon: '🤖', title: t.feature2, desc: t.feature2Desc, color: '#a78bfa' },
        { icon: '🎯', title: t.feature3, desc: t.feature3Desc, color: '#34d399' },
        { icon: '🛡️', title: t.feature4, desc: t.feature4Desc, color: '#f59e0b' },
        { icon: '🔥', title: t.feature5, desc: t.feature5Desc, color: '#ef4444' },
        { icon: '🔔', title: t.feature6, desc: t.feature6Desc, color: '#ec4899' }
    ];

    return (
        <div className="landing-page" style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #030712 0%, #0f172a 50%, #030712 100%)',
            color: '#fff',
            overflowX: 'hidden'
        }}>
            {/* Animated Background Orbs */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
                <div style={{
                    position: 'absolute',
                    top: '10%',
                    left: '10%',
                    width: '400px',
                    height: '400px',
                    background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)',
                    borderRadius: '50%',
                    filter: 'blur(60px)',
                    animation: 'float 8s ease-in-out infinite'
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '20%',
                    right: '10%',
                    width: '300px',
                    height: '300px',
                    background: 'radial-gradient(circle, rgba(167, 139, 250, 0.12) 0%, transparent 70%)',
                    borderRadius: '50%',
                    filter: 'blur(50px)',
                    animation: 'float 10s ease-in-out infinite reverse'
                }} />
            </div>

            {/* Navigation */}
            <nav style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                padding: '1rem 2rem',
                background: scrollY > 50 ? 'rgba(3, 7, 18, 0.95)' : 'transparent',
                backdropFilter: scrollY > 50 ? 'blur(20px)' : 'none',
                borderBottom: scrollY > 50 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                transition: 'all 0.3s ease'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>📈</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 900, background: 'linear-gradient(to right, #fff, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            LIVE BET MENTOR
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button
                            onClick={() => onNavigate('login')}
                            style={{
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: '#fff',
                                padding: '0.6rem 1.2rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                transition: 'all 0.2s'
                            }}
                        >
                            {t.cta2}
                        </button>
                        <button
                            onClick={() => onNavigate('register')}
                            style={{
                                background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
                                border: 'none',
                                color: '#000',
                                padding: '0.6rem 1.2rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 800,
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)'
                            }}
                        >
                            {t.cta1}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '6rem 2rem 4rem',
                position: 'relative',
                zIndex: 1
            }}>
                <div style={{ maxWidth: '900px' }}>
                    <div style={{
                        display: 'inline-block',
                        background: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: '30px',
                        padding: '0.5rem 1.5rem',
                        marginBottom: '2rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#38bdf8'
                    }}>
                        🚀 {t.heroSubtitle}
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                        fontWeight: 900,
                        lineHeight: 1.1,
                        marginBottom: '1.5rem',
                        background: 'linear-gradient(135deg, #fff 0%, #94a3b8 50%, #fff 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        {t.heroTitle}
                    </h1>

                    <p style={{
                        fontSize: '1.25rem',
                        color: '#94a3b8',
                        maxWidth: '600px',
                        margin: '0 auto 3rem',
                        lineHeight: 1.6
                    }}>
                        {t.heroDesc}
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => onNavigate('register')}
                            style={{
                                background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
                                border: 'none',
                                color: '#000',
                                padding: '1rem 2.5rem',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: 900,
                                transition: 'all 0.3s',
                                boxShadow: '0 8px 30px rgba(56, 189, 248, 0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <span>🎯</span> {t.cta1}
                        </button>
                        <button
                            onClick={() => onNavigate('login')}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: '#fff',
                                padding: '1rem 2.5rem',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: 600,
                                transition: 'all 0.3s'
                            }}
                        >
                            {t.cta2}
                        </button>
                    </div>

                    {/* Scroll indicator */}
                    <div style={{ marginTop: '4rem', opacity: 0.5, animation: 'bounce 2s infinite' }}>
                        <span style={{ fontSize: '1.5rem' }}>↓</span>
                    </div>
                </div>
            </section>

            {/* Stats Bar */}
            <section style={{
                background: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(20px)',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                padding: '3rem 2rem',
                position: 'relative',
                zIndex: 1
            }}>
                <div style={{
                    maxWidth: '1000px',
                    margin: '0 auto',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '2rem',
                    textAlign: 'center'
                }}>
                    {[
                        { value: '%78+', label: t.statsAccuracy, color: '#10b981' },
                        { value: '500+', label: t.statsUsers, color: '#38bdf8' },
                        { value: '10K+', label: t.statsMatches, color: '#a78bfa' },
                        { value: '24/7', label: t.statsAlerts, color: '#f59e0b' }
                    ].map((stat, i) => (
                        <div key={i}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: stat.color, marginBottom: '0.5rem' }}>
                                {stat.value}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* How It Works */}
            <section style={{ padding: '6rem 2rem', position: 'relative', zIndex: 1 }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <h2 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 900, marginBottom: '4rem' }}>
                        {t.howTitle}
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '2rem'
                    }}>
                        {[
                            { num: '01', title: t.step1Title, desc: t.step1Desc, icon: '📝' },
                            { num: '02', title: t.step2Title, desc: t.step2Desc, icon: '📊' },
                            { num: '03', title: t.step3Title, desc: t.step3Desc, icon: '💰' }
                        ].map((step, i) => (
                            <div key={i} className="glass-panel" style={{
                                padding: '2rem',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '16px',
                                textAlign: 'center',
                                transition: 'all 0.3s'
                            }}>
                                <div style={{
                                    fontSize: '3rem',
                                    marginBottom: '1rem'
                                }}>
                                    {step.icon}
                                </div>
                                <div style={{
                                    fontSize: '0.75rem',
                                    color: '#38bdf8',
                                    fontWeight: 800,
                                    marginBottom: '0.5rem'
                                }}>
                                    ADIM {step.num}
                                </div>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem' }}>
                                    {step.title}
                                </h3>
                                <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section style={{
                padding: '6rem 2rem',
                background: 'rgba(15, 23, 42, 0.3)',
                position: 'relative',
                zIndex: 1
            }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <h2 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 900, marginBottom: '4rem' }}>
                        {t.featuresTitle}
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {features.map((feat, i) => (
                            <div
                                key={i}
                                className="glass-panel"
                                style={{
                                    padding: '2rem',
                                    background: activeFeature === i ? `rgba(${feat.color === '#38bdf8' ? '56, 189, 248' : feat.color === '#a78bfa' ? '167, 139, 250' : feat.color === '#34d399' ? '52, 211, 153' : feat.color === '#f59e0b' ? '245, 158, 11' : feat.color === '#ef4444' ? '239, 68, 68' : '236, 72, 153'}, 0.1)` : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${activeFeature === i ? feat.color + '44' : 'rgba(255,255,255,0.05)'}`,
                                    borderRadius: '16px',
                                    display: 'flex',
                                    gap: '1.5rem',
                                    alignItems: 'flex-start',
                                    transition: 'all 0.4s',
                                    cursor: 'pointer',
                                    transform: activeFeature === i ? 'scale(1.02)' : 'scale(1)'
                                }}
                                onMouseEnter={() => setActiveFeature(i)}
                            >
                                <div style={{
                                    width: '3.5rem',
                                    height: '3.5rem',
                                    background: `${feat.color}22`,
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.5rem',
                                    flexShrink: 0
                                }}>
                                    {feat.icon}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem', color: feat.color }}>
                                        {feat.title}
                                    </h3>
                                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                        {feat.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Dashboard Preview (Blurred) */}
            <section style={{ padding: '6rem 2rem', position: 'relative', zIndex: 1 }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem' }}>
                        {t.previewTitle}
                    </h2>
                    <p style={{ color: '#94a3b8', marginBottom: '3rem' }}>
                        {t.previewBlur}
                    </p>

                    <div style={{
                        position: 'relative',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
                    }}>
                        {/* Fake Dashboard Preview */}
                        <div style={{
                            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                            padding: '2rem',
                            filter: 'blur(3px)',
                            opacity: 0.8
                        }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '1.5rem', borderRadius: '12px', height: '100px' }} />
                                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1.5rem', borderRadius: '12px', height: '100px' }} />
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '12px', height: '200px' }} />
                        </div>

                        {/* Overlay CTA */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0,0,0,0.3)'
                        }}>
                            <button
                                onClick={() => onNavigate('register')}
                                style={{
                                    background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
                                    border: 'none',
                                    color: '#000',
                                    padding: '1rem 2rem',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: 900,
                                    boxShadow: '0 8px 30px rgba(56, 189, 248, 0.4)'
                                }}
                            >
                                🔓 {t.cta1}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section style={{
                padding: '6rem 2rem',
                background: 'rgba(15, 23, 42, 0.3)',
                position: 'relative',
                zIndex: 1
            }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <h2 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 900, marginBottom: '4rem' }}>
                        {t.pricingTitle}
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '2rem',
                        alignItems: 'stretch'
                    }}>
                        {/* Trial */}
                        <div className="glass-panel" style={{
                            padding: '2.5rem',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '20px',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.5rem' }}>
                                {t.trialDays}
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem' }}>
                                {t.trialTitle}
                            </h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10b981', marginBottom: '1.5rem' }}>
                                {t.trialPrice}
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem', flex: 1 }}>
                                {t.trialFeatures.map((f, i) => (
                                    <li key={i} style={{ padding: '0.5rem 0', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ color: '#10b981' }}>✓</span> {f}
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => onNavigate('register')}
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    padding: '1rem',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    fontWeight: 700
                                }}
                            >
                                {t.selectPlan}
                            </button>
                        </div>

                        {/* Pro - Popular */}
                        <div className="glass-panel" style={{
                            padding: '2.5rem',
                            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(15, 23, 42, 0.8))',
                            border: '2px solid #38bdf8',
                            borderRadius: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            transform: 'scale(1.05)',
                            boxShadow: '0 20px 40px rgba(56, 189, 248, 0.2)'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: '-12px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: '#38bdf8',
                                color: '#000',
                                padding: '0.3rem 1rem',
                                borderRadius: '20px',
                                fontSize: '0.7rem',
                                fontWeight: 900
                            }}>
                                {t.popular}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600, marginBottom: '0.5rem' }}>
                                {t.proDays}
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem' }}>
                                {t.proTitle}
                            </h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#38bdf8', marginBottom: '1.5rem' }}>
                                {t.proPrice}
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem', flex: 1 }}>
                                {t.proFeatures.map((f, i) => (
                                    <li key={i} style={{ padding: '0.5rem 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ color: '#38bdf8' }}>✓</span> {f}
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => onNavigate('register')}
                                style={{
                                    width: '100%',
                                    background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
                                    border: 'none',
                                    color: '#000',
                                    padding: '1rem',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    fontWeight: 900,
                                    boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)'
                                }}
                            >
                                {t.selectPlan}
                            </button>
                        </div>

                        {/* Premium */}
                        <div className="glass-panel" style={{
                            padding: '2.5rem',
                            background: 'rgba(167, 139, 250, 0.05)',
                            border: '1px solid rgba(167, 139, 250, 0.2)',
                            borderRadius: '20px',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{ fontSize: '0.8rem', color: '#a78bfa', fontWeight: 600, marginBottom: '0.5rem' }}>
                                {t.premiumDays}
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem' }}>
                                {t.premiumTitle}
                            </h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#a78bfa', marginBottom: '1.5rem' }}>
                                {t.premiumPrice}
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem', flex: 1 }}>
                                {t.premiumFeatures.map((f, i) => (
                                    <li key={i} style={{ padding: '0.5rem 0', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ color: '#a78bfa' }}>✓</span> {f}
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => onNavigate('register')}
                                style={{
                                    width: '100%',
                                    background: 'rgba(167, 139, 250, 0.2)',
                                    border: '1px solid rgba(167, 139, 250, 0.3)',
                                    color: '#a78bfa',
                                    padding: '1rem',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    fontWeight: 700
                                }}
                            >
                                {t.selectPlan}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section style={{ padding: '6rem 2rem', position: 'relative', zIndex: 1 }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h2 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 900, marginBottom: '4rem' }}>
                        {t.faqTitle}
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                            { q: t.faq1Q, a: t.faq1A },
                            { q: t.faq2Q, a: t.faq2A },
                            { q: t.faq3Q, a: t.faq3A },
                            { q: t.faq4Q, a: t.faq4A }
                        ].map((faq, i) => (
                            <div key={i} className="glass-panel" style={{
                                padding: '1.5rem 2rem',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '12px'
                            }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#38bdf8' }}>
                                    {faq.q}
                                </h4>
                                <p style={{ color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                                    {faq.a}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section style={{
                padding: '6rem 2rem',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(15, 23, 42, 0.8))',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1
            }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>
                        {t.footerCta}
                    </h2>
                    <button
                        onClick={() => onNavigate('register')}
                        style={{
                            background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
                            border: 'none',
                            color: '#000',
                            padding: '1.2rem 3rem',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '1.1rem',
                            fontWeight: 900,
                            marginBottom: '1rem',
                            boxShadow: '0 8px 30px rgba(56, 189, 248, 0.4)'
                        }}
                    >
                        {t.footerBtn}
                    </button>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                        {t.footerNote}
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                padding: '2rem',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '0.85rem'
            }}>
                <div style={{ marginBottom: '0.5rem' }}>
                    📈 LIVE BET MENTOR © 2026
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                    Bahis yatırımı risk içerir. Sorumlu oynamak sizin elinizde.
                </div>
            </footer>

            {/* CSS Animations */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-30px) rotate(5deg); }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .glass-panel:hover {
                    border-color: rgba(56, 189, 248, 0.3) !important;
                }
            `}</style>
        </div>
    );
};
