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
    // Only set employer session if this user actually has an employer profile
    if (data) {
      setEmployer({ id: userId })
      setEmployerProfile(data)
    } else {
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
