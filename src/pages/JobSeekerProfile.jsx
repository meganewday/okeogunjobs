import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
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

const EDUCATION_LABELS = {
  no_formal_education: 'No Formal Education',
  primary: 'Primary School',
  secondary: 'Secondary School',
  ond: 'OND',
  hnd: 'HND',
  bsc: 'BSc / BA',
  postgraduate: 'Postgraduate',
}

const ACADEMIC_LEVEL_LABELS = {
  nd1: 'ND 1 (Polytechnic)',
  nd2: 'ND 2 (Polytechnic)',
  hnd1: 'HND 1 (Polytechnic)',
  hnd2: 'HND 2 (Polytechnic)',
  '100l': '100 Level (University)',
  '200l': '200 Level (University)',
  '300l': '300 Level (University)',
  '400l': '400 Level (University)',
  '500l': '500 Level (University)',
  nce: 'NCE (College of Education)',
}

const STATUS_STYLES = {
  submitted:   { backgroundColor: '#fff8e1', color: '#b45309' },
  shortlisted: { backgroundColor: '#e0f2fe', color: '#0369a1' },
  accepted:    { backgroundColor: '#e8f5ee', color: '#1a6b3c' },
  rejected:    { backgroundColor: '#fee2e2', color: '#b91c1c' },
  withdrawn:   { backgroundColor: '#f3f4f6', color: '#6b7280' },
}

