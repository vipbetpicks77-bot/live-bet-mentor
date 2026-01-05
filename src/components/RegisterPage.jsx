import React, { useState } from 'react';
import { supabase } from '../backend/supabaseClient';

export const RegisterPage = ({ onNavigate, lang = 'tr' }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        phone: '',
        acceptTerms: false
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [registered, setRegistered] = useState(false);

    const t = lang === 'tr' ? {
        title: 'Kayıt Ol',
        subtitle: 'Profesyonel analiz sistemine katıl',
        email: 'E-posta',
        emailPlaceholder: 'ornek@email.com',
        password: 'Şifre',
        passwordPlaceholder: 'En az 6 karakter',
        confirmPassword: 'Şifre Tekrar',
        confirmPlaceholder: 'Şifrenizi tekrar girin',
        fullName: 'İsim Soyisim (Opsiyonel)',
        namePlaceholder: 'Adınız Soyadınız',
        phone: 'Telefon (Opsiyonel)',
        phonePlaceholder: '+90 555 123 4567',
        acceptTerms: 'Kullanım şartlarını ve gizlilik politikasını kabul ediyorum',
        register: 'KAYIT OL',
        haveAccount: 'Zaten hesabın var mı?',
        login: 'Giriş Yap',
        backToHome: '← Ana Sayfa',
        successTitle: '🎉 Kayıt Başarılı!',
        successMsg: 'Kaydınız alındı. Admin onayı sonrası sisteme giriş yapabilirsiniz.',
        successNote: 'E-posta adresinize onay durumu hakkında bilgilendirme yapılacaktır.',
        goToLogin: 'Giriş Sayfasına Git',
        errorPasswordMatch: 'Şifreler eşleşmiyor',
        errorTerms: 'Kullanım şartlarını kabul etmelisiniz',
        errorGeneral: 'Bir hata oluştu. Lütfen tekrar deneyin.'
    } : {
        title: 'Sign Up',
        subtitle: 'Join the professional analysis system',
        email: 'Email',
        emailPlaceholder: 'example@email.com',
        password: 'Password',
        passwordPlaceholder: 'At least 6 characters',
        confirmPassword: 'Confirm Password',
        confirmPlaceholder: 'Re-enter your password',
        fullName: 'Full Name (Optional)',
        namePlaceholder: 'Your Full Name',
        phone: 'Phone (Optional)',
        phonePlaceholder: '+90 555 123 4567',
        acceptTerms: 'I accept the terms of use and privacy policy',
        register: 'SIGN UP',
        haveAccount: 'Already have an account?',
        login: 'Login',
        backToHome: '← Home',
        successTitle: '🎉 Registration Successful!',
        successMsg: 'Your registration has been received. You can login after admin approval.',
        successNote: 'You will be notified about approval status via email.',
        goToLogin: 'Go to Login Page',
        errorPasswordMatch: 'Passwords do not match',
        errorTerms: 'You must accept the terms of use',
        errorGeneral: 'An error occurred. Please try again.'
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setStatus({ type: 'error', message: t.errorPasswordMatch });
            return;
        }

        if (!formData.acceptTerms) {
            setStatus({ type: 'error', message: t.errorTerms });
            return;
        }

        setLoading(true);

        try {
            // Register with Supabase Auth
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        phone: formData.phone,
                        status: 'pending' // Will be updated by trigger or admin
                    }
                }
            });

            if (error) {
                setStatus({ type: 'error', message: error.message });
            } else {
                // Try to update the profile with pending status
                if (data.user) {
                    await supabase
                        .from('profiles')
                        .update({
                            status: 'pending',
                            full_name: formData.fullName,
                            phone: formData.phone
                        })
                        .eq('id', data.user.id);
                }

                setRegistered(true);
            }
        } catch (err) {
            setStatus({ type: 'error', message: t.errorGeneral });
        }

        setLoading(false);
    };

    // Success Screen
    if (registered) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #030712 0%, #0f172a 50%, #030712 100%)',
                padding: '2rem'
            }}>
                <div className="glass-panel" style={{
                    padding: '3rem',
                    maxWidth: '500px',
                    width: '100%',
                    textAlign: 'center',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '20px'
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>✅</div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '1rem', color: '#10b981' }}>
                        {t.successTitle}
                    </h2>
                    <p style={{ color: '#94a3b8', marginBottom: '1rem', lineHeight: 1.6 }}>
                        {t.successMsg}
                    </p>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '2rem' }}>
                        {t.successNote}
                    </p>
                    <button
                        onClick={() => onNavigate('login')}
                        style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            border: 'none',
                            color: '#fff',
                            padding: '1rem 2rem',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 700,
                            width: '100%'
                        }}
                    >
                        {t.goToLogin}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #030712 0%, #0f172a 50%, #030712 100%)',
            padding: '2rem'
        }}>
            {/* Background Effects */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
                <div style={{
                    position: 'absolute',
                    top: '20%',
                    right: '20%',
                    width: '300px',
                    height: '300px',
                    background: 'radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%)',
                    borderRadius: '50%',
                    filter: 'blur(60px)'
                }} />
            </div>

            <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '480px' }}>
                {/* Back Button */}
                <button
                    onClick={() => onNavigate('landing')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        marginBottom: '2rem',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    {t.backToHome}
                </button>

                <div className="glass-panel" style={{
                    padding: '3rem',
                    background: 'rgba(15, 23, 42, 0.8)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '20px'
                }}>
                    {/* Logo */}
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <span style={{ fontSize: '2.5rem' }}>📈</span>
                        <h1 style={{
                            fontSize: '1.8rem',
                            fontWeight: 900,
                            background: 'linear-gradient(to right, #fff, #38bdf8)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginTop: '0.5rem'
                        }}>
                            {t.title}
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                            {t.subtitle}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Email */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem' }}>
                                {t.email} *
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder={t.emailPlaceholder}
                                required
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '10px',
                                    color: '#fff',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                            />
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem' }}>
                                {t.password} *
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder={t.passwordPlaceholder}
                                required
                                minLength={6}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '10px',
                                    color: '#fff',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        {/* Confirm Password */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem' }}>
                                {t.confirmPassword} *
                            </label>
                            <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                placeholder={t.confirmPlaceholder}
                                required
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '10px',
                                    color: '#fff',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        {/* Full Name */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem' }}>
                                {t.fullName}
                            </label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                placeholder={t.namePlaceholder}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '10px',
                                    color: '#fff',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        {/* Phone */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem' }}>
                                {t.phone}
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder={t.phonePlaceholder}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '10px',
                                    color: '#fff',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        {/* Terms Checkbox */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.acceptTerms}
                                    onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        marginTop: '2px',
                                        accentColor: '#38bdf8'
                                    }}
                                />
                                <span style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5 }}>
                                    {t.acceptTerms}
                                </span>
                            </label>
                        </div>

                        {/* Error/Status Message */}
                        {status.message && (
                            <div style={{
                                marginBottom: '1.5rem',
                                padding: '1rem',
                                borderRadius: '10px',
                                background: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                border: `1px solid ${status.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                                color: status.type === 'error' ? '#ef4444' : '#10b981',
                                fontSize: '0.9rem'
                            }}>
                                {status.message}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                background: loading
                                    ? 'rgba(56, 189, 248, 0.3)'
                                    : 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
                                border: 'none',
                                borderRadius: '10px',
                                color: loading ? '#94a3b8' : '#000',
                                fontSize: '1rem',
                                fontWeight: 900,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: loading ? 'none' : '0 4px 15px rgba(56, 189, 248, 0.3)'
                            }}
                        >
                            {loading ? '...' : t.register}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div style={{ textAlign: 'center', marginTop: '2rem', color: '#64748b', fontSize: '0.9rem' }}>
                        {t.haveAccount}{' '}
                        <button
                            onClick={() => onNavigate('login')}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#38bdf8',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            {t.login}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
