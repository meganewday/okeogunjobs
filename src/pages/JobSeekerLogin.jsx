import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { APP_NAME } from '../config/constants'
import { recordActivity } from '../lib/inactivity'

// ─── Global CSS ───────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  .oj-login-input {
    width: 100%;
    padding: 12px 14px;
    font-size: 14px;
    font-family: 'Outfit', sans-serif;
    border: 1.5px solid #dcfce7;
    border-radius: 12px;
    background: #f0fdf4;
    color: #14532d;
    outline: none;
    transition: border 0.15s, box-shadow 0.15s;
  }
  .oj-login-input::placeholder { color: #9ca3af; }
  .oj-login-input:focus {
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22,163,74,0.12);
    background: #fff;
  }
  .oj-login-btn {
    width: 100%;
    padding: 14px;
    background: #16a34a;
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    font-family: 'Outfit', sans-serif;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(22,163,74,0.32);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .oj-login-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(22,163,74,0.4);
  }
  .oj-login-btn:disabled { background: #9ca3af; cursor: not-allowed; box-shadow: none; }
`

export default function JobSeekerLogin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const resetSuccess = searchParams.get('reset') === 'success'
  const timedOut     = searchParams.get('timeout') === '1'

  const [form, setForm]           = useState({ email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState('')

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

      const { data: profile } = await supabase
        .from('job_seekers')
        .select('id')
        .eq('auth_user_id', data.user.id)
        .single()

      if (profile) {
        recordActivity('seeker')
        navigate('/profile')
      } else {
        navigate('/register?auth=true')
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      fontFamily: "'Outfit', sans-serif",
    }}>
      <style>{CSS}</style>

      <div style={{
        background: '#fff',
        borderRadius: 24,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 440,
        border: '1.5px solid #dcfce7',
        boxShadow: '0 8px 32px rgba(22,163,74,0.1)',
      }}>
        
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#14532d', margin: '0 0 8px' }}>
          Log in to your account
        </h1>
        <p style={{ fontSize: 14, color: '#4b6358', lineHeight: 1.65, margin: '0 0 24px' }}>
          Log in to view your profile, track your applications, and apply for jobs on {APP_NAME}.
        </p>

        {/* Banners */}
        {resetSuccess && (
          <div style={{ background: '#dcfce7', color: '#166534', fontSize: 13, padding: '11px 14px', borderRadius: 12, marginBottom: 20, fontWeight: 700, border: '1px solid #bbf7d0' }}>
            ✓ Password updated. You can now log in with your new password.
          </div>
        )}
        {timedOut && (
          <div style={{ background: '#fff8e1', color: '#b45309', fontSize: 13, padding: '11px 14px', borderRadius: 12, marginBottom: 20, fontWeight: 600, border: '1px solid #fde68a' }}>
            ⏱ Your session expired due to inactivity. Please log in again.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#166534', marginBottom: 7 }}>
              Email Address *
            </label>
            <input
              className="oj-login-input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="yourname@email.com"
              autoComplete="email"
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#166534', marginBottom: 7 }}>
              Password *
            </label>
            <input
              className="oj-login-input"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Your password"
              autoComplete="current-password"
            />
          </div>

          {/* Forgot password */}
          <div style={{ textAlign: 'right', marginBottom: 16 }}>
            <Link to="/reset-password" style={{ fontSize: 13, color: '#16a34a', textDecoration: 'none', fontWeight: 700 }}>
              Forgot your password?
            </Link>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#dc2626', fontSize: 13, padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting} className="oj-login-btn">
            {submitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {/* Footer links */}
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <p style={{ fontSize: 13, color: '#4b6358', margin: 0 }}>
            No account yet?{' '}
            <Link to="/signup" style={{ color: '#16a34a', fontWeight: 700, textDecoration: 'none' }}>Create one here</Link>
          </p>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
            Are you an employer?{' '}
            <Link to="/employer/login" style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}>Employer login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