export default function JobSeekerProfile() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()

  const [allSkills, setAllSkills] = useState([])
  const [skills, setSkills] = useState([])
  const [applications, setApplications] = useState([])
  const [appsLoading, setAppsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')
  const [signingOut, setSigningOut] = useState(false)

  // Edit mode
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Photo upload
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState('')

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading, navigate])

  useEffect(() => {
    if (profile) {
      fetchProfileSkills()
      fetchApplications()
      fetchAllSkills()
      setEditForm({
        full_name: profile.full_name || '',
        phone_number: profile.phone_number || '',
        whatsapp_number: profile.whatsapp_number || '',
        gender: profile.gender || '',
        age_range: profile.age_range || '',
        location: profile.location || '',
        ward: profile.ward || '',
        lga: profile.lga || '',
        education_level: profile.education_level || '',
        years_of_experience: profile.years_of_experience || '',
        previous_workplace: profile.previous_workplace || '',
        institution: profile.institution || '',
        course_of_study: profile.course_of_study || '',
        academic_level: profile.academic_level || '',
        preferred_lga: profile.lga || '',
        availability_period: profile.availability_period || '',
        selectedSkills: profile.skills || [],
      })
    }
  }, [profile])

  async function fetchAllSkills() {
    const { data } = await supabase.from('skills').select('*').order('category')
    if (data) setAllSkills(data)
  }

  async function fetchProfileSkills() {
    if (!profile?.skills?.length) return
    const { data } = await supabase
      .from('skills').select('id, name, category').in('id', profile.skills)
    if (data) setSkills(data)
  }

  async function fetchApplications() {
    setAppsLoading(true)
    const { data } = await supabase
      .from('applications')
      .select(`
        id, status, applied_at, cover_note,
        job_listings (
          id, job_title, job_type, location, lga, labour_type,
          employers ( organization_name )
        )
      `)
      .eq('job_seeker_id', profile.id)
      .order('applied_at', { ascending: false })
    if (data) setApplications(data)
    setAppsLoading(false)
  }

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    navigate('/')
  }

  async function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setPhotoError('Only JPG, PNG or WebP images are allowed.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Photo must be under 2MB.')
      return
    }
    setPhotoError('')
    setPhotoUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `seeker_${profile.id}_${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars').upload(fileName, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
      const { error: updateError } = await supabase
        .from('job_seekers').update({ photo_url: urlData.publicUrl }).eq('id', profile.id)
      if (updateError) throw updateError
      if (refreshProfile) await refreshProfile()
    } catch (err) {
      console.error(err)
      setPhotoError('Photo upload failed. Please try again.')
    } finally {
      setPhotoUploading(false)
    }
  }

  function handleEditChange(e) {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
  }

  function handleSkillToggle(skillId) {
    setEditForm(prev => {
      const already = prev.selectedSkills.includes(skillId)
      return {
        ...prev,
        selectedSkills: already
          ? prev.selectedSkills.filter(id => id !== skillId)
          : [...prev.selectedSkills, skillId]
      }
    })
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaveError('')
    setSaveSuccess(false)
    if (!editForm.full_name || !editForm.phone_number) {
      setSaveError('Full name and phone number are required.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        full_name: editForm.full_name.trim(),
        phone_number: editForm.phone_number.trim(),
        whatsapp_number: editForm.whatsapp_number.trim() || null,
        gender: editForm.gender || null,
        age_range: editForm.age_range || null,
        location: editForm.location.trim() || null,
        ward: editForm.ward.trim() || null,
        lga: editForm.lga || null,
        education_level: editForm.education_level || null,
        years_of_experience: editForm.years_of_experience ? parseInt(editForm.years_of_experience) : 0,
        previous_workplace: editForm.previous_workplace.trim() || null,
        skills: editForm.selectedSkills.length > 0 ? editForm.selectedSkills : null,
      }
      if (profile.seeker_type === 'student') {
        payload.institution = editForm.institution.trim() || null
        payload.course_of_study = editForm.course_of_study.trim() || null
        payload.academic_level = editForm.academic_level || null
        payload.availability_period = editForm.availability_period.trim() || null
        payload.lga = editForm.preferred_lga || editForm.lga || null
      }
      const { error } = await supabase
        .from('job_seekers').update(payload).eq('id', profile.id)
      if (error) throw error
      if (refreshProfile) await refreshProfile()
      setSaveSuccess(true)
      setEditing(false)
    } catch (err) {
      console.error(err)
      setSaveError('Could not save your changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={styles.centred}>
        <p style={styles.loadingText}>Loading your profile...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={styles.centred}>
        <div style={styles.emptyCard}>
          <h2 style={styles.emptyTitle}>Profile not found</h2>
          <p style={styles.emptyText}>Your account exists but you have not completed your profile yet.</p>
          <Link to="/register" style={styles.btn}>Complete Registration</Link>
        </div>
      </div>
    )
  }

  const seekerTypeLabel = profile.seeker_type === 'skilled'
    ? 'Skilled Worker'
    : profile.seeker_type === 'unskilled'
    ? 'Unskilled Worker'
    : 'Student / IT / SIWES'

  const grouped = allSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = []
    acc[skill.category].push(skill)
    return acc
  }, {})
  const skilledCategories = Object.entries(grouped).filter(([cat]) => cat !== 'General Labour')
  const unskilledCategories = Object.entries(grouped).filter(([cat]) => cat === 'General Labour')

  return (
    <div style={styles.page}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* PAGE HEADER */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>My Profile</h1>
            <p style={styles.pageSubtitle}>{APP_NAME} — Job Seeker Account</p>
          </div>
          <button onClick={handleSignOut} disabled={signingOut} style={styles.signOutBtn}>
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>

        {/* SUMMARY CARD */}
        <div style={styles.summaryCard}>
          <div style={styles.summaryLeft}>
            <div style={styles.avatarWrap}>
              {profile.photo_url ? (
                <img src={profile.photo_url} alt="Profile" style={styles.avatarImg} />
              ) : (
                <div style={styles.avatarInitial}>
                  {profile.full_name?.charAt(0).toUpperCase()}
                </div>
              )}
              <label style={styles.photoEditBtn} title={photoUploading ? 'Uploading...' : 'Change photo'}>
                {photoUploading ? '⏳' : '📷'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                  disabled={photoUploading}
                />
              </label>
            </div>
            <div>
              <h2 style={styles.summaryName}>{profile.full_name}</h2>
              <p style={styles.summarySub}>{profile.phone_number}</p>
              {profile.lga && <p style={styles.summarySub}>{profile.lga}</p>}
              {photoError && <p style={styles.photoError}>{photoError}</p>}
            </div>
          </div>
          <div style={styles.summaryRight}>
            <span style={{
              ...styles.seekerTypePill,
              backgroundColor: profile.seeker_type === 'student' ? '#e0f2fe' : '#e8f5ee',
              color: profile.seeker_type === 'student' ? '#0369a1' : '#1a6b3c',
            }}>
              {seekerTypeLabel}
            </span>
            <span style={{
              ...styles.statusPill,
              backgroundColor: profile.status === 'approved' ? '#e8f5ee' : '#fff8e1',
              color: profile.status === 'approved' ? '#1a6b3c' : '#b45309',
            }}>
              {profile.status === 'approved' ? 'Profile Active' : 'Pending Review'}
            </span>
          </div>
        </div>

        {/* TABS */}
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(activeTab === 'profile' ? styles.tabActive : {}) }}
            onClick={() => { setActiveTab('profile'); setEditing(false) }}
          >
            My Details
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab === 'applications' ? styles.tabActive : {}) }}
            onClick={() => { setActiveTab('applications'); setEditing(false) }}
          >
            Applications {applications.length > 0 && `(${applications.length})`}
          </button>
        </div>

        {/* PROFILE — VIEW */}
        {activeTab === 'profile' && !editing && (
          <div style={styles.tabContent}>
            {saveSuccess && (
              <div style={styles.successBanner}>Profile updated successfully.</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: '24px' }}>
              <div style={styles.detailCard}>
                <h3 style={styles.detailCardTitle}>Personal Details</h3>
                <DetailRow label="Full Name" value={profile.full_name} />
                <DetailRow label="Phone" value={profile.phone_number} />
                {profile.whatsapp_number && <DetailRow label="WhatsApp" value={profile.whatsapp_number} />}
                {profile.gender && <DetailRow label="Gender" value={profile.gender.replace('_', ' ')} />}
                {profile.age_range && <DetailRow label="Age Range" value={profile.age_range} />}
                {profile.location && <DetailRow label="Town / Village" value={profile.location} />}
                {profile.ward && <DetailRow label="Ward" value={profile.ward} />}
                {profile.lga && <DetailRow label="LGA" value={profile.lga} />}
              </div>

              {(profile.seeker_type === 'skilled' || profile.seeker_type === 'unskilled') && (
                <div style={styles.detailCard}>
                  <h3 style={styles.detailCardTitle}>Background</h3>
                  {profile.education_level && (
                    <DetailRow label="Education" value={EDUCATION_LABELS[profile.education_level] || profile.education_level} />
                  )}
                  {profile.seeker_type === 'skilled' && profile.years_of_experience > 0 && (
                    <DetailRow label="Experience" value={`${profile.years_of_experience} year(s)`} />
                  )}
                  {profile.previous_workplace && (
                    <DetailRow label="Previous Workplace" value={profile.previous_workplace} />
                  )}
                </div>
              )}

              {profile.seeker_type === 'student' && (
                <div style={styles.detailCard}>
                  <h3 style={styles.detailCardTitle}>Academic Details</h3>
                  {profile.institution && <DetailRow label="Institution" value={profile.institution} />}
                  {profile.course_of_study && <DetailRow label="Course" value={profile.course_of_study} />}
                  {profile.academic_level && (
                    <DetailRow label="Level" value={ACADEMIC_LEVEL_LABELS[profile.academic_level] || profile.academic_level} />
                  )}
                  {profile.availability_period && <DetailRow label="Available" value={profile.availability_period} />}
                </div>
              )}

              {skills.length > 0 && (
                <div style={styles.detailCard}>
                  <h3 style={styles.detailCardTitle}>
                    {profile.seeker_type === 'student' ? 'Areas of Interest' : 'Skills'}
                  </h3>
                  <div style={styles.skillTags}>
                    {skills.map(skill => (
                      <span key={skill.id} style={styles.skillTag}>{skill.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {profile.cv_url && (
                <div style={styles.detailCard}>
                  <h3 style={styles.detailCardTitle}>CV</h3>
                  <a href={profile.cv_url} target="_blank" rel="noreferrer" style={styles.cvLink}>
                    Download / View CV →
                  </a>
                </div>
              )}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={() => { setEditing(true); setSaveSuccess(false) }} style={styles.editBtn}>
                Edit Profile
              </button>
              <Link to="/jobs" style={styles.btn}>Browse Jobs</Link>
            </div>
          </div>
        )}

        {/* PROFILE — EDIT */}
        {activeTab === 'profile' && editing && (
          <div style={styles.tabContent}>
            <form onSubmit={handleSave} style={styles.editForm}>
              <h3 style={styles.editFormTitle}>Edit Your Profile</h3>

              <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: '0 24px' }}>
                <div style={styles.field}>
                  <label style={styles.label}>Full Name *</label>
                  <input style={styles.input} type="text" name="full_name" value={editForm.full_name} onChange={handleEditChange} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Phone Number *</label>
                  <input style={styles.input} type="tel" name="phone_number" value={editForm.phone_number} onChange={handleEditChange} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>WhatsApp Number</label>
                  <input style={styles.input} type="tel" name="whatsapp_number" value={editForm.whatsapp_number} onChange={handleEditChange} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Gender</label>
                  <select style={styles.input} name="gender" value={editForm.gender} onChange={handleEditChange}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Age Range</label>
                  <select style={styles.input} name="age_range" value={editForm.age_range} onChange={handleEditChange}>
                    <option value="">Select age range</option>
                    {AGE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Town / Village</label>
                  <input style={styles.input} type="text" name="location" value={editForm.location} onChange={handleEditChange} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Ward</label>
                  <input style={styles.input} type="text" name="ward" value={editForm.ward} onChange={handleEditChange} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>LGA</label>
                  <select style={styles.input} name="lga" value={editForm.lga} onChange={handleEditChange}>
                    <option value="">Select LGA</option>
                    {LGAs.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              {(profile.seeker_type === 'skilled' || profile.seeker_type === 'unskilled') && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: '0 24px' }}>
                    <div style={styles.field}>
                      <label style={styles.label}>Education Level</label>
                      <select style={styles.input} name="education_level" value={editForm.education_level} onChange={handleEditChange}>
                        <option value="">Select education level</option>
                        {EDUCATION_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                    </div>
                    {profile.seeker_type === 'skilled' && (
                      <div style={styles.field}>
                        <label style={styles.label}>Years of Experience</label>
                        <input style={styles.input} type="number" name="years_of_experience" value={editForm.years_of_experience} onChange={handleEditChange} min="0" max="50" />
                      </div>
                    )}
                    <div style={styles.field}>
                      <label style={styles.label}>Previous Workplace</label>
                      <input style={styles.input} type="text" name="previous_workplace" value={editForm.previous_workplace} onChange={handleEditChange} />
                    </div>
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>
                      {profile.seeker_type === 'unskilled' ? 'Type of Work' : 'Skills'} — select all that apply
                    </label>
                    {(profile.seeker_type === 'skilled' ? skilledCategories : unskilledCategories).map(([category, categorySkills]) => (
                      <div key={category} style={styles.skillGroup}>
                        {profile.seeker_type === 'skilled' && <p style={styles.skillCategory}>{category}</p>}
                        <div style={styles.skillGrid}>
                          {categorySkills.map(skill => (
                            <button key={skill.id} type="button" onClick={() => handleSkillToggle(skill.id)}
                              style={{ ...styles.skillBtn, ...(editForm.selectedSkills.includes(skill.id) ? styles.skillBtnActive : {}) }}>
                              {skill.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {profile.seeker_type === 'student' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: '0 24px' }}>
                    <div style={styles.field}>
                      <label style={styles.label}>Institution Name</label>
                      <input style={styles.input} type="text" name="institution" value={editForm.institution} onChange={handleEditChange} />
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Course of Study</label>
                      <input style={styles.input} type="text" name="course_of_study" value={editForm.course_of_study} onChange={handleEditChange} />
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Academic Level</label>
                      <select style={styles.input} name="academic_level" value={editForm.academic_level} onChange={handleEditChange}>
                        <option value="">Select level</option>
                        {ACADEMIC_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Preferred LGA for Placement</label>
                      <select style={styles.input} name="preferred_lga" value={editForm.preferred_lga} onChange={handleEditChange}>
                        <option value="">Select LGA</option>
                        {LGAs.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Availability Period</label>
                      <input style={styles.input} type="text" name="availability_period" value={editForm.availability_period} onChange={handleEditChange} placeholder="e.g. June – September 2025" />
                    </div>
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Area of Interest — select all that apply</label>
                    {skilledCategories.map(([category, categorySkills]) => (
                      <div key={category} style={styles.skillGroup}>
                        <p style={styles.skillCategory}>{category}</p>
                        <div style={styles.skillGrid}>
                          {categorySkills.map(skill => (
                            <button key={skill.id} type="button" onClick={() => handleSkillToggle(skill.id)}
                              style={{ ...styles.skillBtn, ...(editForm.selectedSkills.includes(skill.id) ? styles.skillBtnActive : {}) }}>
                              {skill.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {saveError && <p style={styles.error}>{saveError}</p>}

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
                <button type="submit" disabled={saving}
                  style={{ ...styles.saveBtn, ...(saving ? styles.saveBtnDisabled : {}) }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditing(false)} style={styles.cancelBtn}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* APPLICATIONS TAB */}
        {activeTab === 'applications' && (
          <div style={styles.tabContent}>
            {appsLoading ? (
              <p style={styles.loadingText}>Loading applications...</p>
            ) : applications.length === 0 ? (
              <div style={styles.emptyCard}>
                <p style={styles.emptyText}>You have not applied for any jobs yet.</p>
                <Link to="/jobs" style={styles.btn}>Browse Jobs</Link>
              </div>
            ) : (
              <div style={styles.appsList}>
                {applications.map(app => (
                  <div key={app.id} style={styles.appCard}>
                    <div style={styles.appCardLeft}>
                      <h3 style={styles.appJobTitle}>{app.job_listings?.job_title || 'Job listing unavailable'}</h3>
                      <p style={styles.appJobSub}>
                        {app.job_listings?.employers?.organization_name}
                        {app.job_listings?.lga ? ` — ${app.job_listings.lga}` : ''}
                      </p>
                      <p style={styles.appDate}>
                        Applied {new Date(app.applied_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      {app.cover_note && <p style={styles.appCoverNote}>"{app.cover_note}"</p>}
                    </div>
                    <div style={styles.appCardRight}>
                      <span style={{ ...styles.appStatusPill, ...(STATUS_STYLES[app.status] || STATUS_STYLES.submitted) }}>
                        {app.status?.charAt(0).toUpperCase() + app.status?.slice(1)}
                      </span>
                      {app.job_listings?.job_type && (
                        <span style={styles.jobTypePill}>{app.job_listings.job_type.replace('_', ' ')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

function DetailRow({ label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '12px' }}>
      <span style={{ fontSize: '12px', fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</span>
      <span style={{ fontSize: '14px', color: '#222' }}>{value}</span>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f5f7f5', padding: '40px 24px' },
  centred: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f7f5', padding: '24px' },
  loadingText: { color: '#888', fontSize: '15px' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  pageTitle: { fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 'bold', color: '#1a6b3c', margin: 0 },
  pageSubtitle: { fontSize: '13px', color: '#888', marginTop: '2px' },
  signOutBtn: { padding: '8px 20px', backgroundColor: '#fff', color: '#e53e3e', border: '1px solid #e53e3e', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  summaryCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' },
  summaryLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatarImg: { width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', display: 'block' },
  avatarInitial: { width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#1a6b3c', color: '#fff', fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  photoEditBtn: { position: 'absolute', bottom: '-2px', right: '-2px', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#fff', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '11px', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' },
  photoError: { fontSize: '12px', color: '#e53e3e', margin: '4px 0 0 0' },
  summaryName: { fontSize: '18px', fontWeight: '700', color: '#222', margin: '0 0 2px 0' },
  summarySub: { fontSize: '13px', color: '#888', margin: '1px 0' },
  summaryRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' },
  seekerTypePill: { fontSize: '12px', padding: '4px 12px', borderRadius: '12px', fontWeight: '600' },
  statusPill: { fontSize: '12px', padding: '4px 12px', borderRadius: '12px', fontWeight: '600' },
  tabs: { display: 'flex', gap: '4px', marginBottom: '16px', backgroundColor: '#fff', borderRadius: '10px', padding: '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', width: 'fit-content' },
  tab: { padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#888' },
  tabActive: { backgroundColor: '#1a6b3c', color: '#fff' },
  tabContent: {},
  successBanner: { backgroundColor: '#e8f5ee', color: '#1a6b3c', fontSize: '13px', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontWeight: '600' },
  detailCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  detailCardTitle: { fontSize: '15px', fontWeight: '700', color: '#1a6b3c', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #e8f5ee' },
  skillTags: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  skillTag: { padding: '4px 12px', backgroundColor: '#e8f5ee', color: '#1a6b3c', borderRadius: '12px', fontSize: '13px', fontWeight: '600' },
  cvLink: { color: '#1a6b3c', fontWeight: '600', fontSize: '14px', textDecoration: 'none' },
  btn: { display: 'inline-block', padding: '12px 28px', backgroundColor: '#1a6b3c', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '14px' },
  editBtn: { padding: '12px 28px', backgroundColor: '#fff', color: '#1a6b3c', border: '2px solid #1a6b3c', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' },
  saveBtn: { padding: '12px 28px', backgroundColor: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' },
  saveBtnDisabled: { backgroundColor: '#aaa', cursor: 'not-allowed' },
  cancelBtn: { padding: '12px 28px', backgroundColor: '#fff', color: '#888', border: '1px solid #ddd', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' },
  editForm: { backgroundColor: '#fff', borderRadius: '12px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  editFormTitle: { fontSize: '16px', fontWeight: '700', color: '#1a6b3c', marginBottom: '20px', paddingBottom: '8px', borderBottom: '2px solid #e8f5ee' },
  field: { marginBottom: '20px' },
  label: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box', outline: 'none' },
  error: { color: '#e53e3e', fontSize: '13px', marginBottom: '12px' },
  skillGroup: { marginBottom: '12px' },
  skillCategory: { fontSize: '12px', fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: '6px' },
  skillGrid: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  skillBtn: { padding: '6px 12px', fontSize: '13px', borderRadius: '20px', border: '1px solid #ddd', backgroundColor: '#f9f9f9', cursor: 'pointer', color: '#333' },
  skillBtnActive: { backgroundColor: '#1a6b3c', color: '#fff', borderColor: '#1a6b3c' },
  emptyCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  emptyTitle: { fontSize: '18px', fontWeight: '700', color: '#222', marginBottom: '8px' },
  emptyText: { fontSize: '14px', color: '#888', marginBottom: '20px' },
  appsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  appCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' },
  appCardLeft: { flex: 1 },
  appCardRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' },
  appJobTitle: { fontSize: '15px', fontWeight: '700', color: '#222', margin: '0 0 4px 0' },
  appJobSub: { fontSize: '13px', color: '#666', margin: '0 0 4px 0' },
  appDate: { fontSize: '12px', color: '#aaa', margin: 0 },
  appCoverNote: { fontSize: '13px', color: '#888', fontStyle: 'italic', marginTop: '6px' },
  appStatusPill: { fontSize: '12px', padding: '4px 12px', borderRadius: '12px', fontWeight: '600' },
  jobTypePill: { fontSize: '12px', padding: '4px 10px', backgroundColor: '#f3f4f6', color: '#666', borderRadius: '12px', fontWeight: '600', textTransform: 'capitalize' },
}
