import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { APP_NAME } from '../config/constants'

const LGAs = [
  'Saki West', 'Saki East', 'Atisbo', 'Oorelope', 'Olorunsogo',
  'Iseyin', 'Itesiwaju', 'Kajola', 'Iwajowa'
]

const INDUSTRIES = [
  'Agriculture / Farming',
  'Construction / Real Estate',
  'Education / Training',
  'Healthcare / Medical',
  'Hospitality / Food & Beverage',
  'Manufacturing / Production',
  'Retail / Trade',
  'Security / Safety',
  'Technology / ICT',
  'Transport / Logistics',
  'NGO / Community Organisation',
  'Government / Public Service',
  'Other',
]

export default function EmployerSignup() {
  const [step, setStep] = useState(1) // 1 = account, 2 = company profile
  const [account, setAccount] = useState({ email: '', password: '', confirmPassword: '' })
  const [profile, setProfile] = useState({
    organization_name: '',
    contact_person: '',
    phone_number: '',
    lga: '',
    industry: '',
    description: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')
  const [error, setError] = useState('')

  function handleAccountChange(e) {
    const { name, value } = e.target
    setAccount(prev => ({ ...prev, [name]: value }))
  }

  function handleProfileChange(e) {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  function handleStep1(e) {
    e.preventDefault()
    setError('')
    if (!account.email || !account.password) {
      setError('Email and password are required.')
      return
    }
    if (account.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (account.password !== account.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setStep(2)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!profile.organization_name || !profile.contact_person || !profile.phone_number) {
      setError('Organisation name, contact person, and phone number are required.')
      return
    }

    setSubmitting(true)
    try {
      // 1. Create auth account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: account.email.trim(),
        password: account.password,
        options: {
          emailRedirectTo: `${window.location.origin}/employer/email-confirmed`,
        },
      })
      if (signUpError) throw signUpError

      if (signUpData?.user?.identities?.length === 0) {
        setError('An account with this email already exists. Try logging in instead.')
        setSubmitting(false)
        return
      }

      // 2. Create employer profile row immediately
      const userId = signUpData.user?.id
      if (userId) {
        await supabase.from('employers').insert({
          auth_user_id: userId,
          organization_name: profile.organization_name.trim(),
          contact_person: profile.contact_person.trim(),
          phone_number: profile.phone_number.trim(),
          email: account.email.trim(),
          lga: profile.lga || null,
          industry: profile.industry || null,
          description: profile.description.trim() || null,
          status: 'pending',
        })
        // Note: insert errors are non-fatal here — profile can be completed later
      }

      setSentEmail(account.email.trim())
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
          <div style={styles.icon}>✉️</div>
          <h1 style={styles.title}>Check your email</h1>
          <p style={styles.subtitle}>
            We sent a confirmation link to <strong>{sentEmail}</strong>. Open the
            link to activate your employer account, then come back to post your
            first job.
          </p>
          <p style={styles.hint}>
            Check your spam folder if you do not see it within a few minutes.
          </p>
          <Link to="/employer/login" style={styles.btn}>Go to Employer Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Step indicator */}
        <div style={styles.stepRow}>
          <div style={{ ...styles.stepDot, ...(step >= 1 ? styles.stepDotActive : {}) }}>1</div>
          <div style={styles.stepLine} />
          <div style={{ ...styles.stepDot, ...(step >= 2 ? styles.stepDotActive : {}) }}>2</div>
        </div>

        {step === 1 && (
          <>
            <h1 style={styles.title}>Create an employer account</h1>
            <p style={styles.subtitle}>
              Sign up to post jobs and manage applications on {APP_NAME}.
              You will confirm your email before logging in.
            </p>

            <form onSubmit={handleStep1} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Email Address *</label>
                <input
                  style={styles.input}
                  type="email"
                  name="email"
                  value={account.email}
                  onChange={handleAccountChange}
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
                  value={account.password}
                  onChange={handleAccountChange}
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
                  value={account.confirmPassword}
                  onChange={handleAccountChange}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                />
              </div>

              {error && <p style={styles.error}>{error}</p>}

              <button type="submit" style={{ ...styles.btn, width: '100%', marginTop: '4px' }}>
                Continue →
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h1 style={styles.title}>Your organisation details</h1>
            <p style={styles.subtitle}>
              This information will be saved to your profile and attached to every
              job you post. You will not need to fill it in again.
            </p>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Organisation / Business Name *</label>
                <input
                  style={styles.input}
                  type="text"
                  name="organization_name"
                  value={profile.organization_name}
                  onChange={handleProfileChange}
                  placeholder="e.g. Saki Farms Ltd, ABC Clinic"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Contact Person *</label>
                <input
                  style={styles.input}
                  type="text"
                  name="contact_person"
                  value={profile.contact_person}
                  onChange={handleProfileChange}
                  placeholder="Full name of the hiring contact"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Phone Number *</label>
                <input
                  style={styles.input}
                  type="tel"
                  name="phone_number"
                  value={profile.phone_number}
                  onChange={handleProfileChange}
                  placeholder="e.g. 08012345678"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>LGA</label>
                <select
                  style={styles.input}
                  name="lga"
                  value={profile.lga}
                  onChange={handleProfileChange}
                >
                  <option value="">Select LGA</option>
                  {LGAs.map(lga => (
                    <option key={lga} value={lga}>{lga}</option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Industry / Sector</label>
                <select
                  style={styles.input}
                  name="industry"
                  value={profile.industry}
                  onChange={handleProfileChange}
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Brief Description (optional)</label>
                <textarea
                  style={{ ...styles.input, height: '90px', resize: 'vertical' }}
                  name="description"
                  value={profile.description}
                  onChange={handleProfileChange}
                  placeholder="One or two sentences about what your organisation does"
                />
              </div>

              {error && <p style={styles.error}>{error}</p>}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError('') }}
                  style={styles.backBtn}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ ...styles.btn, flex: 1, ...(submitting ? styles.btnDisabled : {}) }}
                >
                  {submitting ? 'Creating account...' : 'Create Employer Account'}
                </button>
              </div>
            </form>
          </>
        )}

        <p style={styles.footer}>
          Already have an employer account?{' '}
          <Link to="/employer/login" style={styles.link}>Log in</Link>
        </p>
        <p style={styles.footer}>
          Looking for work?{' '}
          <Link to="/signup" style={styles.link}>Register as a job seeker</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f5f7f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '40px 32px', width: '100%', maxWidth: '480px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  icon: { fontSize: '48px', marginBottom: '16px', textAlign: 'center' },
  stepRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '28px' },
  stepDot: { width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #ddd', backgroundColor: '#fff', color: '#aaa', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { borderColor: '#1a6b3c', backgroundColor: '#1a6b3c', color: '#fff' },
  stepLine: { width: '48px', height: '2px', backgroundColor: '#ddd' },
  title: { fontSize: '22px', fontWeight: 'bold', color: '#1a6b3c', marginBottom: '8px', textAlign: 'center' },
  subtitle: { fontSize: '14px', color: '#666', lineHeight: '1.6', marginBottom: '24px', textAlign: 'center' },
  hint: { fontSize: '13px', color: '#aaa', marginBottom: '24px', textAlign: 'center' },
  form: { textAlign: 'left' },
  field: { marginBottom: '18px' },
  label: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box', outline: 'none' },
  error: { color: '#e53e3e', fontSize: '13px', marginBottom: '12px' },
  btn: { display: 'inline-block', padding: '13px 28px', backgroundColor: '#1a6b3c', color: '#fff', fontSize: '15px', fontWeight: '600', border: 'none', borderRadius: '8px', cursor: 'pointer', textDecoration: 'none', boxSizing: 'border-box', textAlign: 'center' },
  btnDisabled: { backgroundColor: '#aaa', cursor: 'not-allowed' },
  backBtn: { padding: '13px 20px', backgroundColor: '#fff', color: '#555', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '600' },
  footer: { fontSize: '13px', color: '#666', textAlign: 'center', marginTop: '16px' },
  link: { color: '#1a6b3c', fontWeight: '600', textDecoration: 'none' },
}
