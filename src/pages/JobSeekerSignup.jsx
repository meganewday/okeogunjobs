import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { APP_NAME } from '../config/constants'
import { verifyRecaptcha } from '../lib/recaptcha'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  .oj-input {
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
  .oj-input::placeholder { color: #9ca3af; }
  .oj-input:focus {
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22,163,74,0.12);
    background: #fff;
  }
  .oj-btn {
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
    box-shadow: 0 2px 8px rgba(22,163,74,0.18);
    transition: transform 0.15s, box-shadow 0.15s;
    display: block;
    text-align: center;
    text-decoration: none;
  }
  .oj-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 3px 12px rgba(22,163,74,0.22);
  }
  .oj-btn:disabled { background: #9ca3af; cursor: not-allowed; box-shadow: none; }
`

export default function JobSeekerSignup() {
  const [form, setForm]             = useState({ email: '', password: '', confirmPassword: '' })
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent]             = useState(false)
  const [sentEmail, setSentEmail]   = useState('')
  const [error, setError]           = useState('')

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
      const { allowed, error: captchaError } = await verifyRecaptcha('signup')
      if (!allowed) {
        setError(captchaError || 'We could not verify your submission. Please try again.')
        setSubmitting(false)
        return
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/email-confirmed`,
        },
      })
      if (signUpError) throw signUpError

      // Detect duplicate email — Supabase silently succeeds with empty identities
      if (signUpData?.user?.identities?.length === 0) {
        setError('An account with this email already exists. Try logging in instead.')
        setSubmitting(false)
        return
      }

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

  const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 24px',
    fontFamily: "'Outfit', sans-serif",
  }

  const cardStyle = {
    background: '#fff',
    borderRadius: 24,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 440,
    border: '1.5px solid #dcfce7',
    boxShadow: '0 8px 32px rgba(22,163,74,0.1)',
  }

  // ── Confirmation sent state ───────────────────────────────────────────────
  if (sent) {
    return (
      <div style={pageStyle}>
        <style>{CSS}</style>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
                  <div style={{ fontSize: 52, marginBottom: 16 }}>✉️</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#14532d', margin: '0 0 12px' }}>
            Check your email
          </h1>
          <p style={{ fontSize: 14, color: '#4b6358', lineHeight: 1.7, margin: '0 0 10px' }}>
            We sent a confirmation link to <strong style={{ color: '#14532d' }}>{sentEmail}</strong>.
            Open the link in your email to activate your account, then come back to complete your profile.
          </p>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 28px' }}>
            Check your spam folder if you do not see it within a few minutes.
          </p>
          <Link to="/login" className="oj-btn">Go to Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <style>{CSS}</style>

      <div style={cardStyle}>
        
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#14532d', margin: '0 0 8px' }}>
          Create your account
        </h1>
        <p style={{ fontSize: 14, color: '#4b6358', lineHeight: 1.65, margin: '0 0 28px' }}>
          Sign up to register your profile on {APP_NAME} and apply for jobs directly from the platform.
          You will need to confirm your email before you can log in.
        </p>

        <form onSubmit={handleSubmit}>
          {[
            { label: 'Email Address *',   name: 'email',           type: 'email',    placeholder: 'yourname@email.com',   autoComplete: 'email' },
            { label: 'Password *',        name: 'password',        type: 'password', placeholder: 'At least 8 characters', autoComplete: 'new-password' },
            { label: 'Confirm Password *',name: 'confirmPassword', type: 'password', placeholder: 'Repeat your password',  autoComplete: 'new-password' },
          ].map(f => (
            <div key={f.name} style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#166634', marginBottom: 7 }}>
                {f.label}
              </label>
              <input
                className="oj-input"
                type={f.type}
                name={f.name}
                value={form[f.name]}
                onChange={handleChange}
                placeholder={f.placeholder}
                autoComplete={f.autoComplete}
              />
            </div>
          ))}

          {error && (
            <div style={{ background: '#fee2e2', color: '#dc2626', fontSize: 13, padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting} className="oj-btn">
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <p style={{ fontSize: 13, color: '#4b6358', margin: 0 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#16a34a', fontWeight: 700, textDecoration: 'none' }}>Log in</Link>
          </p>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
            Looking to post a job?{' '}
            <Link to="/employer/signup" style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}>Register as an employer</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
