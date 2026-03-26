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
  'Iseyin', 'Itesiwaju', 'Kajola', 'Iwajowa', 'Irepo'
]

const EDUCATION_LEVELS = [
  { value: 'no_formal_education', label: 'No Formal Education' },
  { value: 'primary', label: 'Primary School' },
  { value: 'secondary', label: 'Secondary School' },
  { value: 'ond', label: 'OND' },
  { value: 'hnd', label: 'HND' },
  { value: 'bsc', label: 'BSc / BA' },
  { value: 'postgraduate', label: 'Postgraduate' },
]

const ACADEMIC_LEVELS = [
  { value: 'nd1', label: 'ND 1 (Polytechnic)' },
  { value: 'nd2', label: 'ND 2 (Polytechnic)' },
  { value: 'hnd1', label: 'HND 1 (Polytechnic)' },
  { value: 'hnd2', label: 'HND 2 (Polytechnic)' },
  { value: '100l', label: '100 Level (University)' },
  { value: '200l', label: '200 Level (University)' },
  { value: '300l', label: '300 Level (University)' },
  { value: '400l', label: '400 Level (University)' },
  { value: '500l', label: '500 Level (University)' },
  { value: 'nce', label: 'NCE (College of Education)' },
]

const AGE_RANGES = ['18-25', '26-35', '36-45', '46-55', '55+']

const SEEKER_TYPES = [
  {
    value: 'skilled',
    label: '🛠 Skilled Worker',
    desc: 'You have a specific trade, skill, or professional background'
  },
  {
    value: 'unskilled',
    label: '💪 Unskilled Worker',
    desc: 'You are available for general or physical labour'
  },
  {
    value: 'student',
    label: '🎓 Student / IT / SIWES',
    desc: 'You are a student looking for industrial attachment or placement'
  },
]

function isValidNin(nin) {
  return /^\d{11}$/.test(nin.trim())
}

