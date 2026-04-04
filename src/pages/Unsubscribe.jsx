import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { APP_NAME } from '../config/constants'

export default function Unsubscribe() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('loading') // loading | success | error | invalid

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      return
    }
    handleUnsubscribe()
  }, [token])

  async function handleUnsubscribe() {
    try {
      const { data, error } = await supabase
        .from('job_alert_subscribers')
        .update({ is_active: false })
        .eq('unsubscribe_token', token)
        .select()

      if (error) throw error

      if (!data || data.length === 0) {
        setStatus('invalid')
      } else {
        setStatus('success')
      }
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {status === 'loading' && (
          <>
            <p style={styles.icon}>⏳</p>
            <h1 style={styles.title}>Processing...</h1>
            <p style={styles.text}>Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <p style={styles.icon}>✓</p>
            <h1 style={styles.title}>Unsubscribed</h1>
            <p style={styles.text}>
              You have been removed from the {APP_NAME} daily job alerts list.
              You will not receive any more emails from us.
            </p>
            <p style={styles.subtext}>
              Changed your mind? You can re-subscribe anytime from the jobs page.
            </p>
            <Link to="/jobs" style={styles.btn}>Browse Jobs</Link>
          </>
        )}

        {status === 'invalid' && (
          <>
            <p style={styles.icon}>⚠️</p>
            <h1 style={styles.title}>Link not valid</h1>
            <p style={styles.text}>
              This unsubscribe link is not valid or has already been used.
              If you are still receiving emails, contact us via WhatsApp.
            </p>
            <Link to="/" style={styles.btn}>Go to Homepage</Link>
          </>
        )}

        {status === 'error' && (
          <>
            <p style={styles.icon}>✗</p>
            <h1 style={styles.title}>Something went wrong</h1>
            <p style={styles.text}>
              We could not process your request. Please try again or contact us via WhatsApp.
            </p>
            <Link to="/" style={styles.btn}>Go to Homepage</Link>
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f5f7f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 24px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '48px 32px',
    maxWidth: '440px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  icon: {
    fontSize: '48px',
    margin: '0 0 16px 0',
  },
  title: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#1a6b3c',
    marginBottom: '12px',
  },
  text: {
    fontSize: '14px',
    color: '#555',
    lineHeight: '1.6',
    marginBottom: '12px',
  },
  subtext: {
    fontSize: '13px',
    color: '#aaa',
    marginBottom: '24px',
  },
  btn: {
    display: 'inline-block',
    padding: '12px 28px',
    backgroundColor: '#1a6b3c',
    color: '#fff',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '14px',
  },
}
