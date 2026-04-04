import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { APP_NAME } from '../config/constants'

const LGAs = [
  'Saki West', 'Saki East', 'Atisbo', 'Oorelope', 'Olorunsogo',
  'Iseyin', 'Itesiwaju', 'Kajola', 'Iwajowa',
]

const INDUSTRIES = [
  'Agriculture / Farming', 'Construction / Real Estate', 'Education / Training',
  'Healthcare / Medical', 'Hospitality / Food & Beverage', 'Manufacturing / Production',
  'Retail / Trade', 'Security / Safety', 'Technology / ICT', 'Transport / Logistics',
  'NGO / Community Organisation', 'Government / Public Service', 'Other',
]

const BUSINESS_TYPES = [
  'Sole Proprietorship', 'Partnership', 'Private Limited Company (Ltd)',
  'Public Limited Company (PLC)', 'NGO / Non-Profit', 'Government Agency', 'Other',
]

// ─── Global CSS ───────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  .oj-input {
    width: 100%; padding: 11px 14px; font-size: 14px;
    font-family: 'Outfit', sans-serif;
    border: 1.5px solid #dcfce7; border-radius: 12px;
    background: #f0fdf4; color: #14532d; outline: none;
    transition: border 0.15s, box-shadow 0.15s;
  }
  .oj-input::placeholder { color: #9ca3af; }
  .oj-input:focus { border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,0.12); background: #fff; }
  .oj-btn {
    display: inline-block; padding: 13px 28px;
    background: #16a34a; color: #fff; font-size: 15px; font-weight: 700;
    font-family: 'Outfit', sans-serif; border: none; border-radius: 50px;
    cursor: pointer; text-decoration: none; text-align: center;
    box-shadow: 0 4px 14px rgba(22,163,74,0.32);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .oj-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(22,163,74,0.4); }
  .oj-btn:disabled, .oj-btn-disabled { background: #9ca3af !important; cursor: not-allowed !important; box-shadow: none !important; }
  .oj-back-btn {
    padding: 13px 20px; background: #fff; color: #4b6358;
    border: 1.5px solid #dcfce7; border-radius: 50px; cursor: pointer;
    font-size: 15px; font-weight: 700; font-family: 'Outfit', sans-serif;
    transition: all 0.15s;
  }
  .oj-back-btn:hover { background: #f0fdf4; }
`

function LogoMark() {
  return (
    <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:8, textDecoration:'none', marginBottom:24 }}>
      <img src="/logo.png" alt="OkeOgunJobs" style={{ height:36, width:'auto', borderRadius:7 }} />
      <span style={{ fontFamily:"'Outfit',sans-serif", fontSize:17, fontWeight:900, letterSpacing:'-0.02em' }}>
        <span style={{ color:'#14532d' }}>Oke-Ogun </span>
        <span style={{ color:'#16a34a' }}>Jobs</span>
      </span>
    </Link>
  )
}

function FieldLabel({ children, required }) {
  return (
    <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#166634', marginBottom:7 }}>
      {children}{required && ' *'}
    </label>
  )
}

export default function EmployerSignup() {
  const [step, setStep]       = useState(1)
  const [account, setAccount] = useState({ email:'', password:'', confirmPassword:'' })
  const [profile, setProfile] = useState({
    organization_name:'', contact_person:'', phone_number:'',
    lga:'', industry:'', description:'', cac_number:'',
    business_type:'', year_registered:'',
  })
  const [logoFile, setLogoFile]         = useState(null)
  const [logoPreview, setLogoPreview]   = useState(null)
  const [logoError, setLogoError]       = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [checkingCac, setCheckingCac]   = useState(false)
  const [sent, setSent]                 = useState(false)
  const [sentEmail, setSentEmail]       = useState('')
  const [error, setError]               = useState('')

  function handleAccountChange(e) {
    const { name, value } = e.target
    setAccount(prev => ({ ...prev, [name]: value }))
  }

  function handleProfileChange(e) {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  function handleLogoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) { setLogoError('Only JPG, PNG or WebP images are allowed.'); return }
    if (file.size > 2 * 1024 * 1024) { setLogoError('Logo must be under 2MB.'); return }
    setLogoError('')
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function handleStep1(e) {
    e.preventDefault()
    setError('')
    if (!account.email || !account.password) { setError('Email and password are required.'); return }
    if (account.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (account.password !== account.confirmPassword) { setError('Passwords do not match.'); return }
    setStep(2)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!profile.organization_name || !profile.contact_person || !profile.phone_number) {
      setError('Organisation name, contact person, and phone number are required.')
      return
    }
    if (!logoFile) {
      setError('A company logo is required.')
      return
    }

    // CAC duplicate check
    const cacValue = profile.cac_number.trim()
    if (cacValue) {
      setCheckingCac(true)
      const { data: existingCac } = await supabase
        .from('employers').select('id').eq('cac_number', cacValue).maybeSingle()
      setCheckingCac(false)
      if (existingCac) {
        setError('This CAC number is already registered. If this is your business and you have lost access to your account, contact us for help.')
        return
      }
    }

    setSubmitting(true)
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: account.email.trim(),
        password: account.password,
        options: { emailRedirectTo: `${window.location.origin}/employer/email-confirmed` },
      })
      if (signUpError) throw signUpError

      if (signUpData?.user?.identities?.length === 0) {
        setError('An account with this email already exists. Try logging in instead.')
        setSubmitting(false)
        return
      }

      // Upload logo
      let logo_url = null
      const logoExt  = logoFile.name.split('.').pop()
      const logoName = `logo_${Date.now()}_${Math.random().toString(36).substring(2)}.${logoExt}`
      const { error: logoUploadError } = await supabase.storage.from('logos').upload(logoName, logoFile, { upsert: true })
      if (logoUploadError) throw logoUploadError
      const { data: logoUrlData } = supabase.storage.from('logos').getPublicUrl(logoName)
      logo_url = logoUrlData.publicUrl

      const userId = signUpData.user?.id
      if (userId) {
        const insertPayload = {
          auth_user_id:      userId,
          organization_name: profile.organization_name.trim(),
          contact_person:    profile.contact_person.trim(),
          phone_number:      profile.phone_number.trim(),
          email:             account.email.trim(),
          lga:               profile.lga || null,
          industry:          profile.industry || null,
          description:       profile.description.trim() || null,
          cac_number:        cacValue || null,
          business_type:     profile.business_type || null,
          year_registered:   profile.year_registered.trim() || null,
          logo_url,
          status: 'pending',
        }

        const { error: insertError } = await supabase.from('employers').insert(insertPayload)
        if (insertError) {
          // RLS blocked — save locally for recovery on first login
          try { localStorage.setItem('okeogun_pending_employer', JSON.stringify(insertPayload)) } catch (_) {}
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

  const pageStyle = {
    minHeight:'100vh',
    background:'linear-gradient(135deg,#f0fdf4 0%,#dcfce7 50%,#bbf7d0 100%)',
    display:'flex', alignItems:'center', justifyContent:'center',
    padding:'40px 24px', fontFamily:"'Outfit',sans-serif",
  }
  const cardStyle = {
    background:'#fff', borderRadius:24,
    padding:'40px 36px', width:'100%', maxWidth:500,
    border:'1.5px solid #dcfce7',
    boxShadow:'0 8px 32px rgba(22,163,74,0.1)',
  }

  // ── Confirmation sent ─────────────────────────────────────────────────────
  if (sent) {
    return (
      <div style={pageStyle}>
        <style>{CSS}</style>
        <div style={{ ...cardStyle, textAlign:'center' }}>
          
          <div style={{ fontSize:52, marginBottom:16 }}>✉️</div>
          <h1 style={{ fontSize:22, fontWeight:900, color:'#14532d', margin:'0 0 12px' }}>Check your email</h1>
          <p style={{ fontSize:14, color:'#4b6358', lineHeight:1.7, margin:'0 0 10px' }}>
            We sent a confirmation link to <strong style={{ color:'#14532d' }}>{sentEmail}</strong>. Open the link to activate your employer account, then come back to post your first job.
          </p>
          <p style={{ fontSize:13, color:'#9ca3af', margin:'0 0 28px' }}>
            Check your spam folder if you do not see it within a few minutes.
          </p>
          <Link to="/employer/login" className="oj-btn" style={{ display:'block', width:'100%' }}>Go to Employer Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <style>{CSS}</style>

      <div style={cardStyle}>
        
        {/* Employer badge */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#dcfce7', color:'#166534', borderRadius:50, padding:'5px 14px', fontSize:12, fontWeight:700, marginBottom:20 }}>
          🏢 Employer Registration
        </div>

        {/* Step indicator */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', marginBottom:28, gap:0 }}>
          {[1, 2].map((s, i) => (
            <div key={s} style={{ display:'flex', alignItems:'center' }}>
              <div style={{
                width:36, height:36, borderRadius:'50%', fontSize:14, fontWeight:800,
                display:'flex', alignItems:'center', justifyContent:'center',
                background: step >= s ? '#16a34a' : '#f0fdf4',
                color: step >= s ? '#fff' : '#9ca3af',
                border: `2px solid ${step >= s ? '#16a34a' : '#dcfce7'}`,
                transition:'all 0.2s',
              }}>
                {step > s ? '✓' : s}
              </div>
              {i === 0 && (
                <div style={{ width:52, height:2, background: step > 1 ? '#16a34a' : '#dcfce7', transition:'background 0.3s' }} />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 1 — Account ───────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <h1 style={{ fontSize:21, fontWeight:900, color:'#14532d', margin:'0 0 8px', textAlign:'center' }}>
              Create an employer account
            </h1>
            <p style={{ fontSize:14, color:'#4b6358', lineHeight:1.65, margin:'0 0 24px', textAlign:'center' }}>
              Sign up to post jobs and manage applications on {APP_NAME}. You will confirm your email before logging in.
            </p>

            <form onSubmit={handleStep1}>
              {[
                { label:'Email Address', name:'email',           type:'email',    placeholder:'contact@yourorganisation.com', ac:'email',        required:true },
                { label:'Password',      name:'password',        type:'password', placeholder:'At least 8 characters',        ac:'new-password', required:true },
                { label:'Confirm Password', name:'confirmPassword', type:'password', placeholder:'Repeat your password',      ac:'new-password', required:true },
              ].map(f => (
                <div key={f.name} style={{ marginBottom:18 }}>
                  <FieldLabel required={f.required}>{f.label}</FieldLabel>
                  <input className="oj-input" type={f.type} name={f.name}
                    value={account[f.name]} onChange={handleAccountChange}
                    placeholder={f.placeholder} autoComplete={f.ac} />
                </div>
              ))}

              {error && (
                <div style={{ background:'#fee2e2', color:'#dc2626', fontSize:13, padding:'10px 14px', borderRadius:10, marginBottom:16, fontWeight:600 }}>
                  {error}
                </div>
              )}

              <button type="submit" className="oj-btn" style={{ width:'100%' }}>
                Continue →
              </button>
            </form>
          </>
        )}

        {/* ── STEP 2 — Organisation details ─────────────────────────────── */}
        {step === 2 && (
          <>
            <h1 style={{ fontSize:21, fontWeight:900, color:'#14532d', margin:'0 0 8px', textAlign:'center' }}>
              Your organisation details
            </h1>
            <p style={{ fontSize:14, color:'#4b6358', lineHeight:1.65, margin:'0 0 24px', textAlign:'center' }}>
              This information will be saved to your profile and attached to every job you post.
            </p>

            <form onSubmit={handleSubmit}>

              {/* ── COMPANY LOGO ──────────────────────────────────────── */}
              <div style={{ marginBottom:24 }}>
                <FieldLabel required>Company Logo</FieldLabel>
                <p style={{ fontSize:13, color:'#9ca3af', margin:'0 0 12px' }}>
                  JPG, PNG or WebP, max 2MB. Shown on your listings and employer profile.
                </p>
                <div style={{ display:'flex', alignItems:'center', gap:18, flexWrap:'wrap' }}>
                  {/* Preview */}
                  <div style={{ width:72, height:72, borderRadius:14, border:'2px solid #dcfce7', overflow:'hidden', flexShrink:0, background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
                    ) : (
                      <span style={{ fontSize:28 }}>🏢</span>
                    )}
                  </div>
                  <div>
                    <label style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:50, border:'1.5px solid #bbf7d0', background:'#f0fdf4', fontSize:13, fontWeight:700, color:'#16a34a', cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                      🖼 {logoFile ? 'Change Logo' : 'Upload Logo *'}
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoChange} style={{ display:'none' }} />
                    </label>
                    {logoFile && <p style={{ fontSize:12, color:'#16a34a', marginTop:6, fontWeight:600 }}>✓ {logoFile.name}</p>}
                    {logoError && <p style={{ fontSize:12, color:'#dc2626', marginTop:6 }}>{logoError}</p>}
                  </div>
                </div>
              </div>

              {/* Core details */}
              {[
                { label:'Organisation / Business Name', name:'organization_name', type:'text', placeholder:'e.g. Saki Farms Ltd, ABC Clinic', required:true },
                { label:'Contact Person',               name:'contact_person',    type:'text', placeholder:'Full name of the hiring contact', required:true },
                { label:'Phone Number',                 name:'phone_number',      type:'tel',  placeholder:'e.g. 08012345678', required:true },
              ].map(f => (
                <div key={f.name} style={{ marginBottom:18 }}>
                  <FieldLabel required={f.required}>{f.label}</FieldLabel>
                  <input className="oj-input" type={f.type} name={f.name}
                    value={profile[f.name]} onChange={handleProfileChange}
                    placeholder={f.placeholder} />
                </div>
              ))}

              <div style={{ marginBottom:18 }}>
                <FieldLabel>LGA</FieldLabel>
                <select className="oj-input" name="lga" value={profile.lga} onChange={handleProfileChange}>
                  <option value="">Select LGA</option>
                  {LGAs.map(lga => <option key={lga} value={lga}>{lga}</option>)}
                </select>
              </div>

              <div style={{ marginBottom:18 }}>
                <FieldLabel>Industry / Sector</FieldLabel>
                <select className="oj-input" name="industry" value={profile.industry} onChange={handleProfileChange}>
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              <div style={{ marginBottom:18 }}>
                <FieldLabel>Brief Description (optional)</FieldLabel>
                <textarea
                  className="oj-input"
                  style={{ height:90, resize:'vertical' }}
                  name="description"
                  value={profile.description}
                  onChange={handleProfileChange}
                  placeholder="One or two sentences about what your organisation does"
                />
              </div>

              {/* CAC section */}
              <div style={{ background:'#f0fdf4', border:'1.5px solid #dcfce7', borderRadius:16, padding:'20px', marginBottom:20 }}>
                <p style={{ fontSize:14, fontWeight:800, color:'#16a34a', margin:'0 0 6px' }}>CAC Registration (optional)</p>
                <p style={{ fontSize:13, color:'#4b6358', lineHeight:1.55, margin:'0 0 16px' }}>
                  If your business is registered with the Corporate Affairs Commission, enter the details below. Each CAC number can only be registered once.
                </p>
                <div style={{ marginBottom:14 }}>
                  <FieldLabel>CAC Registration Number</FieldLabel>
                  <input className="oj-input" type="text" name="cac_number"
                    value={profile.cac_number} onChange={handleProfileChange}
                    placeholder="e.g. RC1234567 or BN1234567" />
                </div>
                <div style={{ marginBottom:14 }}>
                  <FieldLabel>Business Type</FieldLabel>
                  <select className="oj-input" name="business_type" value={profile.business_type} onChange={handleProfileChange}>
                    <option value="">Select business type</option>
                    {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel>Year Registered</FieldLabel>
                  <input className="oj-input" type="text" name="year_registered"
                    value={profile.year_registered} onChange={handleProfileChange}
                    placeholder="e.g. 2018" maxLength={4} />
                </div>
              </div>

              {error && (
                <div style={{ background:'#fee2e2', color:'#dc2626', fontSize:13, padding:'10px 14px', borderRadius:10, marginBottom:16, fontWeight:600 }}>
                  {error}
                </div>
              )}

              <div style={{ display:'flex', gap:10 }}>
                <button type="button" onClick={() => { setStep(1); setError('') }} className="oj-back-btn">
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={submitting || checkingCac}
                  className={`oj-btn${submitting || checkingCac ? ' oj-btn-disabled' : ''}`}
                  style={{ flex:1 }}
                >
                  {checkingCac ? 'Checking...' : submitting ? 'Creating account...' : 'Create Employer Account'}
                </button>
              </div>
            </form>
          </>
        )}

        <div style={{ marginTop:24, display:'flex', flexDirection:'column', gap:10, alignItems:'center' }}>
          <p style={{ fontSize:13, color:'#4b6358', margin:0 }}>
            Already have an employer account?{' '}
            <Link to="/employer/login" style={{ color:'#16a34a', fontWeight:700, textDecoration:'none' }}>Log in</Link>
          </p>
          <p style={{ fontSize:13, color:'#9ca3af', margin:0 }}>
            Looking for work?{' '}
            <Link to="/signup" style={{ color:'#16a34a', fontWeight:600, textDecoration:'none' }}>Register as a job seeker</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
