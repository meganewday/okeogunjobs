import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { APP_NAME } from '../config/constants'

export default function EmailConfirmed() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('checking') // checking | confirmed | error

  useEffect(() => {
    // Supabase automatically exchanges the token from the URL
    // We just need to check if a session now exists
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus('confirmed')
      } else {
        // Give Supabase a moment to process the token from the URL hash
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: retrySession } }) => {
            setStatus(retrySession ? 'confirmed' : 'error')
          })
        }, 2000)
      }
    })
  }, [])

  if (status === 'checking') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.loadingText}>Confirming your email...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.icon}>⚠️</div>
          <h1 style={styles.title}>Link expired or invalid</h1>
          <p style={styles.subtitle}>
            This confirmation link has expired or has already been used.
            Try signing up again or request a new confirmation email.
          </p>
          <Link to="/signup" style={styles.btn}>Back to Sign Up</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.icon}>✅</div>
        <h1 style={styles.title}>Email confirmed</h1>
        <p style={styles.subtitle}>
          Your account is now active. The next step is to complete your profile so
          employers on {APP_NAME} can find you.
        </p>
        <Link to="/register" style={styles.btn}>Complete Your Profile</Link>
        <p style={styles.footer}>
          Already completed your profile?{' '}
          <Link to="/profile" style={styles.link}>Go to my profile</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f5f7f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '40px 32px', width: '100%', maxWidth: '440px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center' },
  icon: { fontSize: '48px', marginBottom: '16px' },
  title: { fontSize: '22px', fontWeight: 'bold', color: '#1a6b3c', marginBottom: '8px' },
  subtitle: { fontSize: '14px', color: '#666', lineHeight: '1.6', marginBottom: '24px' },
  loadingText: { fontSize: '15px', color: '#888' },
  btn: { display: 'inline-block', padding: '13px 28px', backgroundColor: '#1a6b3c', color: '#fff', fontSize: '15px', fontWeight: '600', borderRadius: '8px', textDecoration: 'none' },
  footer: { fontSize: '13px', color: '#666', marginTop: '16px' },
  link: { color: '#1a6b3c', fontWeight: '600', textDecoration: 'none' },
}
