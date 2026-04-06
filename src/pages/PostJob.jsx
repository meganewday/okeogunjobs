import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { APP_NAME } from '../config/constants'
import { verifyRecaptcha } from '../lib/recaptcha'
import { useEmployerAuth } from '../contexts/EmployerAuthContext'

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

const JOB_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract',  label: 'Contract' },
]

const LABOUR_OPTIONS = [
  { value: 'skilled',    emoji: '🛠', label: 'Skilled',              desc: 'Requires a specific skill or trade' },
  { value: 'unskilled',  emoji: '💪', label: 'Unskilled',            desc: 'General or physical labour, no specific skill needed' },
  { value: 'internship', emoji: '🎓', label: 'Internship / IT / SIWES', desc: 'Student industrial attachment or placement' },
]

const APPLICATION_METHODS = [
  { value: 'phone', label: '🖥 Apply on Platform', desc: 'Seekers apply directly through OkeOgunJobs' },
  { value: 'whatsapp', label: '💬 Apply via WhatsApp', desc: 'Seekers contact you directly on WhatsApp' },
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
  .oj-skill-btn {
    padding: 7px 14px; font-size: 13px; border-radius: 50px;
    border: 1.5px solid #dcfce7; background: #f0fdf4;
    cursor: pointer; color: #166534; font-weight: 500;
    font-family: 'Outfit', sans-serif; transition: all 0.15s;
  }
  .oj-skill-btn:hover { border-color: #16a34a; background: #dcfce7; }
  .oj-skill-btn-active { background: #16a34a !important; color: #fff !important; border-color: #16a34a !important; font-weight: 700 !important; }
  .oj-other-btn {
    padding: 7px 14px; font-size: 13px; border-radius: 50px;
    border: 1.5px dashed #bbf7d0; background: transparent;
    cursor: pointer; color: #16a34a; font-weight: 600;
    font-family: 'Outfit', sans-serif; transition: all 0.15s;
  }
  .oj-other-btn:hover { background: #f0fdf4; border-color: #16a34a; }
  .oj-other-btn-active { background: #f0fdf4 !important; border-color: #16a34a !important; border-style: solid !important; }
  .oj-submit-btn {
    width: 100%; padding: 14px; background: #16a34a; color: #fff;
    font-size: 15px; font-weight: 700; font-family: 'Outfit', sans-serif;
    border: none; border-radius: 50px; cursor: pointer;
    box-shadow: 0 2px 8px rgba(22,163,74,0.18);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .oj-submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 3px 12px rgba(22,163,74,0.22); }
  .oj-submit-btn:disabled { background: #9ca3af; cursor: not-allowed; box-shadow: none; }
`

function SectionHeader({ children }) {
  return (
    <h3 style={{ fontSize:15, fontWeight:800, color:'#16a34a', margin:'28px 0 16px', paddingBottom:10, borderBottom:'2px solid #dcfce7' }}>
      {children}
    </h3>
  )
}

function FieldLabel({ children, required }) {
  return (
    <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#166634', marginBottom:7 }}>
      {children}{required && ' *'}
    </label>
  )
}

// ─── Skills section with "Other" custom input ─────────────────────────────────
function SkillsSection({ categories, selectedSkills, onToggle, customSkills, onCustomChange, label }) {
  const [openOther, setOpenOther] = useState({}) // category → bool

  function toggleOther(cat) {
    setOpenOther(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  return (
    <div style={{ marginBottom:20 }}>
      <FieldLabel>{label}</FieldLabel>
      {categories.map(([cat, catSkills]) => (
        <div key={cat} style={{ marginBottom:16 }}>
          {cat !== 'General Labour' && (
            <p style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 8px' }}>{cat}</p>
          )}
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {catSkills.map(skill => (
              <button key={skill.id} type="button" onClick={() => onToggle(skill.id)}
                className={`oj-skill-btn${selectedSkills.includes(skill.id) ? ' oj-skill-btn-active' : ''}`}>
                {skill.name}
              </button>
            ))}
            {/* Other button */}
            <button type="button" onClick={() => toggleOther(cat)}
              className={`oj-other-btn${openOther[cat] ? ' oj-other-btn-active' : ''}`}>
              + Other
            </button>
          </div>
          {/* Custom skill input */}
          {openOther[cat] && (
            <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:10 }}>
              <input
                className="oj-input"
                style={{ maxWidth:320 }}
                type="text"
                placeholder={`Enter custom skill for ${cat === 'General Labour' ? 'this category' : cat}…`}
                value={customSkills[cat] || ''}
                onChange={e => onCustomChange(cat, e.target.value)}
              />
              {customSkills[cat] && (
                <span style={{ fontSize:12, color:'#16a34a', fontWeight:600 }}>✓ Will be saved</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PostJob() {
  const { employer, employerProfile, employerLoading, refreshEmployerProfile } = useEmployerAuth()
  const navigate  = useNavigate()
  const isDesktop = useIsDesktop()

  const [skills, setSkills]           = useState([])
  const [labourType, setLabourType]   = useState('')
  const [customSkills, setCustomSkills] = useState({}) // category → custom text
  const [form, setForm]               = useState({
    job_title: '', job_description: '', job_type: '',
    location: '', lga: '', selectedSkills: [],
    application_method: '',
    department_unit: '', duration: '', stipend_available: '', siwes_accredited: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess]       = useState(false)
  const [error, setError]           = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!employerLoading && !employer) navigate('/employer/login?next=post-job')
  }, [employer, employerLoading, navigate])

  useEffect(() => {
    async function fetchSkills() {
      const { data } = await supabase.from('skills').select('*').order('category')
      if (data) setSkills(data)
    }
    fetchSkills()
  }, [])

  useEffect(() => {
    if (employerProfile?.lga) {
      setForm(prev => ({ ...prev, lga: prev.lga || employerProfile.lga }))
    }
  }, [employerProfile])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleSkillToggle(skillId) {
    setForm(prev => {
      const already = prev.selectedSkills.includes(skillId)
      return { ...prev, selectedSkills: already ? prev.selectedSkills.filter(id => id !== skillId) : [...prev.selectedSkills, skillId] }
    })
  }

  function handleCustomSkillChange(cat, value) {
    setCustomSkills(prev => ({ ...prev, [cat]: value }))
  }

  function handleLabourTypeChange(type) {
    setLabourType(type)
    setForm(prev => ({ ...prev, selectedSkills: [], application_method: '' }))
    setCustomSkills({})
  }

  async function handleRefreshProfile() {
    setRefreshing(true)
    setError('')
    try {
      await refreshEmployerProfile()
    } catch (err) {
      setError('Failed to refresh profile. Please try reloading the page.')
    } finally {
      setRefreshing(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!labourType) { setError('Please select whether this is a skilled, unskilled, or internship position.'); return }
    if (!form.job_title || !form.job_description) { setError('Job title and job description are required.'); return }
    if (labourType !== 'internship' && !form.job_type) { setError('Please select a job type.'); return }
    if (!form.application_method && labourType !== 'internship') { setError('Please select an application method.'); return }

    // Check if employer account is approved
    if (employerProfile?.status !== 'approved') {
      setError('Your account is pending approval. You cannot post jobs until your account is approved by our team. This usually takes no more than 24 hours.')
      return
    }

    setSubmitting(true)
    try {
      const { allowed, error: captchaError } = await verifyRecaptcha('post_job')
      if (!allowed) {
        setError(captchaError || 'We could not verify your submission. Please try again.')
        setSubmitting(false)
        return
      }

      const employerId = employerProfile?.id
      if (!employerId) {
        setError('Your employer profile could not be found. Please contact support.')
        setSubmitting(false)
        return
      }

      // Build custom_skills string from all filled-in custom entries
      const customSkillsString = Object.values(customSkills)
        .map(v => v.trim()).filter(Boolean).join(', ') || null

      const jobPayload = {
        employer_id:        employerId,
        job_title:          form.job_title.trim(),
        job_description:    form.job_description.trim(),
        job_type:           labourType === 'internship' ? 'internship' : form.job_type,
        labour_type:        labourType,
        location:           form.location.trim() || null,
        lga:                form.lga || null,
        skills_required:    form.selectedSkills.length > 0 ? form.selectedSkills : null,
        custom_skills:      customSkillsString,
        application_method: form.application_method || 'phone',
        status:             'pending',
      }

      if (labourType === 'internship') {
        jobPayload.job_description =
          `${form.job_description.trim()}\n\nDepartment/Unit: ${form.department_unit || 'Not specified'}\nDuration: ${form.duration || 'Not specified'}\nStipend: ${form.stipend_available || 'Not specified'}\nSIWES Accredited: ${form.siwes_accredited || 'Not specified'}`
      }

      const { error: jobError } = await supabase.from('job_listings').insert(jobPayload)
      if (jobError) throw jobError

      setSuccess(true)
    } catch (err) {
      console.error('Job posting error:', err)
      let errorMsg = err?.message || err?.toString() || 'Something went wrong'
      
      // Provide more helpful error messages
      if (errorMsg.includes('permission') || errorMsg.includes('policy') || errorMsg.includes('RLS')) {
        errorMsg = 'Permission denied. Your account may still be pending approval. Try refreshing the page.'
      } else if (errorMsg.includes('duplicate') || errorMsg.includes('unique')) {
        errorMsg = 'A similar job listing already exists. Please check your job postings.'
      }
      
      setError(`Failed to post job: ${errorMsg}`)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (employerLoading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0fdf4', fontFamily:"'Outfit',sans-serif" }}>
        <style>{CSS}</style>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:48, height:48, borderRadius:'50%', border:'4px solid #dcfce7', borderTopColor:'#16a34a', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ color:'#4b6358', fontSize:15 }}>Loading...</p>
        </div>
      </div>
    )
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#f0fdf4,#dcfce7,#bbf7d0)', padding:24, fontFamily:"'Outfit',sans-serif" }}>
        <style>{CSS}</style>
        <div style={{ background:'#fff', borderRadius:24, padding:'48px 36px', maxWidth:480, textAlign:'center', border:'1.5px solid #dcfce7', boxShadow:'0 8px 32px rgba(22,163,74,0.1)' }}>
          <div style={{ fontSize:52, marginBottom:16 }}>✅</div>
          <h2 style={{ fontSize:22, fontWeight:900, color:'#14532d', margin:'0 0 12px' }}>Job Submitted</h2>
          <p style={{ fontSize:15, color:'#4b6358', lineHeight:1.7, margin:'0 0 28px' }}>
            Your listing has been received and is pending review. Once approved, it will appear on the jobs page. This usually takes no more than 24 hours.
          </p>
          <Link to="/employer/dashboard" style={{ display:'inline-block', padding:'13px 32px', background:'#16a34a', color:'#fff', borderRadius:50, fontWeight:700, fontSize:15, textDecoration:'none', fontFamily:"'Outfit',sans-serif", boxShadow:'0 4px 12px rgba(22,163,74,0.28)' }}>
            Go to Dashboard
          </Link>
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
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:'clamp(22px,3vw,32px)', fontWeight:900, color:'#14532d', margin:'0 0 8px' }}>Post a Job</h1>
          <p style={{ fontSize:15, color:'#4b6358', lineHeight:1.65, margin:0 }}>
            Fill in the job details below. Your organisation information is already attached to your account. Fields marked * are required.
          </p>
        </div>

        {/* Employer profile card */}
        {employerProfile && (
          <div style={{ background:'#fff', border:'1.5px solid #dcfce7', borderRadius:16, padding:'14px 18px', marginBottom:24, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, flex:1 }}>
              {employerProfile.logo_url ? (
                <img src={employerProfile.logo_url} alt="logo" style={{ width:44, height:44, borderRadius:10, objectFit:'contain', border:'1.5px solid #dcfce7' }} />
              ) : (
                <div style={{ width:44, height:44, borderRadius:10, background:'linear-gradient(135deg,#16a34a,#22c55e)', color:'#fff', fontSize:18, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {employerProfile.organization_name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div>
                <p style={{ fontSize:14, fontWeight:800, color:'#14532d', margin:0 }}>
                  {employerProfile.organization_name}
                  {employerProfile.status === 'approved' && <span style={{ fontSize:12, marginLeft:8, color:'#16a34a', fontWeight:700 }}>✓ Approved</span>}
                  {employerProfile.status === 'pending' && <span style={{ fontSize:12, marginLeft:8, color:'#f59e0b', fontWeight:700 }}>⏳ Pending Review</span>}
                </p>
                <p style={{ fontSize:12, color:'#9ca3af', margin:'2px 0 0' }}>
                  {[employerProfile.contact_person, employerProfile.lga, employerProfile.industry].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <button
                type="button"
                onClick={handleRefreshProfile}
                disabled={refreshing}
                style={{ padding:'8px 14px', fontSize:12, fontWeight:700, borderRadius:8, border:'1.5px solid #dcfce7', background:'#f0fdf4', color:'#16a34a', cursor: refreshing ? 'not-allowed' : 'pointer', opacity: refreshing ? 0.6 : 1, transition:'all 0.15s' }}
              >
                {refreshing ? 'Refreshing...' : '🔄 Refresh'}
              </button>
              <Link to="/employer/dashboard" style={{ padding:'8px 14px', fontSize:12, fontWeight:700, borderRadius:8, border:'1.5px solid #dcfce7', background:'#f0fdf4', color:'#16a34a', textDecoration:'none', display:'inline-block' }}>Edit</Link>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ background:'#fff', borderRadius:24, padding: isDesktop ? '36px 40px' : '28px 24px', border:'1.5px solid #dcfce7', boxShadow:'0 4px 20px rgba(22,163,74,0.07)' }}>

          {/* ── LABOUR TYPE ─────────────────────────────────────────────── */}
          <div style={{ marginBottom:28 }}>
            <FieldLabel required>What type of position is this?</FieldLabel>
            <p style={{ fontSize:13, color:'#9ca3af', margin:'0 0 14px' }}>This determines what information we collect about the role.</p>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              {LABOUR_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => handleLabourTypeChange(opt.value)}
                  style={{
                    flex:'1', minWidth:160, padding:'16px 14px', borderRadius:16,
                    border:`2px solid ${labourType === opt.value ? '#16a34a' : '#dcfce7'}`,
                    background: labourType === opt.value ? '#dcfce7' : '#f0fdf4',
                    cursor:'pointer', textAlign:'left', display:'flex', flexDirection:'column', gap:5,
                    transition:'all 0.15s', fontFamily:"'Outfit',sans-serif",
                  }}>
                  <span style={{ fontSize:20 }}>{opt.emoji}</span>
                  <span style={{ fontSize:14, fontWeight:800, color: labourType === opt.value ? '#14532d' : '#4b6358' }}>{opt.label}</span>
                  <span style={{ fontSize:12, color:'#9ca3af', lineHeight:1.4 }}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {labourType && (
            <>
              {/* ── JOB DETAILS ───────────────────────────────────────── */}
              <SectionHeader>Job Details</SectionHeader>
              <div style={twoCol}>
                <div style={{ marginBottom:20 }}>
                  <FieldLabel required>Job Title</FieldLabel>
                  <input className="oj-input" type="text" name="job_title" value={form.job_title} onChange={handleChange}
                    placeholder={
                      labourType === 'skilled'    ? 'e.g. Electrician, Welder, Farm Supervisor' :
                      labourType === 'unskilled'  ? 'e.g. Farm Hand, Security Watchman' :
                      'e.g. IT Student Placement — Accounting Department'
                    }
                  />
                </div>

                {labourType !== 'internship' && (
                  <div style={{ marginBottom:20 }}>
                    <FieldLabel required>Job Type</FieldLabel>
                    <select className="oj-input" name="job_type" value={form.job_type} onChange={handleChange}>
                      <option value="">Select job type</option>
                      {JOB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                )}

                <div style={{ marginBottom:20 }}>
                  <FieldLabel>Job Location</FieldLabel>
                  <input className="oj-input" type="text" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Saki, Iseyin" />
                </div>

                <div style={{ marginBottom:20 }}>
                  <FieldLabel>Local Government Area</FieldLabel>
                  <select className="oj-input" name="lga" value={form.lga} onChange={handleChange}>
                    <option value="">Select LGA</option>
                    {LGAs.map(lga => <option key={lga} value={lga}>{lga}</option>)}
                  </select>
                </div>
              </div>

              {/* ── INTERNSHIP DETAILS ────────────────────────────────── */}
              {labourType === 'internship' && (
                <>
                  <SectionHeader>Internship / SIWES Details</SectionHeader>
                  <div style={twoCol}>
                    <div style={{ marginBottom:20 }}>
                      <FieldLabel>Department / Unit</FieldLabel>
                      <input className="oj-input" type="text" name="department_unit" value={form.department_unit} onChange={handleChange} placeholder="e.g. Accounts, ICT, Admin" />
                    </div>
                    <div style={{ marginBottom:20 }}>
                      <FieldLabel>Duration</FieldLabel>
                      <input className="oj-input" type="text" name="duration" value={form.duration} onChange={handleChange} placeholder="e.g. 3 months, 6 months" />
                    </div>
                    <div style={{ marginBottom:20 }}>
                      <FieldLabel>Stipend Available?</FieldLabel>
                      <select className="oj-input" name="stipend_available" value={form.stipend_available} onChange={handleChange}>
                        <option value="">Select option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        <option value="Negotiable">Negotiable</option>
                      </select>
                    </div>
                    <div style={{ marginBottom:20 }}>
                      <FieldLabel>SIWES Accredited?</FieldLabel>
                      <select className="oj-input" name="siwes_accredited" value={form.siwes_accredited} onChange={handleChange}>
                        <option value="">Select option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        <option value="Not Sure">Not Sure</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* ── JOB DESCRIPTION ──────────────────────────────────── */}
              <div style={{ marginBottom:20 }}>
                <FieldLabel required>Job Description</FieldLabel>
                <textarea
                  className="oj-input"
                  style={{ height:120, resize:'vertical' }}
                  name="job_description"
                  value={form.job_description}
                  onChange={handleChange}
                  placeholder={
                    labourType === 'internship'
                      ? 'Describe what the student will be doing, any requirements, and what they will learn...'
                      : 'Describe the role, key responsibilities, and any requirements...'
                  }
                />
              </div>

              {/* ── APPLICATION METHOD ───────────────────────────────── */}
              {labourType !== 'internship' && (
                <div style={{ marginBottom:24 }}>
                  <FieldLabel required>How should seekers apply?</FieldLabel>
                  <p style={{ fontSize:13, color:'#9ca3af', margin:'0 0 14px' }}>
                    Platform applications are tracked in your dashboard. WhatsApp connects seekers directly to you.
                  </p>
                  <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                    {APPLICATION_METHODS.map(opt => (
                      <button key={opt.value} type="button"
                        onClick={() => setForm(prev => ({ ...prev, application_method: opt.value }))}
                        style={{
                          flex:'1', minWidth:140, padding:'14px 12px', borderRadius:14,
                          border:`2px solid ${form.application_method === opt.value ? '#16a34a' : '#dcfce7'}`,
                          background: form.application_method === opt.value ? '#dcfce7' : '#f0fdf4',
                          cursor:'pointer', textAlign:'left', display:'flex', flexDirection:'column', gap:4,
                          transition:'all 0.15s', fontFamily:"'Outfit',sans-serif",
                        }}>
                        <span style={{ fontSize:13, fontWeight:800, color: form.application_method === opt.value ? '#14532d' : '#4b6358' }}>{opt.label}</span>
                        <span style={{ fontSize:12, color:'#9ca3af', lineHeight:1.4 }}>{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── SKILLS ───────────────────────────────────────────── */}
              {labourType === 'skilled' && (
                <SkillsSection
                  categories={skilledCategories}
                  selectedSkills={form.selectedSkills}
                  onToggle={handleSkillToggle}
                  customSkills={customSkills}
                  onCustomChange={handleCustomSkillChange}
                  label="Skills Required — select all that apply"
                />
              )}

              {labourType === 'unskilled' && (
                <SkillsSection
                  categories={unskilledCategories}
                  selectedSkills={form.selectedSkills}
                  onToggle={handleSkillToggle}
                  customSkills={customSkills}
                  onCustomChange={handleCustomSkillChange}
                  label="Type of Labour Required — select all that apply"
                />
              )}

              {labourType === 'internship' && (
                <SkillsSection
                  categories={skilledCategories}
                  selectedSkills={form.selectedSkills}
                  onToggle={handleSkillToggle}
                  customSkills={customSkills}
                  onCustomChange={handleCustomSkillChange}
                  label="Relevant Skills or Departments — select all that apply (optional)"
                />
              )}

              {error && (
                <div style={{ background:'#fee2e2', color:'#dc2626', fontSize:13, padding:'11px 14px', borderRadius:12, marginBottom:20, fontWeight:600 }}>
                  <div>{error}</div>
                  {error.includes('pending approval') && (
                    <button 
                      type="button"
                      onClick={handleRefreshProfile}
                      disabled={refreshing}
                      style={{ marginTop:10, padding:'8px 16px', background:'#dc2626', color:'#fff', border:'none', borderRadius:6, cursor: refreshing ? 'not-allowed' : 'pointer', fontSize:12, fontWeight:700 }}
                    >
                      {refreshing ? 'Checking...' : 'Check Status Now'}
                    </button>
                  )}
                </div>
              )}

              <button type="submit" disabled={submitting} className="oj-submit-btn">
                {submitting ? 'Submitting...' : 'Submit Job Listing'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
