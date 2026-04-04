import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function JobAlertSubscribe() {
  const { user, profile } = useAuth()
  const [email, setEmail] = useState(user?.email || '')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubscribe(e) {
    e.preventDefault()
    setError('')

    if (!email || !email.includes('@')) {
      setError('Enter a valid email address.')
      return
    }

    setSubmitting(true)
    try {
      const { error: insertError } = await supabase
        .from('job_alert_subscribers')
        .upsert(
          { email: email.trim().toLowerCase(), is_active: true },
          { onConflict: 'email' }
        )

      if (insertError) throw insertError
      setSuccess(true)
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div style={styles.wrap}>
        <div style={styles.successBox}>
          <span style={styles.successIcon}>✓</span>
          <div>
            <p style={styles.successTitle}>You're subscribed</p>
            <p style={styles.successText}>
              We'll send you a daily email with new job listings from Oke-Ogun.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.inner}>
        <div style={styles.textBlock}>
          <h3 style={styles.title}>Get daily job alerts</h3>
          <p style={styles.subtitle}>
            New jobs sent to your inbox every morning. Free. Unsubscribe anytime.
          </p>
        </div>
        <form onSubmit={handleSubscribe} style={styles.form}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter your email address"
            style={styles.input}
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={submitting}
            style={{ ...styles.btn, ...(submitting ? styles.btnDisabled : {}) }}
          >
            {submitting ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    backgroundColor: '#f0f7f3',
    borderRadius: '12px',
    padding: '28px 24px',
    margin: '0',
  },
  inner: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  textBlock: {},
  title: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1a6b3c',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '13px',
    color: '#666',
    margin: 0,
    lineHeight: '1.5',
  },
  form: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  input: {
    flex: '1',
    minWidth: '200px',
    padding: '10px 14px',
    fontSize: '14px',
    border: '1px solid #c8e6d4',
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: '#fff',
    color: '#222',
  },
  btn: {
    padding: '10px 20px',
    backgroundColor: '#1a6b3c',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  btnDisabled: {
    backgroundColor: '#aaa',
    cursor: 'not-allowed',
  },
  error: {
    fontSize: '13px',
    color: '#e53e3e',
    margin: '4px 0 0 0',
  },
  successBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  successIcon: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#1a6b3c',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    flexShrink: 0,
    lineHeight: '28px',
    textAlign: 'center',
  },
  successTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1a6b3c',
    margin: '0 0 4px 0',
  },
  successText: {
    fontSize: '13px',
    color: '#555',
    margin: 0,
  },
}
