import React, { useState, useEffect } from 'react';
import { supabase } from '../backend/supabaseClient';

export const AdminPanel = ({ lang = 'tr' }) => {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching profiles:', error);
        } else {
            setProfiles(data);
        }
        setLoading(false);
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setStatus({ type: 'info', message: lang === 'tr' ? 'Kullanıcı oluşturuluyor...' : 'Creating user...' });

        // IMPORTANT: In a real production app, this should call a Supabase Edge Function
        // because we can't safely use service_role key on the frontend.
        // For this implementation, we assume the user will set up an Edge Function.
        // As a fallback for demonstration/initial setup, we'll try to sign up.

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role: 'user'
                }
            }
        });

        if (error) {
            setStatus({ type: 'error', message: error.message });
        } else {
            setStatus({ type: 'success', message: lang === 'tr' ? 'Kullanıcı başarıyla kapıya eklendi! (E-posta aktivasyonu gerekebilir)' : 'User added to the door! (Registration successful)' });
            setEmail('');
            setPassword('');
            fetchProfiles();
        }
    };

    const toggleBan = async (id, isBanned) => {
        const { error } = await supabase
            .from('profiles')
            .update({ is_banned: !isBanned })
            .eq('id', id);

        if (error) {
            setStatus({ type: 'error', message: error.message });
        } else {
            fetchProfiles();
        }
    };

    const deleteUser = async (id) => {
        if (!confirm(lang === 'tr' ? 'Bu kullanıcıyı tamamen silmek istediğine emin misin?' : 'Are you sure you want to completely delete this user?')) return;

        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);

        if (error) {
            setStatus({ type: 'error', message: error.message });
        } else {
            setStatus({ type: 'success', message: lang === 'tr' ? 'Kullanıcı silindi.' : 'User deleted.' });
            fetchProfiles();
        }
    };

    return (
        <div className="admin-container" style={{ color: '#fff' }}>
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid var(--warning-color)' }}>
                <h2 style={{ color: 'var(--warning-color)', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 900 }}>
                    {lang === 'tr' ? '🛡️ YÖNETİCİ KONTROL MERKEZİ' : '🛡️ ADMIN CONTROL CENTER'}
                </h2>

                <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', alignItems: 'end' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', opacity: 0.6, marginBottom: '0.5rem' }}>E-POSTA</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="musteri@mail.com"
                            style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: '#fff' }}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', opacity: 0.6, marginBottom: '0.5rem' }}>GEÇİCİ ŞİFRE</label>
                        <input
                            type="text"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="sifre123"
                            style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: '#fff' }}
                            required
                        />
                    </div>
                    <button type="submit" style={{ padding: '0.8rem', background: 'var(--warning-color)', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 800, cursor: 'pointer' }}>
                        {lang === 'tr' ? 'YENİ ÜYE EKLE' : 'ADD NEW MEMBER'}
                    </button>
                </form>

                {status.message && (
                    <div style={{ marginTop: '1rem', padding: '0.8rem', borderRadius: '8px', background: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: status.type === 'error' ? '#ef4444' : '#10b981', fontSize: '0.8rem', border: '1px solid currentColor' }}>
                        {status.message}
                    </div>
                )}
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: 800 }}>{lang === 'tr' ? 'Mevcut Üyelikler' : 'Current Members'}</h3>

                {loading ? <p>Yükleniyor...</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', fontSize: '0.75rem', opacity: 0.5 }}>
                                <th style={{ padding: '1rem' }}>E-POSTA</th>
                                <th style={{ padding: '1rem' }}>KAYIT TARİHİ</th>
                                <th style={{ padding: '1rem' }}>DURUM</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>İŞLEM</th>
                            </tr>
                        </thead>
                        <tbody>
                            {profiles.map(profile => (
                                <tr key={profile.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{profile.email}</td>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{new Date(profile.created_at).toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '12px',
                                            fontSize: '0.7rem',
                                            background: profile.is_banned ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                            color: profile.is_banned ? '#ef4444' : '#10b981'
                                        }}>
                                            {profile.is_banned ? (lang === 'tr' ? 'ASKIDA' : 'BANNED') : (lang === 'tr' ? 'AKTİF' : 'ACTIVE')}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        {profile.email !== 'karabulut.hamza@gmail.com' && (
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => toggleBan(profile.id, profile.is_banned)}
                                                    style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 0.8rem', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '0.7rem' }}
                                                >
                                                    {profile.is_banned ? (lang === 'tr' ? 'YASAĞI KALDIR' : 'UNBAN') : (lang === 'tr' ? 'YASAKLA' : 'BAN')}
                                                </button>
                                                <button
                                                    onClick={() => deleteUser(profile.id)}
                                                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '0.4rem 0.8rem', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '0.7rem' }}
                                                >
                                                    {lang === 'tr' ? 'SİL' : 'DELETE'}
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
