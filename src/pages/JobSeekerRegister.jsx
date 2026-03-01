import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { APP_NAME } from '../config/constants'

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
  'Iseyin', 'Itesiwaju', 'Kajola', 'Iwajowa'
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

const AGE_RANGES = ['18-25', '26-35', '36-45', '46-55', '55+']

export default function JobSeekerRegister() {
  const [skills, setSkills] = useState([])
  const [form, setForm] = useState({
    full_name: '',
    phone_number: '',
    whatsapp_number: '',
    gender: '',
    age_range: '',
    location: '',
    ward: '',
    lga: '',
    selectedSkills: [],
    education_level: '',
    years_of_experience: '',
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
    const allowed = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
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
    if (!form.full_name || !form.phone_number) {
      setError('Full name and phone number are required.')
      return
    }
    if (!form.consent) {
      setError('You must agree to the privacy policy to register.')
      return
    }
    setSubmitting(true)
    try {
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
      const { error: insertError } = await supabase
        .from('job_seekers')
        .insert({
          full_name: form.full_name.trim(),
          phone_number: form.phone_number.trim(),
          whatsapp_number: form.whatsapp_number.trim() || null,
          gender: form.gender || null,
          age_range: form.age_range || null,
          location: form.location.trim() || null,
          ward: form.ward.trim() || null,
          lga: form.lga || null,
          skills: form.selectedSkills.length > 0 ? form.selectedSkills : null,
          education_level: form.education_level || null,
          years_of_experience: form.years_of_experience ? parseInt(form.years_of_experience) : 0,
          cv_url,
          status: 'pending',
        })
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
      <div style={styles.successWrap}>
        <div style={styles.successBox}>
          <h2 style={styles.successTitle}>Registration Submitted!</h2>
          <p style={styles.successText}>
            Thank you for registering on {APP_NAME}. Your profile has been submitted
            for review. We will notify you once it has been approved.
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

  return (
    <div style={styles.page}>
      <div style={{
        maxWidth: isDesktop ? '860px' : '600px',
        margin: '0 auto',
      }}>
        <h1 style={styles.title}>Register as Job Seeker</h1>
        <p style={styles.subtitle}>
          Fill in your details below to join the {APP_NAME} talent pool.
          Fields marked * are required.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>

          {/* Two column layout on desktop */}
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

          </div>

          {/* Skills - full width */}
          <div style={styles.field}>
            <label style={styles.label}>Skills — select all that apply (select General Labour if no specific skill)</label>
            {Object.entries(grouped).map(([category, categorySkills]) => (
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

          {/* CV Upload - full width */}
          <div style={styles.field}>
            <label style={styles.label}>Upload CV (optional — PDF or Word, max 5MB)</label>
            <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} style={styles.input} />
            {cvFile && <p style={styles.fileName}>Selected: {cvFile.name}</p>}
          </div>

          {/* Consent */}
          <div style={styles.consentRow}>
            <input type="checkbox" name="consent" id="consent" checked={form.consent} onChange={handleChange} style={styles.checkbox} />
            <label htmlFor="consent" style={styles.consentLabel}>
              I agree to the {APP_NAME} Privacy Policy and consent to my data being used
              to connect me with employment opportunities.
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

        </form>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f5f7f5', padding: '40px 24px' },
  title: { fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 'bold', color: '#1a6b3c', marginBottom: '8px' },
  subtitle: { fontSize: '14px', color: '#555', marginBottom: '24px' },
  form: { backgroundColor: '#fff', borderRadius: '12px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  field: { marginBottom: '20px' },
  label: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box', outline: 'none' },
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