import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const EmployerAuthContext = createContext(null)

export function EmployerAuthProvider({ children }) {
  const [employer, setEmployer] = useState(null)
  const [employerProfile, setEmployerProfile] = useState(null)
  const [employerLoading, setEmployerLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchEmployerProfile(session.user.id)
      else setEmployerLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) fetchEmployerProfile(session.user.id)
      else {
        setEmployer(null)
        setEmployerProfile(null)
        setEmployerLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchEmployerProfile(userId) {
    const { data } = await supabase
      .from('employers')
      .select('*')
      .eq('auth_user_id', userId)
      .single()

    if (data) {
      setEmployer({ id: userId })
      setEmployerProfile(data)
      setEmployerLoading(false)
      return
    }

    // No profile found — check if there is a pending profile saved from signup
    let recovered = null
    try {
      const raw = localStorage.getItem('okeogun_pending_employer')
      if (raw) {
        const pending = JSON.parse(raw)
        // Ensure the saved profile belongs to this user
        if (pending.auth_user_id === userId) {
          const { data: created, error } = await supabase
            .from('employers')
            .insert({ ...pending })
            .select()
            .single()
          if (!error && created) {
            recovered = created
            localStorage.removeItem('okeogun_pending_employer')
          }
        }
      }
    } catch (_) {}

    if (recovered) {
      setEmployer({ id: userId })
      setEmployerProfile(recovered)
    } else {
      // Last resort: find an employers row by email with no auth_user_id and link it
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          const { data: byEmail } = await supabase
            .from('employers')
            .select('*')
            .eq('email', user.email)
            .is('auth_user_id', null)
            .single()
          if (byEmail) {
            await supabase
              .from('employers')
              .update({ auth_user_id: userId })
              .eq('id', byEmail.id)
            const linked = { ...byEmail, auth_user_id: userId }
            setEmployer({ id: userId })
            setEmployerProfile(linked)
            setEmployerLoading(false)
            return
          }
        }
      } catch (_) {}

      setEmployer(null)
      setEmployerProfile(null)
    }
    setEmployerLoading(false)
  }

  async function employerSignOut() {
    await supabase.auth.signOut()
    setEmployer(null)
    setEmployerProfile(null)
  }

  return (
    <EmployerAuthContext.Provider value={{
      employer,
      employerProfile,
      employerLoading,
      employerSignOut,
      refreshEmployerProfile: () => employer && fetchEmployerProfile(employer.id)
    }}>
      {children}
    </EmployerAuthContext.Provider>
  )
}

export function useEmployerAuth() {
  return useContext(EmployerAuthContext)
}
