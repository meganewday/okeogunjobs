import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { APP_NAME } from '../config/constants'

const LGAs = [
  'Saki West', 'Saki East', 'Atisbo', 'Oorelope', 'Olorunsogo',
  'Iseyin', 'Itesiwaju', 'Kajola', 'Iwajowa'
]

const JOB_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
]

export default function PostJob() {
  const [skills, setSkills] = useState([])
  const [form, setForm] = useState({
    organization_name: '',
    contact_person: '',
    phone_number: '',
    email: '',
    job_title: '',
    job_description: '',
    job_type: '',
    location: '',
    lga: '',
    selectedSkills: [],
    application_method: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

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
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
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

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.organization_name || !form.contact_person || !form.phone_number) {
      setError('Organisation name, contact person, and phone number are required.')
      return
    }
    if (!form.job_title || !form.job_description) {
      setError('Job title and job description are required.')
      return
    }
    if (!form.job_type) {
      setError('Please select a job type.')
      return
    }
    if (!form.application_method) {
      setError('Please select an application method.')
      return
    }

    setSubmitting(true)

    try {
      // First insert employer
      const { data: employerData, error: employerError } = await supabase
        .from('employers')
        .insert({
          organization_name: form.organization_name.trim(),
          contact_person: form.contact_person.trim(),
          phone_number: form.phone_number.trim(),
          email: form.email.trim() || null,
          status: 'pending',
        })
        .select()
        .single()

      if (employerError) throw employerError

      // Then insert job listing linked to employer
      const { error: jobError } = await supabase
        .from('job_listings')
        .insert({
          employer_id: employerData.id,
          job_title: form.job_title.trim(),
          job_description: form.job_description.trim(),
          job_type: form.job_type,
          location: form.location.trim() || null,
          lga: form.lga || null,
          skills_required: form.selectedSkills.length > 0 ? form.selectedSkills : null,
          application_method: form.application_method,
          status: 'pending',
        })

      if (jobError) throw jobError

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
          <h2 style={styles.successTitle}>Job Submitted!</h2>
          <p style={styles.successText}>
            Thank you for posting on {APP_NAME}. Your job listing has been submitted
            for review and will be published once approved by our team.
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
      <div style={styles.container}>
        <h1 style={styles.title}>Post a Job</h1>
        <p style={styles.subtitle}>
          Fill in the details below to list a job on {APP_NAME}.
          All listings are reviewed before publishing. Fields marked * are required.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>

          <h3 style={styles.sectionHeader}>Employer Information</h3>

          <div style={styles.field}>
            <label style={styles.label}>Organisation / Employer Name *</label>
            <input
              style={styles.input}
              type="text"
              name="organization_name"
              value={form.organization_name}
              onChange={handleChange}
              placeholder="e.g. Saki Farms Ltd"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Contact Person *</label>
            <input
              style={styles.input}
              type="text"
              name="contact_person"
              value={form.contact_person}
              onChange={handleChange}
              placeholder="Full name of contact person"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Phone Number *</label>
            <input
              style={styles.input}
              type="tel"
              name="phone_number"
              value={form.phone_number}
              onChange={handleChange}
              placeholder="e.g. 08012345678"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email Address (optional)</label>
            <input
              style={styles.input}
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="e.g. contact@company.com"
            />
          </div>

          <h3 style={styles.sectionHeader}>Job Details</h3>

          <div style={styles.field}>
            <label style={styles.label}>Job Title *</label>
            <input
              style={styles.input}
              type="text"
              name="job_title"
              value={form.job_title}
              onChange={handleChange}
              placeholder="e.g. Farm Supervisor"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Job Description *</label>
            <textarea
              style={{ ...styles.input, height: '120px', resize: 'vertical' }}
              name="job_description"
              value={form.job_description}
              onChange={handleChange}
              placeholder="Describe the role, responsibilities, and any requirements..."
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Job Type *</label>
            <select style={styles.input} name="job_type" value={form.job_type} onChange={handleChange}>
              <option value="">Select job type</option>
              {JOB_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Job Location</label>
            <input
              style={styles.input}
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. Saki, Iseyin"
            />
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
            <label style={styles.label}>Skills Required (select all that apply)</label>
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

          <div style={styles.field}>
            <label style={styles.label}>Application Method *</label>
            <select style={styles.input} name="application_method" value={form.application_method} onChange={handleChange}>
              <option value="">Select application method</option>
              <option value="phone">Phone Call</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            style={{ ...styles.submitBtn, ...(submitting ? styles.submitBtnDisabled : {}) }}
          >
            {submitting ? 'Submitting...' : 'Submit Job Listing'}
          </button>

        </form>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f5f7f5', padding: '24px 16px' },
  container: { maxWidth: '600px', margin: '0 auto' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#1a6b3c', marginBottom: '8px' },
  subtitle: { fontSize: '14px', color: '#555', marginBottom: '24px' },
  form: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  sectionHeader: { fontSize: '16px', fontWeight: '700', color: '#1a6b3c', marginBottom: '16px', marginTop: '8px', paddingBottom: '8px', borderBottom: '2px solid #e8f5ee' },
  field: { marginBottom: '20px' },
  label: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box', outline: 'none' },
  skillGroup: { marginBottom: '12px' },
  skillCategory: { fontSize: '12px', fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: '6px' },
  skillGrid: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  skillBtn: { padding: '6px 12px', fontSize: '13px', borderRadius: '20px', border: '1px solid #ddd', backgroundColor: '#f9f9f9', cursor: 'pointer', color: '#333' },
  skillBtnActive: { backgroundColor: '#1a6b3c', color: '#fff', borderColor: '#1a6b3c' },
  error: { color: '#e53e3e', fontSize: '13px', marginBottom: '12px' },
  submitBtn: { width: '100%', padding: '14px', backgroundColor: '#1a6b3c', color: '#fff', fontSize: '16px', fontWeight: '600', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  submitBtnDisabled: { backgroundColor: '#aaa', cursor: 'not-allowed' },
  successWrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f7f5', padding: '24px' },
  successBox: { backgroundColor: '#fff', borderRadius: '12px', padding: '40px 32px', maxWidth: '480px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  successTitle: { fontSize: '22px', fontWeight: 'bold', color: '#1a6b3c', marginBottom: '12px' },
  successText: { fontSize: '15px', color: '#555', lineHeight: '1.6' },
}