export default function JobSeekerRegister() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [skills, setSkills] = useState([])
  const [seekerType, setSeekerType] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    phone_number: '',
    whatsapp_number: '',
    gender: '',
    age_range: '',
    location: '',
    ward: '',
    lga: '',
    nin: '',
    selectedSkills: [],
    education_level: '',
    years_of_experience: '',
    previous_workplace: '',
    // Student fields
    institution: '',
    course_of_study: '',
    academic_level: '',
    preferred_lga: '',
    availability_period: '',
    consent: false,
  })
  const [cvFile, setCvFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const isDesktop = useIsDesktop()

  useEffect(() => {
    async function fetchSkills() {
      const { data } = await supabase
        .from('skills')
        .select('*')
        .order('category')
      if (data) setSkills(data)
    }
    fetchSkills()
  }, [])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  function handleSeekerTypeChange(type) {
    setSeekerType(type)
    setForm(prev => ({ ...prev, selectedSkills: [] }))
  }

  function handleSkillToggle(skillId) {
    setForm(prev => {
      const already = prev.selectedSkills.includes(skillId)
      return {
        ...prev,
        selectedSkills: already
          ? prev.selectedSkills.filter(id => id !== skillId)
          : [...prev.selectedSkills, skillId]
      }
    })
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    if (!allowed.includes(file.type)) {
      setError('Only PDF or Word documents are allowed.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB.')
      return
    }
    setError('')
    setCvFile(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!seekerType) {
      setError('Please select the type of worker you are.')
      return
    }
    if (!form.full_name || !form.phone_number) {
      setError('Full name and phone number are required.')
      return
    }
    if (!form.nin.trim()) {
      setError('Your NIN (National Identification Number) is required.')
      return
    }
    if (!isValidNin(form.nin)) {
      setError('NIN must be exactly 11 digits with no spaces or letters.')
      return
    }
    if (!form.consent) {
      setError('You need to agree to the privacy policy before submitting.')
      return
    }

    setSubmitting(true)
    try {
      const { allowed, error: captchaError } = await verifyRecaptcha('register')
      if (!allowed) {
        setError(captchaError || 'We could not verify your submission. Please try again.')
        setSubmitting(false)
        return
      }

      // Check NIN is not already registered
      const { data: existingNin } = await supabase
        .from('job_seekers')
        .select('id')
        .eq('nin', form.nin.trim())
        .maybeSingle()

      if (existingNin) {
        setError('This NIN is already registered. If you have already registered before, log in to your account instead.')
        setSubmitting(false)
        return
      }

      let cv_url = null
      if (cvFile) {
        const fileExt = cvFile.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('cvs')
          .upload(fileName, cvFile)
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('cvs').getPublicUrl(fileName)
        cv_url = urlData.publicUrl
      }

      const payload = {
        full_name: form.full_name.trim(),
        phone_number: form.phone_number.trim(),
        whatsapp_number: form.whatsapp_number.trim() || null,
        gender: form.gender || null,
        age_range: form.age_range || null,
        location: form.location.trim() || null,
        ward: form.ward.trim() || null,
        lga: form.lga || null,
        nin: form.nin.trim(),
        skills: form.selectedSkills.length > 0 ? form.selectedSkills : null,
        education_level: form.education_level || null,
        years_of_experience: form.years_of_experience ? parseInt(form.years_of_experience) : 0,
        previous_workplace: form.previous_workplace.trim() || null,
        seeker_type: seekerType,
        cv_url,
        status: 'approved',
        ...(user ? { auth_user_id: user.id, email: user.email } : {}),
      }

      if (seekerType === 'student') {
        payload.institution = form.institution.trim() || null
        payload.course_of_study = form.course_of_study.trim() || null
        payload.academic_level = form.academic_level || null
        payload.availability_period = form.availability_period.trim() || null
        payload.lga = form.preferred_lga || form.lga || null
      }

      // If logged in, check for existing profile to avoid duplicates
      if (user) {
        const { data: existing } = await supabase
          .from('job_seekers')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()
        if (existing) {
          if (refreshProfile) await refreshProfile()
          navigate('/profile')
          return
        }
      }

      const { error: insertError } = await supabase
        .from('job_seekers')
        .insert(payload)
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

  if (success) {
    return (
      <div style={styles.successWrap}>
        <div style={styles.successBox}>
          <h2 style={styles.successTitle}>Profile Created</h2>
          <p style={styles.successText}>
            Your profile is now live on {APP_NAME}. Employers across Oke-Ogun can
            find you when they search for your skills. To apply for jobs directly
            on the platform, create an account and log in.
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

  const skilledCategories = Object.entries(grouped).filter(
    ([category]) => category !== 'General Labour'
  )
  const unskilledCategories = Object.entries(grouped).filter(
    ([category]) => category === 'General Labour'
  )

  return (
    <div style={styles.page}>
      <div style={{ maxWidth: isDesktop ? '860px' : '600px', margin: '0 auto' }}>
        <h1 style={styles.title}>Register as a Job Seeker</h1>
        <p style={styles.subtitle}>
          Create your profile on {APP_NAME} so local employers can find you.
          Fields marked * are required.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>

          {/* SEEKER TYPE */}
          <div style={styles.field}>
            <label style={styles.label}>Which best describes you? *</label>
            <p style={styles.fieldHint}>Your answer determines what information we collect.</p>
            <div style={styles.seekerTypeRow}>
              {SEEKER_TYPES.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSeekerTypeChange(option.value)}
                  style={{
                    ...styles.seekerTypeBtn,
                    ...(seekerType === option.value ? styles.seekerTypeBtnActive : {})
                  }}
                >
                  <span style={styles.seekerTypeBtnLabel}>{option.label}</span>
                  <span style={styles.seekerTypeBtnDesc}>{option.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {seekerType && (
            <>
              {/* PERSONAL DETAILS */}
              <h3 style={styles.sectionHeader}>Personal Details</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr',
                gap: '0 24px',
              }}>
                <div style={styles.field}>
                  <label style={styles.label}>Full Name *</label>
                  <input style={styles.input} type="text" name="full_name" value={form.full_name} onChange={handleChange} placeholder="Enter your full name" />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Phone Number *</label>
                  <input style={styles.input} type="tel" name="phone_number" value={form.phone_number} onChange={handleChange} placeholder="e.g. 08012345678" />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>WhatsApp Number (if different)</label>
                  <input style={styles.input} type="tel" name="whatsapp_number" value={form.whatsapp_number} onChange={handleChange} placeholder="e.g. 08012345678" />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>
                    NIN (National Identification Number) *
                  </label>
                  <input
                    style={{
                      ...styles.input,
                      ...(form.nin && !isValidNin(form.nin) ? styles.inputError : {}),
                      ...(form.nin && isValidNin(form.nin) ? styles.inputValid : {}),
                    }}
                    type="text"
                    name="nin"
                    value={form.nin}
                    onChange={handleChange}
                    placeholder="11-digit number"
                    maxLength={11}
                    inputMode="numeric"
                  />
                  {form.nin && !isValidNin(form.nin) && (
                    <p style={styles.fieldError}>Must be exactly 11 digits, numbers only.</p>
                  )}
                  {form.nin && isValidNin(form.nin) && (
                    <p style={styles.fieldValid}>✓ Valid format</p>
                  )}
                  <p style={styles.fieldHint}>
                    Your NIN is used to prevent duplicate registrations. It is stored securely and not shared with employers.
                  </p>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Gender (optional)</label>
                  <select style={styles.input} name="gender" value={form.gender} onChange={handleChange}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Age Range (optional)</label>
                  <select style={styles.input} name="age_range" value={form.age_range} onChange={handleChange}>
                    <option value="">Select age range</option>
                    {AGE_RANGES.map(range => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Town / Village</label>
                  <input style={styles.input} type="text" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Saki, Iseyin" />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Ward</label>
                  <input style={styles.input} type="text" name="ward" value={form.ward} onChange={handleChange} placeholder="Enter your ward" />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Local Government Area</label>
                  <select style={styles.input} name="lga" value={form.lga} onChange={handleChange}>
                    <option value="">Select LGA</option>
                    {LGAs.map(lga => (
                      <option key={lga} value={lga}>{lga}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SKILLED FIELDS */}
              {seekerType === 'skilled' && (
                <>
                  <h3 style={styles.sectionHeader}>Skills & Experience</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr',
                    gap: '0 24px',
                  }}>
                    <div style={styles.field}>
                      <label style={styles.label}>Education Level</label>
                      <select style={styles.input} name="education_level" value={form.education_level} onChange={handleChange}>
                        <option value="">Select education level</option>
                        {EDUCATION_LEVELS.map(level => (
                          <option key={level.value} value={level.value}>{level.label}</option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.field}>
                      <label style={styles.label}>Years of Experience</label>
                      <input style={styles.input} type="number" name="years_of_experience" value={form.years_of_experience} onChange={handleChange} placeholder="e.g. 3" min="0" max="50" />
                    </div>

                    <div style={styles.field}>
                      <label style={styles.label}>Previous Workplace (optional)</label>
                      <input style={styles.input} type="text" name="previous_workplace" value={form.previous_workplace} onChange={handleChange} placeholder="e.g. Saki General Hospital, ABC Farm" />
                    </div>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Your Skills — select all that apply</label>
                    {skilledCategories.map(([category, categorySkills]) => (
                      <div key={category} style={styles.skillGroup}>
                        <p style={styles.skillCategory}>{category}</p>
                        <div style={styles.skillGrid}>
                          {categorySkills.map(skill => (
                            <button
                              key={skill.id}
                              type="button"
                              onClick={() => handleSkillToggle(skill.id)}
                              style={{
                                ...styles.skillBtn,
                                ...(form.selectedSkills.includes(skill.id) ? styles.skillBtnActive : {})
                              }}
                            >
                              {skill.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* UNSKILLED FIELDS */}
              {seekerType === 'unskilled' && (
                <>
                  <h3 style={styles.sectionHeader}>Background</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr',
                    gap: '0 24px',
                  }}>
                    <div style={styles.field}>
                      <label style={styles.label}>Education Level</label>
                      <select style={styles.input} name="education_level" value={form.education_level} onChange={handleChange}>
                        <option value="">Select education level</option>
                        {EDUCATION_LEVELS.map(level => (
                          <option key={level.value} value={level.value}>{level.label}</option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.field}>
                      <label style={styles.label}>Previous Workplace (optional)</label>
                      <input style={styles.input} type="text" name="previous_workplace" value={form.previous_workplace} onChange={handleChange} placeholder="Leave blank if you have not worked before" />
                    </div>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Type of Work You Can Do — select all that apply</label>
                    {unskilledCategories.map(([category, categorySkills]) => (
                      <div key={category} style={styles.skillGroup}>
                        <div style={styles.skillGrid}>
                          {categorySkills.map(skill => (
                            <button
                              key={skill.id}
                              type="button"
                              onClick={() => handleSkillToggle(skill.id)}
                              style={{
                                ...styles.skillBtn,
                                ...(form.selectedSkills.includes(skill.id) ? styles.skillBtnActive : {})
                              }}
                            >
                              {skill.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* STUDENT FIELDS */}
              {seekerType === 'student' && (
                <>
                  <h3 style={styles.sectionHeader}>Academic Details</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr',
                    gap: '0 24px',
                  }}>
                    <div style={styles.field}>
                      <label style={styles.label}>Institution Name</label>
                      <input style={styles.input} type="text" name="institution" value={form.institution} onChange={handleChange} placeholder="e.g. The Polytechnic Saki" />
                    </div>

                    <div style={styles.field}>
                      <label style={styles.label}>Course of Study</label>
                      <input style={styles.input} type="text" name="course_of_study" value={form.course_of_study} onChange={handleChange} placeholder="e.g. Business Administration" />
                    </div>

                    <div style={styles.field}>
                      <label style={styles.label}>Current Academic Level</label>
                      <select style={styles.input} name="academic_level" value={form.academic_level} onChange={handleChange}>
                        <option value="">Select your level</option>
                        {ACADEMIC_LEVELS.map(level => (
                          <option key={level.value} value={level.value}>{level.label}</option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.field}>
                      <label style={styles.label}>Preferred LGA for Placement</label>
                      <select style={styles.input} name="preferred_lga" value={form.preferred_lga} onChange={handleChange}>
                        <option value="">Select preferred LGA</option>
                        {LGAs.map(lga => (
                          <option key={lga} value={lga}>{lga}</option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.field}>
                      <label style={styles.label}>Availability Period</label>
                      <input style={styles.input} type="text" name="availability_period" value={form.availability_period} onChange={handleChange} placeholder="e.g. June – September 2025" />
                    </div>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Area of Interest — select all that apply</label>
                    {skilledCategories.map(([category, categorySkills]) => (
                      <div key={category} style={styles.skillGroup}>
                        <p style={styles.skillCategory}>{category}</p>
                        <div style={styles.skillGrid}>
                          {categorySkills.map(skill => (
                            <button
                              key={skill.id}
                              type="button"
                              onClick={() => handleSkillToggle(skill.id)}
                              style={{
                                ...styles.skillBtn,
                                ...(form.selectedSkills.includes(skill.id) ? styles.skillBtnActive : {})
                              }}
                            >
                              {skill.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* CV UPLOAD */}
              <div style={styles.field}>
                <label style={styles.label}>
                  {seekerType === 'student'
                    ? 'Upload your CV or Student ID (optional — PDF or Word, max 5MB)'
                    : 'Upload your CV (optional — PDF or Word, max 5MB)'}
                </label>
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} style={styles.input} />
                {cvFile && <p style={styles.fileName}>Selected: {cvFile.name}</p>}
              </div>

              {/* CONSENT */}
              <div style={styles.consentRow}>
                <input
                  type="checkbox"
                  name="consent"
                  id="consent"
                  checked={form.consent}
                  onChange={handleChange}
                  style={styles.checkbox}
                />
                <label htmlFor="consent" style={styles.consentLabel}>
                  I agree to the {APP_NAME} Privacy Policy and understand that my
                  information will be used to connect me with relevant employers and
                  opportunities in the Oke-Ogun region.
                </label>
              </div>

              {error && <p style={styles.error}>{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                style={{ ...styles.submitBtn, ...(submitting ? styles.submitBtnDisabled : {}) }}
              >
                {submitting ? 'Submitting...' : 'Submit Registration'}
              </button>
            </>
          )}

        </form>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f5f7f5', padding: '40px 24px' },
  title: { fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 'bold', color: '#1a6b3c', marginBottom: '8px' },
  subtitle: { fontSize: '14px', color: '#555', marginBottom: '24px', lineHeight: '1.6' },
  form: { backgroundColor: '#fff', borderRadius: '12px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  sectionHeader: { fontSize: '16px', fontWeight: '700', color: '#1a6b3c', marginBottom: '16px', marginTop: '24px', paddingBottom: '8px', borderBottom: '2px solid #e8f5ee' },
  field: { marginBottom: '20px' },
  fieldHint: { fontSize: '12px', color: '#888', marginTop: '5px', lineHeight: '1.5' },
  fieldError: { fontSize: '12px', color: '#e53e3e', marginTop: '4px' },
  fieldValid: { fontSize: '12px', color: '#1a6b3c', marginTop: '4px', fontWeight: '600' },
  label: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box', outline: 'none' },
  inputError: { borderColor: '#e53e3e' },
  inputValid: { borderColor: '#1a6b3c' },
  seekerTypeRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  seekerTypeBtn: { flex: '1', minWidth: '160px', padding: '16px', borderRadius: '10px', border: '2px solid #ddd', backgroundColor: '#fafafa', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px' },
  seekerTypeBtnActive: { borderColor: '#1a6b3c', backgroundColor: '#e8f5ee' },
  seekerTypeBtnLabel: { fontSize: '14px', fontWeight: '700', color: '#222' },
  seekerTypeBtnDesc: { fontSize: '12px', color: '#666', lineHeight: '1.4' },
  skillGroup: { marginBottom: '12px' },
  skillCategory: { fontSize: '12px', fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: '6px' },
  skillGrid: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  skillBtn: { padding: '6px 12px', fontSize: '13px', borderRadius: '20px', border: '1px solid #ddd', backgroundColor: '#f9f9f9', cursor: 'pointer', color: '#333' },
  skillBtnActive: { backgroundColor: '#1a6b3c', color: '#fff', borderColor: '#1a6b3c' },
  fileName: { fontSize: '12px', color: '#1a6b3c', marginTop: '4px' },
  consentRow: { display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '20px' },
  checkbox: { marginTop: '2px', flexShrink: 0 },
  consentLabel: { fontSize: '13px', color: '#555', lineHeight: '1.5' },
  error: { color: '#e53e3e', fontSize: '13px', marginBottom: '12px' },
  submitBtn: { width: '100%', padding: '14px', backgroundColor: '#1a6b3c', color: '#fff', fontSize: '16px', fontWeight: '600', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  submitBtnDisabled: { backgroundColor: '#aaa', cursor: 'not-allowed' },
  successWrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f7f5', padding: '24px' },
  successBox: { backgroundColor: '#fff', borderRadius: '12px', padding: '40px 32px', maxWidth: '480px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  successTitle: { fontSize: '22px', fontWeight: 'bold', color: '#1a6b3c', marginBottom: '12px' },
  successText: { fontSize: '15px', color: '#555', lineHeight: '1.6' },
}
