import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { APP_NAME } from '../config/constants'
import { verifyRecaptcha } from '../lib/recaptcha'

export default function JobSeekerSignup() {
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' })
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')
  const [error, setError] = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.email || !form.password) {
      setError('Email and password are required.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      const passed = await verifyRecaptcha('signup')
      if (!passed) {
        setError('We could not verify your submission. Please try again.')
        setSubmitting(false)
        return
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/email-confirmed`,
        },
      })
      if (signUpError) throw signUpError

      setSentEmail(form.email.trim())
      setSent(true)
    } catch (err) {
      if (err.message?.includes('already registered')) {
        setError('An account with this email already exists. Try logging in instead.')
      } else {
        setError(err.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.checkIcon}>✉️</div>
          <h1 style={styles.title}>Check your email</h1>
          <p style={styles.subtitle}>
            We sent a confirmation link to <strong>{sentEmail}</strong>. Open the link
            in your email to activate your account, then come back to complete your profile.
          </p>
          <p style={styles.hint}>
            Check your spam folder if you do not see it within a few minutes.
          </p>
          <Link to="/login" style={styles.btn}>Go to Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create your account</h1>
        <p style={styles.subtitle}>
          Sign up to register your profile on {APP_NAME} and apply for jobs directly
          from the platform. You will need to confirm your email before you can log in.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email Address *</label>
            <input
              style={styles.input}
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="e.g. yourname@email.com"
              autoComplete="email"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password *</label>
            <input
              style={styles.input}
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Confirm Password *</label>
            <input
              style={styles.input}
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
              autoComplete="new-password"
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            style={{ ...styles.btn, ...(submitting ? styles.btnDisabled : {}), width: '100%' }}
          >
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>Log in</Link>
        </p>
        <p style={styles.footer}>
          Looking to post a job?{' '}
          <Link to="/employer/signup" style={styles.link}>Register as an employer</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f5f7f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '40px 32px', width: '100%', maxWidth: '440px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center' },
  checkIcon: { fontSize: '48px', marginBottom: '16px' },
  title: { fontSize: '22px', fontWeight: 'bold', color: '#1a6b3c', marginBottom: '8px', textAlign: 'center' },
  subtitle: { fontSize: '14px', color: '#666', lineHeight: '1.6', marginBottom: '16px', textAlign: 'center' },
  hint: { fontSize: '13px', color: '#aaa', marginBottom: '24px' },
  form: { textAlign: 'left' },
  field: { marginBottom: '18px' },
  label: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box', outline: 'none' },
  error: { color: '#e53e3e', fontSize: '13px', marginBottom: '12px' },
  btn: { display: 'inline-block', padding: '13px 28px', backgroundColor: '#1a6b3c', color: '#fff', fontSize: '15px', fontWeight: '600', border: 'none', borderRadius: '8px', cursor: 'pointer', textDecoration: 'none', boxSizing: 'border-box' },
  btnDisabled: { backgroundColor: '#aaa', cursor: 'not-allowed' },
  footer: { fontSize: '13px', color: '#666', textAlign: 'center', marginTop: '16px' },
  link: { color: '#1a6b3c', fontWeight: '600', textDecoration: 'none' },
}