import React, { useState, useEffect } from 'react'
import { Dashboard } from './components/Dashboard'
import { Login } from './components/Login'
import { supabase } from './backend/supabaseClient'
import './styles/global.css'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUserBan = async (user) => {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('is_banned')
        .eq('id', user.id)
        .single();

      if (data?.is_banned) {
        alert("Erişiminiz engellenmiştir.");
        await supabase.auth.signOut();
      }
    };

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) checkUserBan(session.user);
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) checkUserBan(session.user);
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return null; // Or a high-end loader

  return (
    <div className="App">
      {!session ? (
        <Login onLogin={setSession} />
      ) : (
        <Dashboard user={session.user} onLogout={() => supabase.auth.signOut()} />
      )}
    </div>
  )
}

export default App
