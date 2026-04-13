import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { APP_NAME } from '../config/constants'

const LGAs = [
  'Saki West', 'Saki East', 'Atisbo', 'Oorelope', 'Olorunsogo',
  'Iseyin', 'Itesiwaju', 'Kajola', 'Iwajowa', 'Irepo'
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

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  .oj-input {
    width: 100%; padding: 12px 14px; font-size: 14px;
    font-family: 'Outfit', sans-serif;
    border: 1.5px solid #dcfce7; border-radius: 12px;
    background: #f0fdf4; color: #14532d; outline: none;
    transition: border 0.15s, box-shadow 0.15s;
  }
  .oj-input::placeholder { color: #9ca3af; }
  .oj-input:focus {
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22,163,74,0.12);
    background: #fff;
  }
  .oj-btn {
    width: 100%; padding: 14px; background: #16a34a; color: #fff;
    font-size: 15px; font-weight: 700; font-family: 'Outfit', sans-serif;
    border: none; border-radius: 50px; cursor: pointer;
    box-shadow: 0 2px 8px rgba(22,163,74,0.18);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .oj-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 3px 12px rgba(22,163,74,0.22); }
  .oj-btn:disabled { background: #9ca3af; cursor: not-allowed; box-shadow: none; }
  .oj-back-btn {
    padding: 14px 20px; background: #fff; color: #555;
    font-size: 15px; font-weight: 700; font-family: 'Outfit', sans-serif;
    border: 1.5px solid #dcfce7; border-radius: 50px; cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }
  .oj-back-btn:hover { border-color: #16a34a; color: #16a34a; }
`

export default function EmployerSignup() {
  const [step, setStep] = useState(1)
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

      const userId = signUpData.user?.id
      if (userId) {
        const { error: insertError } = await supabase.from('employers').insert({
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

        if (insertError) {
          try {
            localStorage.setItem('okeogun_pending_employer', JSON.stringify({
              auth_user_id: userId,
              organization_name: profile.organization_name.trim(),
              contact_person: profile.contact_person.trim(),
              phone_number: profile.phone_number.trim(),
              email: account.email.trim(),
              lga: profile.lga || null,
              industry: profile.industry || null,
              description: profile.description.trim() || null,
              status: 'pending',
            }))
          } catch (_) {}
        }
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
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', fontFamily: "'Outfit', sans-serif",
      }}>
        <style>{CSS}</style>
        <div style={{
          background: '#fff', borderRadius: 24, padding: '40px 36px',
          width: '100%', maxWidth: 440,
          border: '1.5px solid #dcfce7',
          boxShadow: '0 8px 32px rgba(22,163,74,0.1)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#14532d', margin: '0 0 12px' }}>
            Check your email
          </h1>
          <p style={{ fontSize: 14, color: '#4b6358', lineHeight: 1.65, margin: '0 0 12px' }}>
            We sent a confirmation link to <strong>{sentEmail}</strong>. Open the link to activate
            your employer account, then come back to post your first job.
          </p>
          <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 28 }}>
            Check your spam folder if you do not see it within a few minutes.
          </p>
          <Link to="/employer/login" className="oj-btn" style={{ display: 'block', textDecoration: 'none', borderRadius: 50 }}>
            Go to Employer Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', fontFamily: "'Outfit', sans-serif",
    }}>
      <style>{CSS}</style>

      <div style={{
        background: '#fff', borderRadius: 24, padding: '40px 36px',
        width: '100%', maxWidth: 440,
        border: '1.5px solid #dcfce7',
        boxShadow: '0 8px 32px rgba(22,163,74,0.1)',
      }}>

        {/* Employer badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dcfce7', color: '#166534', borderRadius: 50, padding: '5px 14px', fontSize: 12, fontWeight: 700, marginBottom: 20 }}>
          <Building size={13} strokeWidth={2.5} /> Employer Account
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 0 }}>
          {/* Step 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: step >= 1 ? '#16a34a' : '#fff',
              border: `2px solid ${step >= 1 ? '#16a34a' : '#dcfce7'}`,
              color: step >= 1 ? '#fff' : '#9ca3af',
              fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>1</div>
            <span style={{ fontSize: 11, fontWeight: 600, color: step >= 1 ? '#16a34a' : '#9ca3af' }}>Account</span>
          </div>

          {/* Connector line */}
          <div style={{ flex: 1, height: 2, background: step >= 2 ? '#16a34a' : '#dcfce7', margin: '0 8px', marginBottom: 18 }} />

          {/* Step 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: step >= 2 ? '#16a34a' : '#fff',
              border: `2px solid ${step >= 2 ? '#16a34a' : '#dcfce7'}`,
              color: step >= 2 ? '#fff' : '#9ca3af',
              fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>2</div>
            <span style={{ fontSize: 11, fontWeight: 600, color: step >= 2 ? '#16a34a' : '#9ca3af' }}>Organisation</span>
          </div>
        </div>

        {/* ── Step 1 ── */}
        {step === 1 && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#14532d', margin: '0 0 8px' }}>
              Create an employer account
            </h1>
            <p style={{ fontSize: 14, color: '#4b6358', lineHeight: 1.65, margin: '0 0 24px' }}>
              Sign up to post jobs and manage applications on {APP_NAME}. You will confirm
              your email before logging in.
            </p>

            <form onSubmit={handleStep1}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#166634', marginBottom: 7 }}>
                  Email Address *
                </label>
                <input
                  className="oj-input" type="email" name="email"
                  value={account.email} onChange={handleAccountChange}
                  placeholder="contact@yourorganisation.com"
                  autoComplete="email"
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#166634', marginBottom: 7 }}>
                  Password *
                </label>
                <input
                  className="oj-input" type="password" name="password"
                  value={account.password} onChange={handleAccountChange}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#166634', marginBottom: 7 }}>
                  Confirm Password *
                </label>
                <input
                  className="oj-input" type="password" name="confirmPassword"
                  value={account.confirmPassword} onChange={handleAccountChange}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div style={{ background: '#fee2e2', color: '#dc2626', fontSize: 13, padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontWeight: 600 }}>
                  {error}
                </div>
              )}

              <button type="submit" className="oj-btn">
                Continue →
              </button>
            </form>
          </>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#14532d', margin: '0 0 8px' }}>
              Your organisation details
            </h1>
            <p style={{ fontSize: 14, color: '#4b6358', lineHeight: 1.65, margin: '0 0 24px' }}>
              This information will be saved to your profile and attached to every job you post.
              You will not need to fill it in again.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#166634', marginBottom: 7 }}>
                  Organisation / Business Name *
                </label>
                <input
                  className="oj-input" type="text" name="organization_name"
                  value={profile.organization_name} onChange={handleProfileChange}
                  placeholder="e.g. Saki Farms Ltd, ABC Clinic"
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#166634', marginBottom: 7 }}>
                  Contact Person *
                </label>
                <input
                  className="oj-input" type="text" name="contact_person"
                  value={profile.contact_person} onChange={handleProfileChange}
                  placeholder="Full name of the hiring contact"
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#166634', marginBottom: 7 }}>
                  Phone Number *
                </label>
                <input
                  className="oj-input" type="tel" name="phone_number"
                  value={profile.phone_number} onChange={handleProfileChange}
                  placeholder="e.g. 08012345678"
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#166634', marginBottom: 7 }}>
                  LGA
                </label>
                <select
                  className="oj-input" name="lga"
                  value={profile.lga} onChange={handleProfileChange}
                >
                  <option value="">Select LGA</option>
                  {LGAs.map(lga => (
                    <option key={lga} value={lga}>{lga}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#166634', marginBottom: 7 }}>
                  Industry / Sector
                </label>
                <select
                  className="oj-input" name="industry"
                  value={profile.industry} onChange={handleProfileChange}
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#166634', marginBottom: 7 }}>
                  Brief Description (optional)
                </label>
                <textarea
                  className="oj-input"
                  style={{ height: 90, resize: 'vertical' }}
                  name="description"
                  value={profile.description} onChange={handleProfileChange}
                  placeholder="One or two sentences about what your organisation does"
                />
              </div>

              {error && (
                <div style={{ background: '#fee2e2', color: '#dc2626', fontSize: 13, padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontWeight: 600 }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="oj-back-btn"
                  onClick={() => { setStep(1); setError('') }}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="oj-btn"
                  style={{ flex: 1 }}
                >
                  {submitting ? 'Creating account...' : 'Create Employer Account'}
                </button>
              </div>
            </form>
          </>
        )}

        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <p style={{ fontSize: 13, color: '#4b6358', margin: 0 }}>
            Already have an employer account?{' '}
            <Link to="/employer/login" style={{ color: '#16a34a', fontWeight: 700, textDecoration: 'none' }}>Log in</Link>
          </p>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
            Looking for work?{' '}
            <Link to="/signup" style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}>Register as a job seeker</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
