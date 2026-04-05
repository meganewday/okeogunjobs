import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { APP_NAME } from '../config/constants'
import { useAuth } from '../contexts/AuthContext'
import { verifyRecaptcha } from '../lib/recaptcha'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024)
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isDesktop
}

const LGAs = [
  'Saki West', 'Saki East', 'Atisbo', 'Oorelope', 'Olorunsogo',
  'Iseyin', 'Itesiwaju', 'Kajola', 'Iwajowa', 'Irepo',
]

const EDUCATION_LEVELS = [
  { value: 'no_formal_education', label: 'No Formal Education' },
  { value: 'primary',             label: 'Primary School' },
  { value: 'secondary',           label: 'Secondary School' },
  { value: 'ond',                 label: 'OND' },
  { value: 'hnd',                 label: 'HND' },
  { value: 'bsc',                 label: 'BSc / BA' },
  { value: 'postgraduate',        label: 'Postgraduate' },
]

const ACADEMIC_LEVELS = [
  { value: 'nd1',  label: 'ND 1 (Polytechnic)' },
  { value: 'nd2',  label: 'ND 2 (Polytechnic)' },
  { value: 'hnd1', label: 'HND 1 (Polytechnic)' },
  { value: 'hnd2', label: 'HND 2 (Polytechnic)' },
  { value: '100l', label: '100 Level (University)' },
  { value: '200l', label: '200 Level (University)' },
  { value: '300l', label: '300 Level (University)' },
  { value: '400l', label: '400 Level (University)' },
  { value: '500l', label: '500 Level (University)' },
  { value: 'nce',  label: 'NCE (College of Education)' },
]

const AGE_RANGES = ['18-25', '26-35', '36-45', '46-55', '55+']

const SEEKER_TYPES = [
  { value: 'skilled',   emoji: '🛠', label: 'Skilled Worker',      desc: 'You have a specific trade, skill, or professional background' },
  { value: 'unskilled', emoji: '💪', label: 'Unskilled Worker',     desc: 'You are available for general or physical labour' },
  { value: 'student',   emoji: '🎓', label: 'Student / IT / SIWES', desc: 'You are a student looking for industrial attachment or placement' },
]

