import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { APP_NAME } from '../config/constants'

export default function EmployerLogin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const resetSuccess = searchParams.get('reset') === 'success'
  const nextPage = searchParams.get('next')
  const [form, setForm] = useState({ email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
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

    setSubmitting(true)
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      })
      if (signInError) throw signInError

      // Check if this user has an employer profile
      const { data: profile } = await supabase
        .from('employers')
        .select('id')
        .eq('auth_user_id', data.user.id)
        .single()

      if (profile) {
        navigate(nextPage === 'post-job' ? '/post-job' : '/employer/dashboard')
      } else {
        navigate(nextPage === 'post-job' ? '/post-job' : '/employer/dashboard')
      }
    } catch (err) {
      if (err.message?.includes('Invalid login credentials')) {
        setError('Email or password is incorrect.')
      } else {
        setError(err.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Employer Login</h1>
        <p style={styles.subtitle}>
          Log in to manage your job listings and review applications on {APP_NAME}.
        </p>

        {resetSuccess && (
          <div style={styles.successBanner}>
            Password updated. You can now log in with your new password.
          </div>
        )}

        {nextPage === 'post-job' && !resetSuccess && (
          <div style={styles.infoBanner}>
            You need an employer account to post a job. Log in below or{' '}
            <a href="/employer/signup" style={styles.infoLink}>create a free account</a>.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Email Address *</label>
            <input
              style={styles.input}
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="e.g. contact@yourorganisation.com"
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
              placeholder="Your password"
              autoComplete="current-password"
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <div style={styles.forgotRow}>
            <Link to="/employer/reset-password" style={styles.forgotLink}>
              Forgot your password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{ ...styles.btn, ...(submitting ? styles.btnDisabled : {}), width: '100%' }}
          >
            {submitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p style={styles.footer}>
          No employer account yet?{' '}
          <Link to="/employer/signup" style={styles.link}>Create one here</Link>
        </p>
        <p style={styles.footer}>
          Looking for work?{' '}
          <Link to="/login" style={styles.link}>Job seeker login</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f5f7f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '40px 32px', width: '100%', maxWidth: '440px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  title: { fontSize: '22px', fontWeight: 'bold', color: '#1a6b3c', marginBottom: '8px' },
  subtitle: { fontSize: '14px', color: '#666', lineHeight: '1.6', marginBottom: '24px' },
  successBanner: { backgroundColor: '#e8f5ee', color: '#1a6b3c', fontSize: '13px', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontWeight: '600' },
  infoBanner: { backgroundColor: '#fffbeb', color: '#92400e', fontSize: '13px', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', lineHeight: '1.5' },
  infoLink: { color: '#1a6b3c', fontWeight: '700', textDecoration: 'none' },
  field: { marginBottom: '18px' },
  label: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box', outline: 'none' },
  error: { color: '#e53e3e', fontSize: '13px', marginBottom: '12px' },
  forgotRow: { textAlign: 'right', marginBottom: '16px', marginTop: '-8px' },
  forgotLink: { fontSize: '13px', color: '#1a6b3c', textDecoration: 'none', fontWeight: '600' },
  btn: { display: 'inline-block', padding: '13px 28px', backgroundColor: '#1a6b3c', color: '#fff', fontSize: '15px', fontWeight: '600', border: 'none', borderRadius: '8px', cursor: 'pointer', textDecoration: 'none', boxSizing: 'border-box' },
  btnDisabled: { backgroundColor: '#aaa', cursor: 'not-allowed' },
  footer: { fontSize: '13px', color: '#666', textAlign: 'center', marginTop: '16px' },
  link: { color: '#1a6b3c', fontWeight: '600', textDecoration: 'none' },
}
