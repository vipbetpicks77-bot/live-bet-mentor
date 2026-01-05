import React, { useState, useEffect } from 'react';
import { supabase } from '../backend/supabaseClient';

export const AdminPanel = ({ lang = 'tr' }) => {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [subscriptionDays, setSubscriptionDays] = useState(30);
    const [selectedPlan, setSelectedPlan] = useState('pro');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'active', 'all'
    const [editingUser, setEditingUser] = useState(null);

    const PLANS = {
        trial: { label: 'Trial', color: '#10b981' },
        pro: { label: 'Pro', color: '#38bdf8' },
        premium: { label: 'Premium', color: '#a78bfa' },
        admin: { label: 'Admin', color: '#f59e0b' }
    };

    const t = lang === 'tr' ? {
        title: '🛡️ YÖNETİCİ KONTROL MERKEZİ',
        addMember: 'YENİ ÜYE EKLE',
        email: 'E-POSTA',
        tempPass: 'GEÇİCİ ŞİFRE',
        duration: 'SÜRE',
        plan: 'PLAN',
        days: 'gün',
        tabPending: 'ONAY BEKLİYOR',
        tabActive: 'AKTİF ÜYELER',
        tabAll: 'TÜM ÜYELER',
        memberList: 'Üye Listesi',
        emailCol: 'E-POSTA',
        dateCol: 'KAYIT TARİHİ',
        statusCol: 'DURUM',
        planCol: 'PLAN',
        expiryCol: 'BİTİŞ TARİHİ',
        remainingCol: 'KALAN',
        actionsCol: 'İŞLEM',
        statusPending: 'ONAY BEKLİYOR',
        statusApproved: 'AKTİF',
        statusRejected: 'REDDEDİLDİ',
        statusExpired: 'SÜRESİ DOLDU',
        statusBanned: 'YASAKLI',
        approve: 'ONAYLA',
        reject: 'REDDET',
        extend: 'UZAT',
        ban: 'YASAKLA',
        unban: 'YASAĞI KALDIR',
        delete: 'SİL',
        save: 'KAYDET',
        cancel: 'İPTAL',
        confirmDelete: 'Bu kullanıcıyı tamamen silmek istediğine emin misin?',
        confirmReject: 'Bu üyelik başvurusunu reddetmek istediğine emin misin?',
        userCreated: 'Kullanıcı başarıyla eklendi!',
        userApproved: 'Üyelik onaylandı!',
        userRejected: 'Başvuru reddedildi.',
        userDeleted: 'Kullanıcı silindi.',
        subscriptionUpdated: 'Üyelik süresi güncellendi!',
        loading: 'Yükleniyor...',
        noUsers: 'Kullanıcı bulunamadı.',
        quickDurations: 'Hızlı:'
    } : {
        title: '🛡️ ADMIN CONTROL CENTER',
        addMember: 'ADD NEW MEMBER',
        email: 'EMAIL',
        tempPass: 'TEMP PASSWORD',
        duration: 'DURATION',
        plan: 'PLAN',
        days: 'days',
        tabPending: 'PENDING',
        tabActive: 'ACTIVE',
        tabAll: 'ALL MEMBERS',
        memberList: 'Member List',
        emailCol: 'EMAIL',
        dateCol: 'REGISTERED',
        statusCol: 'STATUS',
        planCol: 'PLAN',
        expiryCol: 'EXPIRY',
        remainingCol: 'REMAINING',
        actionsCol: 'ACTIONS',
        statusPending: 'PENDING',
        statusApproved: 'ACTIVE',
        statusRejected: 'REJECTED',
        statusExpired: 'EXPIRED',
        statusBanned: 'BANNED',
        approve: 'APPROVE',
        reject: 'REJECT',
        extend: 'EXTEND',
        ban: 'BAN',
        unban: 'UNBAN',
        delete: 'DELETE',
        save: 'SAVE',
        cancel: 'CANCEL',
        confirmDelete: 'Are you sure you want to completely delete this user?',
        confirmReject: 'Are you sure you want to reject this membership application?',
        userCreated: 'User created successfully!',
        userApproved: 'Membership approved!',
        userRejected: 'Application rejected.',
        userDeleted: 'User deleted.',
        subscriptionUpdated: 'Subscription updated!',
        loading: 'Loading...',
        noUsers: 'No users found.',
        quickDurations: 'Quick:'
    };

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
            setProfiles(data || []);
        }
        setLoading(false);
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setStatus({ type: 'info', message: lang === 'tr' ? 'Kullanıcı oluşturuluyor...' : 'Creating user...' });

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + subscriptionDays);

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
            if (data.user) {
                await supabase
                    .from('profiles')
                    .update({
                        status: 'approved',
                        subscription_start: startDate.toISOString(),
                        subscription_end: endDate.toISOString(),
                        approved_at: new Date().toISOString(),
                        plan: selectedPlan
                    })
                    .eq('id', data.user.id);
            }

            setStatus({ type: 'success', message: t.userCreated });
            setEmail('');
            setPassword('');
            fetchProfiles();
        }
    };

    const approveUser = async (profile, days = subscriptionDays, plan = selectedPlan) => {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);

        const { error } = await supabase
            .from('profiles')
            .update({
                status: 'approved',
                subscription_start: startDate.toISOString(),
                subscription_end: endDate.toISOString(),
                approved_at: new Date().toISOString(),
                plan: plan
            })
            .eq('id', profile.id);

        if (error) {
            setStatus({ type: 'error', message: error.message });
        } else {
            setStatus({ type: 'success', message: t.userApproved });
            fetchProfiles();
        }
    };

    const rejectUser = async (id) => {
        if (!confirm(t.confirmReject)) return;

        const { error } = await supabase
            .from('profiles')
            .update({ status: 'rejected' })
            .eq('id', id);

        if (error) {
            setStatus({ type: 'error', message: error.message });
        } else {
            setStatus({ type: 'success', message: t.userRejected });
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
        if (!confirm(t.confirmDelete)) return;

        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);

        if (error) {
            setStatus({ type: 'error', message: error.message });
        } else {
            setStatus({ type: 'success', message: t.userDeleted });
            fetchProfiles();
        }
    };

    const updateSubscription = async (profileId, days, plan) => {
        const updates = {};
        if (days) {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + days);
            updates.subscription_end = endDate.toISOString();
        }
        if (plan) {
            updates.plan = plan;
        }
        updates.status = 'approved';

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', profileId);

        if (error) {
            setStatus({ type: 'error', message: error.message });
        } else {
            setStatus({ type: 'success', message: t.subscriptionUpdated });
            setEditingUser(null);
            fetchProfiles();
        }
    };

    const getStatusInfo = (profile) => {
        if (profile.is_banned) {
            return { label: t.statusBanned, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
        }
        if (profile.status === 'rejected') {
            return { label: t.statusRejected, color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' };
        }
        if (profile.status === 'pending' || !profile.status) {
            return { label: t.statusPending, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)' };
        }
        if (profile.subscription_end) {
            const endDate = new Date(profile.subscription_end);
            if (endDate < new Date()) {
                return { label: t.statusExpired, color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' };
            }
        }
        return { label: t.statusApproved, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
    };

    const getRemainingDays = (endDate) => {
        if (!endDate) return '-';
        const end = new Date(endDate);
        const now = new Date();
        const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
        if (diff < 0) return lang === 'tr' ? 'Doldu' : 'Expired';
        return `${diff} ${t.days}`;
    };

    const filteredProfiles = profiles.filter(p => {
        if (activeTab === 'pending') return p.status === 'pending' || (!p.status && !p.is_banned);
        if (activeTab === 'active') {
            const statusInfo = getStatusInfo(p);
            return statusInfo.label === t.statusApproved;
        }
        return true;
    });

    const pendingCount = profiles.filter(p => p.status === 'pending' || (!p.status && !p.is_banned)).length;

    return (
        <div className="admin-container" style={{ color: '#fff' }}>
            {/* Add New Member Form */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid var(--warning-color)' }}>
                <h2 style={{ color: 'var(--warning-color)', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 900 }}>
                    {t.title}
                </h2>

                <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(150px, 1fr) 100px 120px 100px', gap: '1rem', alignItems: 'end' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', opacity: 0.6, marginBottom: '0.5rem' }}>{t.email}</label>
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
                        <label style={{ display: 'block', fontSize: '0.7rem', opacity: 0.6, marginBottom: '0.5rem' }}>{t.tempPass}</label>
                        <input
                            type="text"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="sifre123"
                            style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: '#fff' }}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', opacity: 0.6, marginBottom: '0.5rem' }}>{t.duration}</label>
                        <select
                            value={subscriptionDays}
                            onChange={(e) => setSubscriptionDays(parseInt(e.target.value))}
                            style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: '#fff' }}
                        >
                            <option value={7}>7 {t.days}</option>
                            <option value={30}>30 {t.days}</option>
                            <option value={90}>90 {t.days}</option>
                            <option value={180}>180 {t.days}</option>
                            <option value={365}>365 {t.days}</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', opacity: 0.6, marginBottom: '0.5rem' }}>{t.plan}</label>
                        <select
                            value={selectedPlan}
                            onChange={(e) => setSelectedPlan(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: '#fff' }}
                        >
                            <option value="trial">Trial</option>
                            <option value="pro">Pro</option>
                            <option value="premium">Premium</option>
                        </select>
                    </div>
                    <button type="submit" style={{ padding: '0.8rem', background: 'var(--warning-color)', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 800, cursor: 'pointer' }}>
                        {t.addMember}
                    </button>
                </form>

                {status.message && (
                    <div style={{ marginTop: '1rem', padding: '0.8rem', borderRadius: '8px', background: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(56, 189, 248, 0.1)', color: status.type === 'error' ? '#ef4444' : status.type === 'success' ? '#10b981' : '#38bdf8', fontSize: '0.85rem', border: '1px solid currentColor' }}>
                        {status.message}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button
                    onClick={() => setActiveTab('pending')}
                    style={{
                        padding: '0.8rem 1.5rem',
                        background: activeTab === 'pending' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${activeTab === 'pending' ? '#fbbf24' : 'var(--glass-border)'}`,
                        borderRadius: '10px',
                        color: activeTab === 'pending' ? '#fbbf24' : '#94a3b8',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    {t.tabPending}
                    {pendingCount > 0 && (
                        <span style={{
                            background: '#fbbf24',
                            color: '#000',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '10px',
                            fontSize: '0.7rem',
                            fontWeight: 900
                        }}>
                            {pendingCount}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('active')}
                    style={{
                        padding: '0.8rem 1.5rem',
                        background: activeTab === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${activeTab === 'active' ? '#10b981' : 'var(--glass-border)'}`,
                        borderRadius: '10px',
                        color: activeTab === 'active' ? '#10b981' : '#94a3b8',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.8rem'
                    }}
                >
                    {t.tabActive}
                </button>
                <button
                    onClick={() => setActiveTab('all')}
                    style={{
                        padding: '0.8rem 1.5rem',
                        background: activeTab === 'all' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${activeTab === 'all' ? '#38bdf8' : 'var(--glass-border)'}`,
                        borderRadius: '10px',
                        color: activeTab === 'all' ? '#38bdf8' : '#94a3b8',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.8rem'
                    }}
                >
                    {t.tabAll} ({profiles.length})
                </button>
            </div>

            {/* Member List */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: 800 }}>{t.memberList}</h3>

                {loading ? (
                    <p>{t.loading}</p>
                ) : filteredProfiles.length === 0 ? (
                    <p style={{ color: '#64748b' }}>{t.noUsers}</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase' }}>
                                    <th style={{ padding: '1rem' }}>{t.emailCol}</th>
                                    <th style={{ padding: '1rem' }}>{t.fullName}</th>
                                    <th style={{ padding: '1rem' }}>{t.dateCol}</th>
                                    <th style={{ padding: '1rem' }}>{t.statusCol}</th>
                                    <th style={{ padding: '1rem' }}>{t.planCol}</th>
                                    <th style={{ padding: '1rem' }}>{t.expiryCol}</th>
                                    <th style={{ padding: '1rem' }}>{t.remainingCol}</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>{t.actionsCol}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProfiles.map(profile => {
                                    const statusInfo = getStatusInfo(profile);
                                    const isEditing = editingUser === profile.id;
                                    const planInfo = PLANS[profile.plan] || PLANS.trial;

                                    return (
                                        <tr key={profile.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '1rem', fontWeight: 600 }}>{profile.email}</td>
                                            <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#94a3b8' }}>{profile.full_name || '-'}</td>
                                            <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{new Date(profile.created_at).toLocaleDateString('tr-TR')}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.8rem',
                                                    borderRadius: '12px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 700,
                                                    background: statusInfo.bg,
                                                    color: statusInfo.color,
                                                    border: `1px solid ${statusInfo.color}33`
                                                }}>
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.8rem',
                                                    borderRadius: '12px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 700,
                                                    color: planInfo.color,
                                                    border: `1px solid ${planInfo.color}33`
                                                }}>
                                                    {planInfo.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                                {profile.subscription_end ? new Date(profile.subscription_end).toLocaleDateString('tr-TR') : '-'}
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>
                                                {getRemainingDays(profile.subscription_end)}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                {profile.email !== 'karabulut.hamza@gmail.com' && (
                                                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                        {/* Pending Actions */}
                                                        {(profile.status === 'pending' || !profile.status) && !profile.is_banned && (
                                                            <>
                                                                <button
                                                                    onClick={() => approveUser(profile)}
                                                                    title="Approve as Pro"
                                                                    style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', padding: '0.4rem 0.8rem', borderRadius: '6px', color: '#10b981', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700 }}
                                                                >
                                                                    {t.approve}
                                                                </button>
                                                                <button
                                                                    onClick={() => rejectUser(profile.id)}
                                                                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.4rem 0.8rem', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700 }}
                                                                >
                                                                    {t.reject}
                                                                </button>
                                                            </>
                                                        )}

                                                        {/* Edit Mode */}
                                                        {profile.status === 'approved' && !profile.is_banned && (
                                                            isEditing ? (
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(0,0,0,0.5)', padding: '0.5rem', borderRadius: '8px', zIndex: 10 }}>
                                                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                                        {[7, 30, 90].map(days => (
                                                                            <button
                                                                                key={days}
                                                                                onClick={() => updateSubscription(profile.id, days)}
                                                                                style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid #38bdf8', padding: '0.3rem 0.5rem', borderRadius: '4px', color: '#38bdf8', cursor: 'pointer', fontSize: '0.6rem', fontWeight: 700 }}
                                                                            >
                                                                                +{days}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                                        {Object.keys(PLANS).filter(k => k !== 'admin').map(p => (
                                                                            <button
                                                                                key={p}
                                                                                onClick={() => updateSubscription(profile.id, null, p)}
                                                                                style={{
                                                                                    background: profile.plan === p ? PLANS[p].color : 'transparent',
                                                                                    color: profile.plan === p ? '#000' : PLANS[p].color,
                                                                                    border: `1px solid ${PLANS[p].color}`,
                                                                                    padding: '0.3rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.6rem', fontWeight: 700
                                                                                }}
                                                                            >
                                                                                {PLANS[p].label}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                    <button
                                                                        onClick={() => setEditingUser(null)}
                                                                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.7rem' }}
                                                                    >
                                                                        {t.cancel}
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => setEditingUser(profile.id)}
                                                                    style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '0.4rem 0.8rem', borderRadius: '6px', color: '#38bdf8', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700 }}
                                                                >
                                                                    {t.extend} / {t.plan}
                                                                </button>
                                                            )
                                                        )}

                                                        {/* Ban/Unban */}
                                                        <button
                                                            onClick={() => toggleBan(profile.id, profile.is_banned)}
                                                            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 0.8rem', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '0.65rem' }}
                                                        >
                                                            {profile.is_banned ? t.unban : t.ban}
                                                        </button>

                                                        {/* Delete */}
                                                        <button
                                                            onClick={() => deleteUser(profile.id)}
                                                            style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '0.4rem 0.8rem', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '0.65rem' }}
                                                        >
                                                            {t.delete}
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