function isValidNin(nin) {
  return /^\d{11}$/.test(nin.trim())
}

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
  .oj-input-error { border-color: #dc2626 !important; background: #fff5f5 !important; }
  .oj-input-valid { border-color: #16a34a !important; }
  .oj-skill-btn {
    padding: 7px 14px; font-size: 13px; border-radius: 50px;
    border: 1.5px solid #dcfce7; background: #f0fdf4;
    cursor: pointer; color: #166534; font-weight: 500;
    font-family: 'Outfit', sans-serif; transition: all 0.15s;
  }
  .oj-skill-btn:hover { border-color: #16a34a; background: #dcfce7; }
  .oj-skill-btn-active { background: #16a34a !important; color: #fff !important; border-color: #16a34a !important; font-weight: 700 !important; }
  .oj-submit-btn {
    width: 100%; padding: 14px; background: #16a34a; color: #fff;
    font-size: 15px; font-weight: 700; font-family: 'Outfit', sans-serif;
    border: none; border-radius: 50px; cursor: pointer;
    box-shadow: 0 2px 8px rgba(22,163,74,0.18);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .oj-submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 3px 12px rgba(22,163,74,0.22); }
  .oj-submit-btn:disabled { background: #9ca3af; cursor: not-allowed; box-shadow: none; }
  .oj-photo-upload-area {
    border: 2px dashed #bbf7d0; border-radius: 16px;
    padding: 24px; text-align: center; cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    background: #f0fdf4;
  }
  .oj-photo-upload-area:hover { border-color: #16a34a; background: #dcfce7; }
`

function SectionHeader({ children }) {
  return (
    <h3 style={{ fontSize: 15, fontWeight: 800, color: '#16a34a', margin: '28px 0 16px', paddingBottom: 10, borderBottom: '2px solid #dcfce7' }}>
      {children}
    </h3>
  )
}

function FieldLabel({ children, required }) {
  return (
    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#166634', marginBottom: 7 }}>
      {children}{required && ' *'}
    </label>
  )
}

export default function JobSeekerRegister() {
  const { user, refreshProfile } = useAuth()
  const navigate   = useNavigate()
  const isDesktop  = useIsDesktop()

  const [skills, setSkills]           = useState([])
  const [seekerType, setSeekerType]   = useState('')
  const [form, setForm]               = useState({
    full_name: '', phone_number: '', whatsapp_number: '',
    gender: '', age_range: '', location: '', ward: '', lga: '', nin: '',
    selectedSkills: [], education_level: '', years_of_experience: '',
    previous_workplace: '', institution: '', course_of_study: '',
    academic_level: '', preferred_lga: '', availability_period: '',
    consent: false,
  })
  const [cvFile, setCvFile]           = useState(null)
  const [photoFile, setPhotoFile]     = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoError, setPhotoError]   = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [success, setSuccess]         = useState(false)
  const [error, setError]             = useState('')

  useEffect(() => {
    async function fetchSkills() {
      const { data } = await supabase.from('skills').select('*').order('category')
      if (data) setSkills(data)
    }
    fetchSkills()
  }, [])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  function handleSeekerTypeChange(type) {
    setSeekerType(type)
    setForm(prev => ({ ...prev, selectedSkills: [] }))
  }

  function handleSkillToggle(skillId) {
    setForm(prev => {
      const already = prev.selectedSkills.includes(skillId)
      return { ...prev, selectedSkills: already ? prev.selectedSkills.filter(id => id !== skillId) : [...prev.selectedSkills, skillId] }
    })
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(file.type)) { setError('Only PDF or Word documents are allowed.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('File size must be under 5MB.'); return }
    setError('')
    setCvFile(file)
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) { setPhotoError('Only JPG, PNG or WebP images are allowed.'); return }
    if (file.size > 2 * 1024 * 1024) { setPhotoError('Photo must be under 2MB.'); return }
    setPhotoError('')
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!seekerType) { setError('Please select the type of worker you are.'); return }
    if (!form.full_name || !form.phone_number) { setError('Full name and phone number are required.'); return }
    if (!form.nin.trim()) { setError('Your NIN (National Identification Number) is required.'); return }
    if (!isValidNin(form.nin)) { setError('NIN must be exactly 11 digits with no spaces or letters.'); return }
    if (!photoFile) { setError('A profile photo is required.'); return }
    if (!form.consent) { setError('You need to agree to the privacy policy before submitting.'); return }

    setSubmitting(true)
    try {
      const { allowed, error: captchaError } = await verifyRecaptcha('register')
      if (!allowed) {
        setError(captchaError || 'We could not verify your submission. Please try again.')
        setSubmitting(false)
        return
      }

      // Check NIN duplicate
      const { data: existingNin } = await supabase
        .from('job_seekers').select('id').eq('nin', form.nin.trim()).maybeSingle()
      if (existingNin) {
        setError('This NIN is already registered. If you have already registered before, log in to your account instead.')
        setSubmitting(false)
        return
      }

      // Upload CV
      let cv_url = null
      if (cvFile) {
        const fileExt = cvFile.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('cvs').upload(fileName, cvFile)
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('cvs').getPublicUrl(fileName)
        cv_url = urlData.publicUrl
      }

      // Upload profile photo (required)
      let photo_url = null
      const photoExt  = photoFile.name.split('.').pop()
      const photoName = `seeker_${Date.now()}_${Math.random().toString(36).substring(2)}.${photoExt}`
      const { error: photoUploadError } = await supabase.storage.from('avatars').upload(photoName, photoFile, { upsert: true })
      if (photoUploadError) throw photoUploadError
      const { data: photoUrlData } = supabase.storage.from('avatars').getPublicUrl(photoName)
      photo_url = photoUrlData.publicUrl

      const payload = {
        full_name:           form.full_name.trim(),
        phone_number:        form.phone_number.trim(),
        whatsapp_number:     form.whatsapp_number.trim() || null,
        gender:              form.gender || null,
        age_range:           form.age_range || null,
        location:            form.location.trim() || null,
        ward:                form.ward.trim() || null,
        lga:                 form.lga || null,
        nin:                 form.nin.trim(),
        skills:              form.selectedSkills.length > 0 ? form.selectedSkills : null,
        education_level:     form.education_level || null,
        years_of_experience: form.years_of_experience ? parseInt(form.years_of_experience) : 0,
        previous_workplace:  form.previous_workplace.trim() || null,
        seeker_type:         seekerType,
        cv_url,
        photo_url,
        status: 'approved',
        ...(user ? { auth_user_id: user.id, email: user.email } : {}),
      }

      if (seekerType === 'student') {
        payload.institution         = form.institution.trim() || null
        payload.course_of_study     = form.course_of_study.trim() || null
        payload.academic_level      = form.academic_level || null
        payload.availability_period = form.availability_period.trim() || null
        payload.lga                 = form.preferred_lga || form.lga || null
      }

      // Check for existing profile if logged in
      if (user) {
        const { data: existing } = await supabase
          .from('job_seekers').select('id').eq('auth_user_id', user.id).single()
        if (existing) {
          if (refreshProfile) await refreshProfile()
          navigate('/profile')
          return
        }
      }

      const { error: insertError } = await supabase.from('job_seekers').insert(payload)
      if (insertError) throw insertError

      if (user) {
        if (refreshProfile) await refreshProfile()
        navigate('/profile')
      } else {
        setSuccess(true)
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#f0fdf4,#dcfce7,#bbf7d0)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:"'Outfit',sans-serif" }}>
        <style>{CSS}</style>
        <div style={{ background:'#fff', borderRadius:24, padding:'48px 36px', maxWidth:480, textAlign:'center', border:'1.5px solid #dcfce7', boxShadow:'0 8px 32px rgba(22,163,74,0.1)' }}>
          <div style={{ fontSize:52, marginBottom:16 }}>🎉</div>
          <h2 style={{ fontSize:22, fontWeight:900, color:'#14532d', margin:'0 0 12px' }}>Profile Created!</h2>
          <p style={{ fontSize:15, color:'#4b6358', lineHeight:1.7, margin:0 }}>
            Your profile is now live on {APP_NAME}. Employers across Oke-Ogun can find you when they search for your skills.
            To apply for jobs directly on the platform, create an account and log in.
          </p>
        </div>
      </div>
    )
  }

  const grouped = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = []
    acc[skill.category].push(skill)
    return acc
  }, {})
  const skilledCategories   = Object.entries(grouped).filter(([cat]) => cat !== 'General Labour')
  const unskilledCategories = Object.entries(grouped).filter(([cat]) => cat === 'General Labour')

  const twoCol = { display:'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap:'0 24px' }

  return (
    <div style={{ minHeight:'100vh', background:'#f0fdf4', padding:'40px 24px', fontFamily:"'Outfit',sans-serif" }}>
      <style>{CSS}</style>

      <div style={{ maxWidth: isDesktop ? 900 : 600, margin:'0 auto' }}>
        {/* Page heading */}
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:'clamp(22px,3vw,32px)', fontWeight:900, color:'#14532d', margin:'0 0 8px' }}>
            Register as a Job Seeker
          </h1>
          <p style={{ fontSize:15, color:'#4b6358', lineHeight:1.65, margin:0 }}>
            Create your profile on {APP_NAME} so local employers can find you. Fields marked * are required.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ background:'#fff', borderRadius:24, padding: isDesktop ? '36px 40px' : '28px 24px', border:'1.5px solid #dcfce7', boxShadow:'0 4px 20px rgba(22,163,74,0.07)' }}>

          {/* ── SEEKER TYPE ─────────────────────────────────────────────── */}
          <div style={{ marginBottom:28 }}>
            <FieldLabel required>Which best describes you?</FieldLabel>
            <p style={{ fontSize:13, color:'#9ca3af', margin:'0 0 14px' }}>Your answer determines what information we collect.</p>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              {SEEKER_TYPES.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSeekerTypeChange(opt.value)}
                  style={{
                    flex:'1', minWidth:160, padding:'16px 14px',
                    borderRadius:16, border:`2px solid ${seekerType === opt.value ? '#16a34a' : '#dcfce7'}`,
                    background: seekerType === opt.value ? '#dcfce7' : '#f0fdf4',
                    cursor:'pointer', textAlign:'left', display:'flex', flexDirection:'column', gap:5,
                    transition:'all 0.15s', fontFamily:"'Outfit',sans-serif",
                  }}
                >
                  <span style={{ fontSize:20 }}>{opt.emoji}</span>
                  <span style={{ fontSize:14, fontWeight:800, color: seekerType === opt.value ? '#14532d' : '#4b6358' }}>{opt.label}</span>
                  <span style={{ fontSize:12, color:'#9ca3af', lineHeight:1.4 }}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {seekerType && (
            <>
              {/* ── PROFILE PHOTO ──────────────────────────────────────── */}
              <SectionHeader>Profile Photo *</SectionHeader>
              <div style={{ marginBottom:24 }}>
                <p style={{ fontSize:13, color:'#9ca3af', margin:'0 0 12px' }}>
                  A clear photo helps employers recognise you. JPG, PNG or WebP, max 2MB.
                </p>
                <div style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
                  {/* Preview */}
                  <div style={{ width:80, height:80, borderRadius:'50%', border:'3px solid #dcfce7', overflow:'hidden', flexShrink:0, background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    ) : (
                      <span style={{ fontSize:32 }}>👤</span>
                    )}
                  </div>
                  <div>
                    <label className="oj-photo-upload-area" style={{ display:'inline-block', cursor:'pointer', padding:'12px 24px', borderRadius:50, border:'1.5px solid #bbf7d0', background:'#f0fdf4', fontSize:13, fontWeight:700, color:'#16a34a', fontFamily:"'Outfit',sans-serif" }}>
                      {photoFile ? '📷 Change Photo' : '📷 Upload Photo *'}
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} style={{ display:'none' }} />
                    </label>
                    {photoFile && <p style={{ fontSize:12, color:'#16a34a', marginTop:6, fontWeight:600 }}>✓ {photoFile.name}</p>}
                    {photoError && <p style={{ fontSize:12, color:'#dc2626', marginTop:6 }}>{photoError}</p>}
                  </div>
                </div>
              </div>

              {/* ── PERSONAL DETAILS ───────────────────────────────────── */}
              <SectionHeader>Personal Details</SectionHeader>
              <div style={twoCol}>
                <div style={{ marginBottom:20 }}>
                  <FieldLabel required>Full Name</FieldLabel>
                  <input className="oj-input" type="text" name="full_name" value={form.full_name} onChange={handleChange} placeholder="Enter your full name" />
                </div>
                <div style={{ marginBottom:20 }}>
                  <FieldLabel required>Phone Number</FieldLabel>
                  <input className="oj-input" type="tel" name="phone_number" value={form.phone_number} onChange={handleChange} placeholder="e.g. 08012345678" />
                </div>
                <div style={{ marginBottom:20 }}>
                  <FieldLabel>WhatsApp Number (if different)</FieldLabel>
                  <input className="oj-input" type="tel" name="whatsapp_number" value={form.whatsapp_number} onChange={handleChange} placeholder="e.g. 08012345678" />
                </div>
                <div style={{ marginBottom:20 }}>
                  <FieldLabel required>NIN (National Identification Number)</FieldLabel>
                  <input
                    className={`oj-input${form.nin && !isValidNin(form.nin) ? ' oj-input-error' : form.nin && isValidNin(form.nin) ? ' oj-input-valid' : ''}`}
                    type="text" name="nin" value={form.nin} onChange={handleChange}
                    placeholder="11-digit number" maxLength={11} inputMode="numeric"
                  />
                  {form.nin && !isValidNin(form.nin) && <p style={{ fontSize:12, color:'#dc2626', marginTop:4 }}>Must be exactly 11 digits, numbers only.</p>}
                  {form.nin && isValidNin(form.nin)  && <p style={{ fontSize:12, color:'#16a34a', marginTop:4, fontWeight:600 }}>✓ Valid format</p>}
                  <p style={{ fontSize:12, color:'#9ca3af', marginTop:5, lineHeight:1.5 }}>
                    Used to prevent duplicate registrations. Stored securely and not shared with employers.
                  </p>
                </div>
                <div style={{ marginBottom:20 }}>
                  <FieldLabel>Gender (optional)</FieldLabel>
                  <select className="oj-input" name="gender" value={form.gender} onChange={handleChange}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
                <div style={{ marginBottom:20 }}>
                  <FieldLabel>Age Range (optional)</FieldLabel>
                  <select className="oj-input" name="age_range" value={form.age_range} onChange={handleChange}>
                    <option value="">Select age range</option>
                    {AGE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom:20 }}>
                  <FieldLabel>Town / Village</FieldLabel>
                  <input className="oj-input" type="text" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Saki, Iseyin" />
                </div>
                <div style={{ marginBottom:20 }}>
                  <FieldLabel>Ward</FieldLabel>
                  <input className="oj-input" type="text" name="ward" value={form.ward} onChange={handleChange} placeholder="Enter your ward" />
                </div>
                <div style={{ marginBottom:20 }}>
                  <FieldLabel>Local Government Area</FieldLabel>
                  <select className="oj-input" name="lga" value={form.lga} onChange={handleChange}>
                    <option value="">Select LGA</option>
                    {LGAs.map(lga => <option key={lga} value={lga}>{lga}</option>)}
                  </select>
                </div>
              </div>

              {/* ── SKILLED FIELDS ─────────────────────────────────────── */}
              {seekerType === 'skilled' && (
                <>
                  <SectionHeader>Skills & Experience</SectionHeader>
                  <div style={twoCol}>
                    <div style={{ marginBottom:20 }}>
                      <FieldLabel>Education Level</FieldLabel>
                      <select className="oj-input" name="education_level" value={form.education_level} onChange={handleChange}>
                        <option value="">Select education level</option>
                        {EDUCATION_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                    </div>
                    <div style={{ marginBottom:20 }}>
                      <FieldLabel>Years of Experience</FieldLabel>
                      <input className="oj-input" type="number" name="years_of_experience" value={form.years_of_experience} onChange={handleChange} placeholder="e.g. 3" min="0" max="50" />
                    </div>
                    <div style={{ marginBottom:20 }}>
                      <FieldLabel>Previous Workplace (optional)</FieldLabel>
                      <input className="oj-input" type="text" name="previous_workplace" value={form.previous_workplace} onChange={handleChange} placeholder="e.g. Saki General Hospital" />
                    </div>
                  </div>
                  <div style={{ marginBottom:20 }}>
                    <FieldLabel>Your Skills — select all that apply</FieldLabel>
                    {skilledCategories.map(([cat, catSkills]) => (
                      <div key={cat} style={{ marginBottom:14 }}>
                        <p style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 8px' }}>{cat}</p>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                          {catSkills.map(skill => (
                            <button key={skill.id} type="button" onClick={() => handleSkillToggle(skill.id)}
                              className={`oj-skill-btn${form.selectedSkills.includes(skill.id) ? ' oj-skill-btn-active' : ''}`}>
                              {skill.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── UNSKILLED FIELDS ───────────────────────────────────── */}
              {seekerType === 'unskilled' && (
                <>
                  <SectionHeader>Background</SectionHeader>
                  <div style={twoCol}>
                    <div style={{ marginBottom:20 }}>
                      <FieldLabel>Education Level</FieldLabel>
                      <select className="oj-input" name="education_level" value={form.education_level} onChange={handleChange}>
                        <option value="">Select education level</option>
                        {EDUCATION_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                    </div>
                    <div style={{ marginBottom:20 }}>
                      <FieldLabel>Previous Workplace (optional)</FieldLabel>
                      <input className="oj-input" type="text" name="previous_workplace" value={form.previous_workplace} onChange={handleChange} placeholder="Leave blank if you have not worked before" />
                    </div>
                  </div>
                  <div style={{ marginBottom:20 }}>
                    <FieldLabel>Type of Work You Can Do — select all that apply</FieldLabel>
                    {unskilledCategories.map(([cat, catSkills]) => (
                      <div key={cat} style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        {catSkills.map(skill => (
                          <button key={skill.id} type="button" onClick={() => handleSkillToggle(skill.id)}
                            className={`oj-skill-btn${form.selectedSkills.includes(skill.id) ? ' oj-skill-btn-active' : ''}`}>
                            {skill.name}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── STUDENT FIELDS ─────────────────────────────────────── */}
              {seekerType === 'student' && (
                <>
                  <SectionHeader>Academic Details</SectionHeader>
                  <div style={twoCol}>
                    <div style={{ marginBottom:20 }}>
                      <FieldLabel>Institution Name</FieldLabel>
                      <input className="oj-input" type="text" name="institution" value={form.institution} onChange={handleChange} placeholder="e.g. The Polytechnic Saki" />
                    </div>
                    <div style={{ marginBottom:20 }}>
                      <FieldLabel>Course of Study</FieldLabel>
                      <input className="oj-input" type="text" name="course_of_study" value={form.course_of_study} onChange={handleChange} placeholder="e.g. Business Administration" />
                    </div>
                    <div style={{ marginBottom:20 }}>
                      <FieldLabel>Current Academic Level</FieldLabel>
                      <select className="oj-input" name="academic_level" value={form.academic_level} onChange={handleChange}>
                        <option value="">Select your level</option>
                        {ACADEMIC_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                    </div>
                    <div style={{ marginBottom:20 }}>
                      <FieldLabel>Preferred LGA for Placement</FieldLabel>
                      <select className="oj-input" name="preferred_lga" value={form.preferred_lga} onChange={handleChange}>
                        <option value="">Select preferred LGA</option>
                        {LGAs.map(lga => <option key={lga} value={lga}>{lga}</option>)}
                      </select>
                    </div>
                    <div style={{ marginBottom:20 }}>
                      <FieldLabel>Availability Period</FieldLabel>
                      <input className="oj-input" type="text" name="availability_period" value={form.availability_period} onChange={handleChange} placeholder="e.g. June – September 2025" />
                    </div>
                  </div>
                  <div style={{ marginBottom:20 }}>
                    <FieldLabel>Area of Interest — select all that apply</FieldLabel>
                    {skilledCategories.map(([cat, catSkills]) => (
                      <div key={cat} style={{ marginBottom:14 }}>
                        <p style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 8px' }}>{cat}</p>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                          {catSkills.map(skill => (
                            <button key={skill.id} type="button" onClick={() => handleSkillToggle(skill.id)}
                              className={`oj-skill-btn${form.selectedSkills.includes(skill.id) ? ' oj-skill-btn-active' : ''}`}>
                              {skill.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── CV UPLOAD ──────────────────────────────────────────── */}
              <SectionHeader>
                {seekerType === 'student' ? 'CV or Student ID (optional)' : 'CV Upload (optional)'}
              </SectionHeader>
              <div style={{ marginBottom:24 }}>
                <p style={{ fontSize:13, color:'#9ca3af', margin:'0 0 10px' }}>PDF or Word document, max 5MB.</p>
                <label style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:50, border:'1.5px solid #bbf7d0', background:'#f0fdf4', fontSize:13, fontWeight:700, color:'#16a34a', cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                  📎 {cvFile ? 'Change File' : 'Upload CV'}
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} style={{ display:'none' }} />
                </label>
                {cvFile && <p style={{ fontSize:12, color:'#16a34a', marginTop:6, fontWeight:600 }}>✓ {cvFile.name}</p>}
              </div>

              {/* ── CONSENT ────────────────────────────────────────────── */}
              <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:24, padding:'16px', background:'#f0fdf4', borderRadius:14, border:'1.5px solid #dcfce7' }}>
                <input
                  type="checkbox" name="consent" id="consent"
                  checked={form.consent} onChange={handleChange}
                  style={{ marginTop:2, flexShrink:0, accentColor:'#16a34a', width:16, height:16 }}
                />
                <label htmlFor="consent" style={{ fontSize:13, color:'#4b6358', lineHeight:1.6, cursor:'pointer' }}>
                  I agree to the {APP_NAME} Privacy Policy and understand that my information will be used to connect me with relevant employers and opportunities in the Oke-Ogun region.
                </label>
              </div>

              {error && (
                <div style={{ background:'#fee2e2', color:'#dc2626', fontSize:13, padding:'11px 14px', borderRadius:12, marginBottom:20, fontWeight:600 }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={submitting} className="oj-submit-btn">
                {submitting ? 'Submitting...' : 'Submit Registration'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
