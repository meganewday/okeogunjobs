import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { APP_NAME } from '../config/constants'
import { useInactivityTimeout, clearActivity } from '../lib/inactivity'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024)
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isDesktop
}

// ─── Constants ────────────────────────────────────────────────────────────────
const LGAs = [
  'Saki West', 'Saki East', 'Atisbo', 'Oorelope', 'Olorunsogo',
  'Iseyin', 'Itesiwaju', 'Kajola', 'Iwajowa',
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

const EDUCATION_LABELS = {
  no_formal_education: 'No Formal Education',
  primary:             'Primary School',
  secondary:           'Secondary School',
  ond: 'OND', hnd: 'HND', bsc: 'BSc / BA', postgraduate: 'Postgraduate',
}

const ACADEMIC_LEVEL_LABELS = {
  nd1: 'ND 1 (Polytechnic)', nd2: 'ND 2 (Polytechnic)',
  hnd1: 'HND 1 (Polytechnic)', hnd2: 'HND 2 (Polytechnic)',
  '100l': '100 Level (University)', '200l': '200 Level (University)',
  '300l': '300 Level (University)', '400l': '400 Level (University)',
  '500l': '500 Level (University)', nce: 'NCE (College of Education)',
}

const APP_STATUS_STYLE = {
  submitted:   { bg: '#fff8e1', text: '#b45309' },
  shortlisted: { bg: '#e0f2fe', text: '#0369a1' },
  accepted:    { bg: '#dcfce7', text: '#166534' },
  rejected:    { bg: '#fee2e2', text: '#b91c1c' },
  withdrawn:   { bg: '#f3f4f6', text: '#6b7280' },
}

// ─── Global CSS ───────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.45} }
  select, input, textarea, button { font-family:'Outfit',sans-serif; }
  select:focus, input:focus, textarea:focus {
    outline: none;
    border-color: #16a34a !important;
    box-shadow: 0 0 0 3px rgba(22,163,74,0.12) !important;
  }
  .oj-input {
    width:100%; padding:11px 14px; font-size:14px;
    border:1.5px solid #dcfce7; border-radius:12px;
    background:#f0fdf4; color:#14532d;
    transition:border 0.15s, box-shadow 0.15s;
  }
  .oj-input::placeholder { color:#9ca3af; }
  .oj-detail-card {
    background:#fff; border-radius:20px; padding:28px;
    border:1.5px solid #dcfce7;
    box-shadow:0 2px 8px rgba(22,163,74,0.05);
    animation:fadeUp 0.4s ease both;
    opacity:0;
  }
  .oj-app-card {
    background:#fff; border-radius:16px; padding:20px 24px;
    border:1.5px solid #dcfce7;
    box-shadow:0 2px 6px rgba(22,163,74,0.05);
    display:flex; justify-content:space-between;
    align-items:flex-start; flex-wrap:wrap; gap:12px;
    transition:transform 0.2s, box-shadow 0.2s;
    animation:fadeUp 0.4s ease both; opacity:0;
  }
  .oj-app-card:hover { transform:translateY(-3px); box-shadow:0 8px 20px rgba(22,163,74,0.09); }
  .oj-skill-btn {
    padding:6px 14px; font-size:13px; border-radius:50px;
    border:1.5px solid #dcfce7; background:#f0fdf4;
    cursor:pointer; color:#166534; font-weight:500;
    transition:all 0.15s;
  }
  .oj-skill-btn:hover { border-color:#16a34a; background:#dcfce7; }
  .oj-skill-btn-active {
    background:#16a34a; color:#fff; border-color:#16a34a; font-weight:700;
  }
  .oj-tab {
    padding:9px 22px; border-radius:50px; border:none;
    background:transparent; cursor:pointer; font-size:14px;
    font-weight:600; color:#4b6358; transition:all 0.15s;
    font-family:'Outfit',sans-serif;
  }
  .oj-tab:hover { background:#dcfce7; color:#16a34a; }
  .oj-tab-active { background:#16a34a !important; color:#fff !important; }
`

// ─── Shared sub-components ────────────────────────────────────────────────────
function DetailRow({ label, value }) {
  if (!value) return null
  return (
    <div style={{ marginBottom: 14 }}>
      <span style={{ display:'block', fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:3 }}>{label}</span>
      <span style={{ fontSize:14, color:'#14532d', fontWeight:500 }}>{value}</span>
    </div>
  )
}

function CardTitle({ children }) {
  return (
    <h3 style={{ fontSize:15, fontWeight:800, color:'#16a34a', margin:'0 0 18px', paddingBottom:10, borderBottom:'2px solid #dcfce7' }}>
      {children}
    </h3>
  )
}

function SectionLabel({ children }) {
  return (
    <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#166534', marginBottom:7 }}>
      {children}
    </label>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function JobSeekerProfile() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth()
  const navigate    = useNavigate()
  const isDesktop   = useIsDesktop()

  const [allSkills, setAllSkills]         = useState([])
  const [skills, setSkills]               = useState([])
  const [applications, setApplications]   = useState([])
  const [appsLoading, setAppsLoading]     = useState(true)
  const [activeTab, setActiveTab]         = useState('profile')
  const [signingOut, setSigningOut]       = useState(false)

  // Edit mode
  const [editing, setEditing]       = useState(false)
  const [editForm, setEditForm]     = useState({})
  const [saving, setSaving]         = useState(false)
  const [saveError, setSaveError]   = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Photo
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError]         = useState('')

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading, navigate])

  useEffect(() => {
    if (profile) {
      fetchProfileSkills()
      fetchApplications()
      fetchAllSkills()
      setEditForm({
        full_name:           profile.full_name || '',
        phone_number:        profile.phone_number || '',
        whatsapp_number:     profile.whatsapp_number || '',
        gender:              profile.gender || '',
        age_range:           profile.age_range || '',
        location:            profile.location || '',
        ward:                profile.ward || '',
        lga:                 profile.lga || '',
        education_level:     profile.education_level || '',
        years_of_experience: profile.years_of_experience || '',
        previous_workplace:  profile.previous_workplace || '',
        institution:         profile.institution || '',
        course_of_study:     profile.course_of_study || '',
        academic_level:      profile.academic_level || '',
        preferred_lga:       profile.lga || '',
        availability_period: profile.availability_period || '',
        selectedSkills:      profile.skills || [],
      })
    }
  }, [profile])

  async function fetchAllSkills() {
    const { data } = await supabase.from('skills').select('*').order('category')
    if (data) setAllSkills(data)
  }

  async function fetchProfileSkills() {
    if (!profile?.skills?.length) return
    const { data } = await supabase.from('skills').select('id, name, category').in('id', profile.skills)
    if (data) setSkills(data)
  }

  async function fetchApplications() {
    setAppsLoading(true)
    const { data } = await supabase
      .from('applications')
      .select(`id, status, applied_at, cover_note,
        job_listings(id, job_title, job_type, location, lga, labour_type,
          employers(organization_name))`)
      .eq('job_seeker_id', profile.id)
      .order('applied_at', { ascending: false })
    if (data) setApplications(data)
    setAppsLoading(false)
  }

  async function handleSignOut() {
    setSigningOut(true)
    clearActivity('seeker')
    await signOut()
    navigate('/')
  }

  const handleTimeout = useCallback(async () => {
    await signOut()
    navigate('/login?timeout=1')
  }, [signOut, navigate])

  useInactivityTimeout('seeker', handleTimeout)

  async function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Only JPG, PNG or WebP images are allowed.'); return
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Photo must be under 2MB.'); return
    }
    setPhotoError(''); setPhotoUploading(true)
    try {
      const ext      = file.name.split('.').pop()
      const fileName = `seeker_${profile.id}_${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
      const { error: updateError } = await supabase.from('job_seekers').update({ photo_url: urlData.publicUrl }).eq('id', profile.id)
      if (updateError) throw updateError
      if (refreshProfile) await refreshProfile()
    } catch { setPhotoError('Photo upload failed. Please try again.') }
    finally   { setPhotoUploading(false) }
  }

  function handleEditChange(e) {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
  }

  function handleSkillToggle(skillId) {
    setEditForm(prev => {
      const already = prev.selectedSkills.includes(skillId)
      return { ...prev, selectedSkills: already ? prev.selectedSkills.filter(id => id !== skillId) : [...prev.selectedSkills, skillId] }
    })
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaveError(''); setSaveSuccess(false)
    if (!editForm.full_name || !editForm.phone_number) {
      setSaveError('Full name and phone number are required.'); return
    }
    setSaving(true)
    try {
      const payload = {
        full_name:           editForm.full_name.trim(),
        phone_number:        editForm.phone_number.trim(),
        whatsapp_number:     editForm.whatsapp_number.trim() || null,
        gender:              editForm.gender || null,
        age_range:           editForm.age_range || null,
        location:            editForm.location.trim() || null,
        ward:                editForm.ward.trim() || null,
        lga:                 editForm.lga || null,
        education_level:     editForm.education_level || null,
        years_of_experience: editForm.years_of_experience ? parseInt(editForm.years_of_experience) : 0,
        previous_workplace:  editForm.previous_workplace.trim() || null,
        skills:              editForm.selectedSkills.length > 0 ? editForm.selectedSkills : null,
      }
      if (profile.seeker_type === 'student') {
        payload.institution        = editForm.institution.trim() || null
        payload.course_of_study    = editForm.course_of_study.trim() || null
        payload.academic_level     = editForm.academic_level || null
        payload.availability_period = editForm.availability_period.trim() || null
        payload.lga                = editForm.preferred_lga || editForm.lga || null
      }
      const { error } = await supabase.from('job_seekers').update(payload).eq('id', profile.id)
      if (error) throw error
      if (refreshProfile) await refreshProfile()
      setSaveSuccess(true); setEditing(false)
    } catch { setSaveError('Could not save your changes. Please try again.') }
    finally   { setSaving(false) }
  }

  // ── Loading & empty states ───────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0fdf4', fontFamily:"'Outfit',sans-serif" }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:48, height:48, borderRadius:'50%', border:'4px solid #dcfce7', borderTopColor:'#16a34a', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ color:'#4b6358', fontSize:15 }}>Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0fdf4', padding:24, fontFamily:"'Outfit',sans-serif" }}>
        <div style={{ background:'#fff', borderRadius:24, padding:'48px 40px', textAlign:'center', border:'1.5px solid #dcfce7', maxWidth:400 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>👤</div>
          <h2 style={{ fontSize:20, fontWeight:800, color:'#14532d', margin:'0 0 10px' }}>Profile not found</h2>
          <p style={{ fontSize:14, color:'#4b6358', margin:'0 0 24px', lineHeight:1.6 }}>Your account exists but you have not completed your profile yet.</p>
          <Link to="/register" style={{ display:'inline-block', padding:'12px 28px', background:'#16a34a', color:'#fff', borderRadius:50, fontWeight:700, fontSize:14, textDecoration:'none', fontFamily:"'Outfit',sans-serif" }}>
            Complete Registration
          </Link>
        </div>
      </div>
    )
  }

  // ── Derived data ─────────────────────────────────────────────────────────
  const seekerTypeLabel = profile.seeker_type === 'skilled' ? 'Skilled Worker'
    : profile.seeker_type === 'unskilled' ? 'Unskilled Worker' : 'Student / IT / SIWES'

  const seekerTypeStyle = {
    skilled:   { bg:'#dcfce7', text:'#166534' },
    unskilled: { bg:'#fef9c3', text:'#854d0e' },
    student:   { bg:'#dbeafe', text:'#1e40af' },
  }[profile.seeker_type] || { bg:'#dcfce7', text:'#166534' }

  const grouped = allSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = []
    acc[skill.category].push(skill)
    return acc
  }, {})
  const skilledCategories   = Object.entries(grouped).filter(([cat]) => cat !== 'General Labour')
  const unskilledCategories = Object.entries(grouped).filter(([cat]) => cat === 'General Labour')

  return (
    <div style={{ fontFamily:"'Outfit','Segoe UI',sans-serif", background:'#f0fdf4', minHeight:'100vh', padding:'0 0 60px' }}>
      <style>{CSS}</style>

      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <section style={{ background:'linear-gradient(135deg,#14532d 0%,#166534 50%,#15803d 100%)', padding:'36px 24px 28px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.65)', margin:'0 0 4px', fontWeight:500 }}>{APP_NAME}</p>
            <h1 style={{ fontSize:'clamp(22px,3vw,30px)', fontWeight:900, color:'#fff', margin:0 }}>My Profile</h1>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{ padding:'9px 22px', background:'rgba(255,255,255,0.12)', color:'#fff', border:'1.5px solid rgba(255,255,255,0.3)', borderRadius:50, cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:"'Outfit',sans-serif", transition:'all 0.15s' }}
          >
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </section>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 24px' }}>

        {/* ── SUMMARY CARD ────────────────────────────────────────────────── */}
        <div style={{ background:'#fff', borderRadius:24, padding:'28px 28px', marginTop:-20, border:'1.5px solid #dcfce7', boxShadow:'0 4px 20px rgba(22,163,74,0.08)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:18 }}>
            {/* Avatar */}
            <div style={{ position:'relative', flexShrink:0 }}>
              {profile.photo_url ? (
                <img src={profile.photo_url} alt="Profile" style={{ width:68, height:68, borderRadius:'50%', objectFit:'cover', border:'3px solid #dcfce7' }} />
              ) : (
                <div style={{ width:68, height:68, borderRadius:'50%', background:'linear-gradient(135deg,#16a34a,#22c55e)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:900, color:'#fff', border:'3px solid #dcfce7' }}>
                  {profile.full_name?.charAt(0).toUpperCase()}
                </div>
              )}
              <label style={{ position:'absolute', bottom:-2, right:-2, width:24, height:24, borderRadius:'50%', background:'#fff', border:'1.5px solid #dcfce7', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:11, boxShadow:'0 2px 6px rgba(0,0,0,0.12)' }}
                title={photoUploading ? 'Uploading...' : 'Change photo'}>
                {photoUploading ? '⏳' : '📷'}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} style={{ display:'none' }} disabled={photoUploading} />
              </label>
            </div>

            <div>
              <h2 style={{ fontSize:20, fontWeight:900, color:'#14532d', margin:'0 0 3px' }}>{profile.full_name}</h2>
              <p style={{ fontSize:13, color:'#4b6358', margin:'1px 0', fontWeight:500 }}>{profile.phone_number}</p>
              {profile.lga && <p style={{ fontSize:13, color:'#4b6358', margin:'1px 0' }}>📍 {profile.lga}</p>}
              {photoError && <p style={{ fontSize:12, color:'#dc2626', margin:'4px 0 0' }}>{photoError}</p>}
            </div>
          </div>

          {/* Right pills */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
            <span style={{ padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:700, background:seekerTypeStyle.bg, color:seekerTypeStyle.text }}>
              {seekerTypeLabel}
            </span>
            <span style={{ padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:700, background: profile.status === 'approved' ? '#dcfce7' : '#fff8e1', color: profile.status === 'approved' ? '#166534' : '#b45309' }}>
              {profile.status === 'approved' ? '✓ Profile Active' : '⏳ Pending Review'}
            </span>
          </div>
        </div>

        {/* ── TABS ────────────────────────────────────────────────────────── */}
        <div style={{ display:'flex', gap:6, margin:'24px 0 20px', background:'#fff', borderRadius:50, padding:5, width:'fit-content', border:'1.5px solid #dcfce7' }}>
          <button className={`oj-tab ${activeTab === 'profile' ? 'oj-tab-active' : ''}`}
            onClick={() => { setActiveTab('profile'); setEditing(false) }}>
            My Details
          </button>
          <button className={`oj-tab ${activeTab === 'applications' ? 'oj-tab-active' : ''}`}
            onClick={() => { setActiveTab('applications'); setEditing(false) }}>
            Applications {applications.length > 0 && `(${applications.length})`}
          </button>
        </div>

        {/* ── PROFILE — VIEW ──────────────────────────────────────────────── */}
        {activeTab === 'profile' && !editing && (
          <div>
            {saveSuccess && (
              <div style={{ background:'#dcfce7', color:'#166534', fontSize:13, padding:'12px 18px', borderRadius:12, marginBottom:20, fontWeight:700, border:'1.5px solid #bbf7d0' }}>
                ✓ Profile updated successfully.
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap:20 }}>
              {/* Personal details */}
              <div className="oj-detail-card" style={{ animationDelay:'0s' }}>
                <CardTitle>Personal Details</CardTitle>
                <DetailRow label="Full Name"    value={profile.full_name} />
                <DetailRow label="Phone"        value={profile.phone_number} />
                <DetailRow label="WhatsApp"     value={profile.whatsapp_number} />
                <DetailRow label="Gender"       value={profile.gender?.replace('_', ' ')} />
                <DetailRow label="Age Range"    value={profile.age_range} />
                <DetailRow label="Town / Village" value={profile.location} />
                <DetailRow label="Ward"         value={profile.ward} />
                <DetailRow label="LGA"          value={profile.lga} />
              </div>

              {/* Background — skilled / unskilled */}
              {(profile.seeker_type === 'skilled' || profile.seeker_type === 'unskilled') && (
                <div className="oj-detail-card" style={{ animationDelay:'0.07s' }}>
                  <CardTitle>Background</CardTitle>
                  <DetailRow label="Education"          value={EDUCATION_LABELS[profile.education_level] || profile.education_level} />
                  {profile.seeker_type === 'skilled' && profile.years_of_experience > 0 && (
                    <DetailRow label="Experience" value={`${profile.years_of_experience} year(s)`} />
                  )}
                  <DetailRow label="Previous Workplace" value={profile.previous_workplace} />
                </div>
              )}

              {/* Academic — student */}
              {profile.seeker_type === 'student' && (
                <div className="oj-detail-card" style={{ animationDelay:'0.07s' }}>
                  <CardTitle>Academic Details</CardTitle>
                  <DetailRow label="Institution"  value={profile.institution} />
                  <DetailRow label="Course"       value={profile.course_of_study} />
                  <DetailRow label="Level"        value={ACADEMIC_LEVEL_LABELS[profile.academic_level] || profile.academic_level} />
                  <DetailRow label="Available"    value={profile.availability_period} />
                </div>
              )}

              {/* Skills */}
              {skills.length > 0 && (
                <div className="oj-detail-card" style={{ animationDelay:'0.14s' }}>
                  <CardTitle>{profile.seeker_type === 'student' ? 'Areas of Interest' : 'Skills'}</CardTitle>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {skills.map(skill => (
                      <span key={skill.id} style={{ padding:'5px 14px', background:'#dcfce7', color:'#166534', borderRadius:20, fontSize:13, fontWeight:700 }}>
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* CV */}
              {profile.cv_url && (
                <div className="oj-detail-card" style={{ animationDelay:'0.21s' }}>
                  <CardTitle>CV</CardTitle>
                  <a href={profile.cv_url} target="_blank" rel="noreferrer"
                    style={{ display:'inline-flex', alignItems:'center', gap:8, color:'#16a34a', fontWeight:700, fontSize:14, textDecoration:'none', padding:'10px 20px', background:'#f0fdf4', borderRadius:50, border:'1.5px solid #bbf7d0' }}>
                    📄 Download / View CV →
                  </a>
                </div>
              )}
            </div>

            <div style={{ marginTop:24, display:'flex', gap:12, flexWrap:'wrap' }}>
              <button onClick={() => { setEditing(true); setSaveSuccess(false) }}
                style={{ padding:'12px 28px', background:'#fff', color:'#16a34a', border:'2px solid #16a34a', borderRadius:50, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:"'Outfit',sans-serif", transition:'all 0.15s' }}>
                Edit Profile
              </button>
              <Link to="/jobs"
                style={{ display:'inline-block', padding:'12px 28px', background:'#16a34a', color:'#fff', borderRadius:50, fontWeight:700, fontSize:14, textDecoration:'none', fontFamily:"'Outfit',sans-serif", boxShadow:'0 4px 12px rgba(22,163,74,0.28)' }}>
                Browse Jobs
              </Link>
            </div>
          </div>
        )}

        {/* ── PROFILE — EDIT ──────────────────────────────────────────────── */}
        {activeTab === 'profile' && editing && (
          <form onSubmit={handleSave} style={{ background:'#fff', borderRadius:24, padding:'32px 28px', border:'1.5px solid #dcfce7', boxShadow:'0 2px 10px rgba(22,163,74,0.06)' }}>
            <h3 style={{ fontSize:17, fontWeight:800, color:'#14532d', margin:'0 0 24px', paddingBottom:12, borderBottom:'2px solid #dcfce7' }}>
              Edit Your Profile
            </h3>

            {/* Personal fields grid */}
            <div style={{ display:'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap:'0 24px' }}>
              {[
                { label:'Full Name *',    name:'full_name',       type:'text' },
                { label:'Phone Number *', name:'phone_number',    type:'tel' },
                { label:'WhatsApp Number',name:'whatsapp_number', type:'tel' },
                { label:'Town / Village', name:'location',        type:'text' },
                { label:'Ward',           name:'ward',            type:'text' },
              ].map(f => (
                <div key={f.name} style={{ marginBottom:20 }}>
                  <SectionLabel>{f.label}</SectionLabel>
                  <input className="oj-input" type={f.type} name={f.name} value={editForm[f.name]} onChange={handleEditChange} />
                </div>
              ))}

              {/* Gender */}
              <div style={{ marginBottom:20 }}>
                <SectionLabel>Gender</SectionLabel>
                <select className="oj-input" name="gender" value={editForm.gender} onChange={handleEditChange}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>

              {/* Age range */}
              <div style={{ marginBottom:20 }}>
                <SectionLabel>Age Range</SectionLabel>
                <select className="oj-input" name="age_range" value={editForm.age_range} onChange={handleEditChange}>
                  <option value="">Select age range</option>
                  {AGE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* LGA */}
              <div style={{ marginBottom:20 }}>
                <SectionLabel>LGA</SectionLabel>
                <select className="oj-input" name="lga" value={editForm.lga} onChange={handleEditChange}>
                  <option value="">Select LGA</option>
                  {LGAs.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            {/* Skilled / Unskilled extra fields */}
            {(profile.seeker_type === 'skilled' || profile.seeker_type === 'unskilled') && (
              <>
                <div style={{ display:'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap:'0 24px' }}>
                  <div style={{ marginBottom:20 }}>
                    <SectionLabel>Education Level</SectionLabel>
                    <select className="oj-input" name="education_level" value={editForm.education_level} onChange={handleEditChange}>
                      <option value="">Select education level</option>
                      {EDUCATION_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </div>
                  {profile.seeker_type === 'skilled' && (
                    <div style={{ marginBottom:20 }}>
                      <SectionLabel>Years of Experience</SectionLabel>
                      <input className="oj-input" type="number" name="years_of_experience" value={editForm.years_of_experience} onChange={handleEditChange} min="0" max="50" />
                    </div>
                  )}
                  <div style={{ marginBottom:20 }}>
                    <SectionLabel>Previous Workplace</SectionLabel>
                    <input className="oj-input" type="text" name="previous_workplace" value={editForm.previous_workplace} onChange={handleEditChange} />
                  </div>
                </div>

                {/* Skills selector */}
                <div style={{ marginBottom:24 }}>
                  <SectionLabel>{profile.seeker_type === 'unskilled' ? 'Type of Work' : 'Skills'} — select all that apply</SectionLabel>
                  {(profile.seeker_type === 'skilled' ? skilledCategories : unskilledCategories).map(([category, catSkills]) => (
                    <div key={category} style={{ marginBottom:16 }}>
                      {profile.seeker_type === 'skilled' && (
                        <p style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 8px' }}>{category}</p>
                      )}
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        {catSkills.map(skill => (
                          <button key={skill.id} type="button" onClick={() => handleSkillToggle(skill.id)}
                            className={`oj-skill-btn ${editForm.selectedSkills.includes(skill.id) ? 'oj-skill-btn-active' : ''}`}>
                            {skill.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Student extra fields */}
            {profile.seeker_type === 'student' && (
              <>
                <div style={{ display:'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap:'0 24px' }}>
                  {[
                    { label:'Institution Name',       name:'institution',        type:'text' },
                    { label:'Course of Study',        name:'course_of_study',    type:'text' },
                    { label:'Availability Period',    name:'availability_period',type:'text', placeholder:'e.g. June – September 2025' },
                  ].map(f => (
                    <div key={f.name} style={{ marginBottom:20 }}>
                      <SectionLabel>{f.label}</SectionLabel>
                      <input className="oj-input" type={f.type} name={f.name} value={editForm[f.name]} onChange={handleEditChange} placeholder={f.placeholder || ''} />
                    </div>
                  ))}
                  <div style={{ marginBottom:20 }}>
                    <SectionLabel>Academic Level</SectionLabel>
                    <select className="oj-input" name="academic_level" value={editForm.academic_level} onChange={handleEditChange}>
                      <option value="">Select level</option>
                      {ACADEMIC_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom:20 }}>
                    <SectionLabel>Preferred LGA for Placement</SectionLabel>
                    <select className="oj-input" name="preferred_lga" value={editForm.preferred_lga} onChange={handleEditChange}>
                      <option value="">Select LGA</option>
                      {LGAs.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                {/* Areas of interest */}
                <div style={{ marginBottom:24 }}>
                  <SectionLabel>Area of Interest — select all that apply</SectionLabel>
                  {skilledCategories.map(([category, catSkills]) => (
                    <div key={category} style={{ marginBottom:16 }}>
                      <p style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 8px' }}>{category}</p>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        {catSkills.map(skill => (
                          <button key={skill.id} type="button" onClick={() => handleSkillToggle(skill.id)}
                            className={`oj-skill-btn ${editForm.selectedSkills.includes(skill.id) ? 'oj-skill-btn-active' : ''}`}>
                            {skill.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {saveError && (
              <p style={{ color:'#dc2626', fontSize:13, marginBottom:16, padding:'10px 14px', background:'#fee2e2', borderRadius:10 }}>{saveError}</p>
            )}

            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <button type="submit" disabled={saving}
                style={{ padding:'12px 32px', background: saving ? '#9ca3af' : '#16a34a', color:'#fff', border:'none', borderRadius:50, fontWeight:700, fontSize:14, cursor: saving ? 'not-allowed' : 'pointer', fontFamily:"'Outfit',sans-serif", boxShadow: saving ? 'none' : '0 4px 12px rgba(22,163,74,0.28)', transition:'all 0.15s' }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setEditing(false)}
                style={{ padding:'12px 28px', background:'transparent', color:'#4b6358', border:'1.5px solid #dcfce7', borderRadius:50, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* ── APPLICATIONS TAB ────────────────────────────────────────────── */}
        {activeTab === 'applications' && (
          <div>
            {appsLoading ? (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {[...Array(3)].map((_,i) => (
                  <div key={i} style={{ background:'#fff', borderRadius:16, height:90, animation:'pulse 1.4s ease-in-out infinite', border:'1.5px solid #dcfce7' }} />
                ))}
              </div>
            ) : applications.length === 0 ? (
              <div style={{ background:'#fff', borderRadius:24, padding:'56px 24px', textAlign:'center', border:'1.5px dashed #bbf7d0' }}>
                <div style={{ fontSize:48, marginBottom:14 }}>📋</div>
                <p style={{ fontSize:17, fontWeight:800, color:'#14532d', margin:'0 0 8px' }}>No applications yet</p>
                <p style={{ fontSize:14, color:'#4b6358', margin:'0 0 24px' }}>You have not applied for any jobs yet.</p>
                <Link to="/jobs" style={{ display:'inline-block', padding:'12px 28px', background:'#16a34a', color:'#fff', borderRadius:50, fontWeight:700, fontSize:14, textDecoration:'none', fontFamily:"'Outfit',sans-serif" }}>
                  Browse Jobs
                </Link>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {applications.map((app, i) => {
                  const s = APP_STATUS_STYLE[app.status] || APP_STATUS_STYLE.submitted
                  return (
                    <div key={app.id} className="oj-app-card" style={{ animationDelay:`${i*0.06}s` }}>
                      <div style={{ flex:1 }}>
                        <h3 style={{ fontSize:16, fontWeight:800, color:'#14532d', margin:'0 0 4px' }}>
                          {app.job_listings?.job_title || 'Job listing unavailable'}
                        </h3>
                        <p style={{ fontSize:13, color:'#4b6358', margin:'0 0 4px', fontWeight:500 }}>
                          {app.job_listings?.employers?.organization_name}
                          {app.job_listings?.lga ? ` — ${app.job_listings.lga}` : ''}
                        </p>
                        <p style={{ fontSize:12, color:'#9ca3af', margin:0 }}>
                          Applied {new Date(app.applied_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                        </p>
                        {app.cover_note && (
                          <p style={{ fontSize:13, color:'#4b6358', fontStyle:'italic', marginTop:8, padding:'8px 12px', background:'#f0fdf4', borderRadius:10, border:'1px solid #dcfce7' }}>
                            "{app.cover_note}"
                          </p>
                        )}
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, flexShrink:0 }}>
                        <span style={{ padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:700, background:s.bg, color:s.text }}>
                          {app.status?.charAt(0).toUpperCase() + app.status?.slice(1)}
                        </span>
                        {app.job_listings?.job_type && (
                          <span style={{ padding:'4px 12px', background:'#f0fdf4', color:'#4b6358', borderRadius:20, fontSize:12, fontWeight:600, textTransform:'capitalize', border:'1px solid #dcfce7' }}>
                            {app.job_listings.job_type.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
