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
  const { user, profile, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()

  const [skills, setSkills] = useState([])
  const [applications, setApplications] = useState([])
  const [appsLoading, setAppsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  useEffect(() => {
    if (profile) {
      fetchSkills()
      fetchApplications()
    }
  }, [profile])

  async function fetchSkills() {
    if (!profile?.skills?.length) return
    const { data } = await supabase
      .from('skills')
      .select('id, name, category')
      .in('id', profile.skills)
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
          <p style={styles.emptyText}>
            Your account exists but you have not completed your profile yet.
          </p>
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

  return (
    <div style={styles.page}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* PAGE HEADER */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>My Profile</h1>
            <p style={styles.pageSubtitle}>{APP_NAME} — Job Seeker Account</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={styles.signOutBtn}
          >
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>

        {/* PROFILE SUMMARY CARD */}
        <div style={styles.summaryCard}>
          <div style={styles.summaryLeft}>
            <div style={styles.avatar}>
              {profile.full_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={styles.summaryName}>{profile.full_name}</h2>
              <p style={styles.summarySub}>{profile.phone_number}</p>
              {profile.lga && <p style={styles.summarySub}>{profile.lga}</p>}
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
            onClick={() => setActiveTab('profile')}
          >
            My Details
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab === 'applications' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('applications')}
          >
            Applications {applications.length > 0 && `(${applications.length})`}
          </button>
        </div>

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div style={styles.tabContent}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr',
              gap: '24px',
            }}>

              {/* Personal Details */}
              <div style={styles.detailCard}>
                <h3 style={styles.detailCardTitle}>Personal Details</h3>
                <div style={styles.detailGrid}>
                  <DetailRow label="Full Name" value={profile.full_name} />
                  <DetailRow label="Phone" value={profile.phone_number} />
                  {profile.whatsapp_number && <DetailRow label="WhatsApp" value={profile.whatsapp_number} />}
                  {profile.gender && <DetailRow label="Gender" value={profile.gender.replace('_', ' ')} />}
                  {profile.age_range && <DetailRow label="Age Range" value={profile.age_range} />}
                  {profile.location && <DetailRow label="Town / Village" value={profile.location} />}
                  {profile.ward && <DetailRow label="Ward" value={profile.ward} />}
                  {profile.lga && <DetailRow label="LGA" value={profile.lga} />}
                </div>
              </div>

              {/* Background — skilled / unskilled */}
              {(profile.seeker_type === 'skilled' || profile.seeker_type === 'unskilled') && (
                <div style={styles.detailCard}>
                  <h3 style={styles.detailCardTitle}>Background</h3>
                  <div style={styles.detailGrid}>
                    {profile.education_level && (
                      <DetailRow
                        label="Education"
                        value={EDUCATION_LABELS[profile.education_level] || profile.education_level}
                      />
                    )}
                    {profile.seeker_type === 'skilled' && profile.years_of_experience > 0 && (
                      <DetailRow label="Experience" value={`${profile.years_of_experience} year(s)`} />
                    )}
                    {profile.previous_workplace && (
                      <DetailRow label="Previous Workplace" value={profile.previous_workplace} />
                    )}
                  </div>
                </div>
              )}

              {/* Academic Details — student */}
              {profile.seeker_type === 'student' && (
                <div style={styles.detailCard}>
                  <h3 style={styles.detailCardTitle}>Academic Details</h3>
                  <div style={styles.detailGrid}>
                    {profile.institution && <DetailRow label="Institution" value={profile.institution} />}
                    {profile.course_of_study && <DetailRow label="Course" value={profile.course_of_study} />}
                    {profile.academic_level && (
                      <DetailRow
                        label="Level"
                        value={ACADEMIC_LEVEL_LABELS[profile.academic_level] || profile.academic_level}
                      />
                    )}
                    {profile.availability_period && (
                      <DetailRow label="Available" value={profile.availability_period} />
                    )}
                  </div>
                </div>
              )}

              {/* Skills */}
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

              {/* CV */}
              {profile.cv_url && (
                <div style={styles.detailCard}>
                  <h3 style={styles.detailCardTitle}>CV</h3>
                  <a
                    href={profile.cv_url}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.cvLink}
                  >
                    Download / View CV →
                  </a>
                </div>
              )}

            </div>

            <div style={{ marginTop: '24px' }}>
              <Link to="/jobs" style={styles.btn}>Browse Jobs</Link>
            </div>
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
                      <h3 style={styles.appJobTitle}>
                        {app.job_listings?.job_title || 'Job listing unavailable'}
                      </h3>
                      <p style={styles.appJobSub}>
                        {app.job_listings?.employers?.organization_name}
                        {app.job_listings?.lga ? ` — ${app.job_listings.lga}` : ''}
                      </p>
                      <p style={styles.appDate}>
                        Applied {new Date(app.applied_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                      {app.cover_note && (
                        <p style={styles.appCoverNote}>"{app.cover_note}"</p>
                      )}
                    </div>
                    <div style={styles.appCardRight}>
                      <span style={{
                        ...styles.appStatusPill,
                        ...(STATUS_STYLES[app.status] || STATUS_STYLES.submitted)
                      }}>
                        {app.status?.charAt(0).toUpperCase() + app.status?.slice(1)}
                      </span>
                      {app.job_listings?.job_type && (
                        <span style={styles.jobTypePill}>
                          {app.job_listings.job_type.replace('_', ' ')}
                        </span>
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
    <div style={detailRowStyles.row}>
      <span style={detailRowStyles.label}>{label}</span>
      <span style={detailRowStyles.value}>{value}</span>
    </div>
  )
}

const detailRowStyles = {
  row: { display: 'flex', flexDirection: 'column', marginBottom: '12px' },
  label: { fontSize: '12px', fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: '2px' },
  value: { fontSize: '14px', color: '#222' },
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f5f7f5', padding: '40px 24px' },
  centred: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f7f5', padding: '24px' },
  loadingText: { color: '#888', fontSize: '15px' },

  // Page header
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  pageTitle: { fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 'bold', color: '#1a6b3c', margin: 0 },
  pageSubtitle: { fontSize: '13px', color: '#888', marginTop: '2px' },
  signOutBtn: { padding: '8px 20px', backgroundColor: '#fff', color: '#e53e3e', border: '1px solid #e53e3e', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },

  // Summary card
  summaryCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' },
  summaryLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  avatar: { width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#1a6b3c', color: '#fff', fontSize: '22px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  summaryName: { fontSize: '18px', fontWeight: '700', color: '#222', margin: '0 0 2px 0' },
  summarySub: { fontSize: '13px', color: '#888', margin: '1px 0' },
  summaryRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' },
  seekerTypePill: { fontSize: '12px', padding: '4px 12px', borderRadius: '12px', fontWeight: '600' },
  statusPill: { fontSize: '12px', padding: '4px 12px', borderRadius: '12px', fontWeight: '600' },

  // Tabs
  tabs: { display: 'flex', gap: '4px', marginBottom: '16px', backgroundColor: '#fff', borderRadius: '10px', padding: '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', width: 'fit-content' },
  tab: { padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#888' },
  tabActive: { backgroundColor: '#1a6b3c', color: '#fff' },
  tabContent: { },

  // Detail cards
  detailCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  detailCardTitle: { fontSize: '15px', fontWeight: '700', color: '#1a6b3c', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #e8f5ee' },
  detailGrid: {},
  skillTags: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  skillTag: { padding: '4px 12px', backgroundColor: '#e8f5ee', color: '#1a6b3c', borderRadius: '12px', fontSize: '13px', fontWeight: '600' },
  cvLink: { color: '#1a6b3c', fontWeight: '600', fontSize: '14px', textDecoration: 'none' },

  // Buttons
  btn: { display: 'inline-block', padding: '12px 28px', backgroundColor: '#1a6b3c', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '14px' },

  // Empty state
  emptyCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  emptyTitle: { fontSize: '18px', fontWeight: '700', color: '#222', marginBottom: '8px' },
  emptyText: { fontSize: '14px', color: '#888', marginBottom: '20px' },

  // Applications
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
