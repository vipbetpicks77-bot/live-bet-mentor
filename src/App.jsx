import React, { useState, useEffect } from 'react'
import { Dashboard } from './components/Dashboard'
import { Login } from './components/Login'
import { supabase } from './backend/supabaseClient'
import './styles/global.css'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
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
