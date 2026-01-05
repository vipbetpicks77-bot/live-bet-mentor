import React, { useState, useEffect } from 'react'
import { Dashboard } from './components/Dashboard'
import { Login } from './components/Login'
import { LandingPage } from './components/LandingPage'
import { RegisterPage } from './components/RegisterPage'
import { supabase } from './backend/supabaseClient'
import './styles/global.css'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('landing') // 'landing', 'login', 'register', 'dashboard', 'pending', 'expired'
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    const checkUserStatus = async (user) => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        return null;
      }

      setUserProfile(data);

      // Check ban status
      if (data?.is_banned) {
        alert("Erişiminiz engellenmiştir.");
        await supabase.auth.signOut();
        return null;
      }

      // Check approval status
      if (data?.status === 'pending') {
        setPage('pending');
        return data;
      }

      if (data?.status === 'rejected') {
        alert("Üyelik başvurunuz reddedilmiştir.");
        await supabase.auth.signOut();
        return null;
      }

      // Check subscription expiry
      if (data?.subscription_end) {
        const endDate = new Date(data.subscription_end);
        if (endDate < new Date()) {
          setPage('expired');
          return data;
        }
      }

      // All checks passed - show dashboard
      setPage('dashboard');
      return data;
    };

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkUserStatus(session.user);
      } else {
        setPage('landing');
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkUserStatus(session.user);
      } else {
        setPage('landing');
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNavigate = (targetPage) => {
    setPage(targetPage);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserProfile(null);
    setPage('landing');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #030712, #0f172a)',
        color: '#38bdf8'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📈</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>LIVE BET MENTOR</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.5rem' }}>Yükleniyor...</div>
        </div>
      </div>
    );
  }

  // Pending Approval Screen
  if (page === 'pending') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #030712, #0f172a)',
        padding: '2rem'
      }}>
        <div className="glass-panel" style={{
          padding: '3rem',
          maxWidth: '500px',
          textAlign: 'center',
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          borderRadius: '20px'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⏳</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '1rem', color: '#fbbf24' }}>
            Onay Bekleniyor
          </h2>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Üyelik başvurunuz alındı. Admin onayı sonrası sisteme tam erişim sağlayabilirsiniz.
          </p>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '2rem' }}>
            E-posta: {session?.user?.email}
          </p>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              padding: '0.8rem 2rem',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Çıkış Yap
          </button>
        </div>
      </div>
    );
  }

  // Subscription Expired Screen
  if (page === 'expired') {
    const endDate = userProfile?.subscription_end ? new Date(userProfile.subscription_end).toLocaleDateString('tr-TR') : '-';

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #030712, #0f172a)',
        padding: '2rem'
      }}>
        <div className="glass-panel" style={{
          padding: '3rem',
          maxWidth: '500px',
          textAlign: 'center',
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '20px'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📅</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '1rem', color: '#ef4444' }}>
            Üyelik Süresi Doldu
          </h2>
          <p style={{ color: '#94a3b8', marginBottom: '1rem', lineHeight: 1.6 }}>
            Üyeliğiniz <span style={{ color: '#ef4444', fontWeight: 700 }}>{endDate}</span> tarihinde sona erdi.
          </p>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '2rem' }}>
            Üyeliğinizi yenilemek için admin ile iletişime geçin.
          </p>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              padding: '0.8rem 2rem',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Çıkış Yap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {page === 'landing' && (
        <LandingPage onNavigate={handleNavigate} lang="tr" />
      )}

      {page === 'login' && (
        <Login
          onLoginSuccess={(sess) => {
            setSession(sess);
            // Status check will happen in useEffect
          }}
          onNavigate={handleNavigate}
        />
      )}

      {page === 'register' && (
        <RegisterPage onNavigate={handleNavigate} lang="tr" />
      )}

      {page === 'dashboard' && session && (
        <Dashboard
          user={session.user}
          userProfile={userProfile}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App
