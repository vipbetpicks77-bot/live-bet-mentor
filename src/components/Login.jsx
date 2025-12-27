import React, { useState } from 'react';
import { supabase } from '../backend/supabaseClient';

export const Login = ({ onLogin, lang = 'tr' }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(lang === 'tr' ? 'Hatalı giriş bilgileri.' : 'Invalid login credentials.');
            setLoading(false);
        } else {
            onLogin(data.user);
        }
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)',
            color: '#fff',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '400px',
                padding: '3rem',
                borderRadius: '24px',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                textAlign: 'center'
            }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: '0.5rem', background: 'linear-gradient(to right, #fff, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        LIVE BET MENTOR
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                        {lang === 'tr' ? 'Algoritmik Analiz Paneline Giriş Yap' : 'Login to the Algorithmic Analysis Panel'}
                    </p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-color)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {lang === 'tr' ? 'E-POSTA' : 'EMAIL'}
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '1rem',
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: '#fff',
                                outline: 'none',
                                transition: 'border-color 0.3s'
                            }}
                            placeholder="admin@livebetcode.com"
                        />
                    </div>

                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-color)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {lang === 'tr' ? 'ŞİFRE' : 'PASSWORD'}
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '1rem',
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: '#fff',
                                outline: 'none',
                                transition: 'border-color 0.3s'
                            }}
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div style={{ padding: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px', color: '#ef4444', fontSize: '0.85rem' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '1rem',
                            background: 'linear-gradient(to right, #0ea5e9, #38bdf8)',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#000',
                            fontWeight: 900,
                            cursor: 'pointer',
                            fontSize: '1rem',
                            transition: 'all 0.3s',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? '...' : (lang === 'tr' ? 'GİRİŞ YAP' : 'SIGN IN')}
                    </button>

                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '1rem', lineHeight: '1.5' }}>
                        {lang === 'tr'
                            ? 'Bu panele sadece yetkili analistler erişebilir. İzinsiz giriş denemeleri loglanmaktadır.'
                            : 'Only authorized analysts can access this panel. Unauthorized access attempts are logged.'}
                    </p>
                </form>
            </div>
        </div>
    );
};
