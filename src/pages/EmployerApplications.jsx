import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
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
  nd1: 'ND 1', nd2: 'ND 2', hnd1: 'HND 1', hnd2: 'HND 2',
  '100l': '100 Level', '200l': '200 Level', '300l': '300 Level',
  '400l': '400 Level', '500l': '500 Level', nce: 'NCE',
}

const STATUS_STYLES = {
  submitted:   { backgroundColor: '#fff8e1', color: '#b45309' },
  shortlisted: { backgroundColor: '#e0f2fe', color: '#0369a1' },
  accepted:    { backgroundColor: '#e8f5ee', color: '#1a6b3c' },
  rejected:    { backgroundColor: '#fee2e2', color: '#b91c1c' },
  withdrawn:   { backgroundColor: '#f3f4f6', color: '#6b7280' },
}

const STATUS_ACTIONS = {
  submitted:   ['shortlisted', 'accepted', 'rejected'],
  shortlisted: ['accepted', 'rejected'],
  accepted:    [],
  rejected:    [],
  withdrawn:   [],
}

const ACTION_LABELS = {
  shortlisted: 'Shortlist',
  accepted:    'Accept',
  rejected:    'Reject',
}

const ACTION_STYLES = {
  shortlisted: { backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' },
  accepted:    { backgroundColor: '#e8f5ee', color: '#1a6b3c', border: '1px solid #a7f3d0' },
  rejected:    { backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' },
}

export default function EmployerApplications() {
  const { jobId } = useParams()
  const { employer, employerProfile, employerLoading } = useEmployerAuth()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()

  const [job, setJob] = useState(null)
  const [applications, setApplications] = useState([])
  const [skills, setSkills] = useState({})
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    if (!employerLoading && !employer) {
      navigate('/employer/login')
    }
  }, [employer, employerLoading, navigate])

  useEffect(() => {
    if (employerProfile && jobId) {
      fetchJobAndApplications()
    }
  }, [employerProfile, jobId])

  async function fetchJobAndApplications() {
    setLoading(true)

    // Fetch job — verify it belongs to this employer
    const { data: jobData } = await supabase
      .from('job_listings')
      .select('id, job_title, job_type, labour_type, location, lga, status')
      .eq('id', jobId)
      .eq('employer_id', employerProfile.id)
      .single()

    if (!jobData) {
      navigate('/employer/dashboard')
      return
    }
    setJob(jobData)

    // Fetch applications with seeker details
    const { data: appsData } = await supabase
      .from('applications')
      .select(`
        id, status, applied_at, cover_note,
        job_seekers (
          id, full_name, phone_number, whatsapp_number,
          lga, location, seeker_type, education_level,
          years_of_experience, previous_workplace,
          institution, course_of_study, academic_level,
          availability_period, skills, cv_url
        )
      `)
      .eq('job_listing_id', jobId)
      .order('applied_at', { ascending: false })

    if (appsData) {
      setApplications(appsData)

      // Collect all skill IDs across all applicants
      const allSkillIds = appsData
        .flatMap(app => app.job_seekers?.skills || [])
        .filter(Boolean)

      if (allSkillIds.length > 0) {
        const { data: skillsData } = await supabase
          .from('skills')
          .select('id, name')
          .in('id', [...new Set(allSkillIds)])
        if (skillsData) {
          const skillMap = {}
          skillsData.forEach(s => { skillMap[s.id] = s.name })
          setSkills(skillMap)
        }
      }
    }

    setLoading(false)
  }

  async function updateStatus(applicationId, newStatus) {
    setUpdating(applicationId)
    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', applicationId)
    if (!error) {
      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      )
    }
    setUpdating(null)
  }

  function getWhatsAppLink(phone) {
    if (!phone) return null
    const cleaned = phone.replace(/\D/g, '')
    const formatted = cleaned.startsWith('0')
      ? '234' + cleaned.slice(1)
      : cleaned
    return `https://wa.me/${formatted}`
  }

  const filtered = filterStatus === 'all'
    ? applications
    : applications.filter(app => app.status === filterStatus)

  const counts = {
    all: applications.length,
    submitted: applications.filter(a => a.status === 'submitted').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  }

  if (employerLoading || loading) {
    return (
      <div style={styles.centred}>
        <p style={styles.loadingText}>Loading applications...</p>
      </div>
    )
  }

  if (!job) return null

  return (
    <div style={styles.page}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* BACK + HEADER */}
        <Link to="/employer/dashboard" style={styles.backLink}>← Back to Dashboard</Link>

        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>{job.job_title}</h1>
            <p style={styles.pageSubtitle}>
              {job.lga || job.location || 'Oke-Ogun'}
              {job.job_type && ` · ${job.job_type.replace('_', ' ')}`}
              {' · '}
              <span style={{
                ...styles.jobStatusPill,
                ...(STATUS_STYLES[job.status] || {})
              }}>
                {job.status}
              </span>
            </p>
          </div>
          <div style={styles.totalCount}>
            <span style={styles.totalCountNum}>{applications.length}</span>
            <span style={styles.totalCountLabel}>
              {applications.length === 1 ? 'Applicant' : 'Applicants'}
            </span>
          </div>
        </div>

        {/* FILTER TABS */}
        <div style={styles.filterRow}>
          {['all', 'submitted', 'shortlisted', 'accepted', 'rejected'].map(status => (
            counts[status] > 0 || status === 'all' ? (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                style={{
                  ...styles.filterBtn,
                  ...(filterStatus === status ? styles.filterBtnActive : {})
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {' '}
                <span style={styles.filterCount}>({counts[status]})</span>
              </button>
            ) : null
          ))}
        </div>

        {/* APPLICATIONS LIST */}
        {filtered.length === 0 ? (
          <div style={styles.emptyCard}>
            <p style={styles.emptyText}>
              {applications.length === 0
                ? 'No one has applied for this job yet.'
                : `No applications with status "${filterStatus}".`}
            </p>
          </div>
        ) : (
          <div style={styles.appsList}>
            {filtered.map(app => {
              const seeker = app.job_seekers
              const isExpanded = expandedId === app.id
              const seekerSkills = (seeker?.skills || [])
                .map(id => skills[id])
                .filter(Boolean)
              const whatsappLink = getWhatsAppLink(
                seeker?.whatsapp_number || seeker?.phone_number
              )

              return (
                <div key={app.id} style={styles.appCard}>

                  {/* CARD TOP */}
                  <div style={styles.appCardTop}>
                    <div style={styles.appCardLeft}>
                      <div style={styles.avatarRow}>
                        <div style={styles.avatar}>
                          {seeker?.full_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <h3 style={styles.seekerName}>
                            {seeker?.full_name || 'Unknown Applicant'}
                          </h3>
                          <p style={styles.seekerMeta}>
                            {seeker?.lga || seeker?.location || 'Location not specified'}
                            {seeker?.seeker_type && ` · ${seeker.seeker_type.charAt(0).toUpperCase() + seeker.seeker_type.slice(1)}`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div style={styles.appCardRight}>
                      <span style={{
                        ...styles.statusPill,
                        ...(STATUS_STYLES[app.status] || STATUS_STYLES.submitted)
                      }}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                      <p style={styles.appliedDate}>
                        {new Date(app.applied_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* COVER NOTE */}
                  {app.cover_note && (
                    <p style={styles.coverNote}>"{app.cover_note}"</p>
                  )}

                  {/* QUICK INFO */}
                  <div style={styles.quickInfo}>
                    {seeker?.education_level && (
                      <span style={styles.quickTag}>
                        {EDUCATION_LABELS[seeker.education_level] || seeker.education_level}
                      </span>
                    )}
                    {seeker?.years_of_experience > 0 && (
                      <span style={styles.quickTag}>
                        {seeker.years_of_experience} yr{seeker.years_of_experience !== 1 ? 's' : ''} exp
                      </span>
                    )}
                    {seeker?.academic_level && (
                      <span style={styles.quickTag}>
                        {ACADEMIC_LEVEL_LABELS[seeker.academic_level] || seeker.academic_level}
                      </span>
                    )}
                    {seekerSkills.slice(0, 4).map(skill => (
                      <span key={skill} style={styles.skillTag}>{skill}</span>
                    ))}
                    {seekerSkills.length > 4 && (
                      <span style={styles.quickTag}>+{seekerSkills.length - 4} more</span>
                    )}
                  </div>

                  {/* EXPANDED DETAILS */}
                  {isExpanded && (
                    <div style={styles.expandedDetails}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr',
                        gap: '8px 24px',
                        marginBottom: '12px',
                      }}>
                        {seeker?.phone_number && (
                          <DetailItem label="Phone" value={seeker.phone_number} />
                        )}
                        {seeker?.whatsapp_number && (
                          <DetailItem label="WhatsApp" value={seeker.whatsapp_number} />
                        )}
                        {seeker?.previous_workplace && (
                          <DetailItem label="Previous Workplace" value={seeker.previous_workplace} />
                        )}
                        {seeker?.institution && (
                          <DetailItem label="Institution" value={seeker.institution} />
                        )}
                        {seeker?.course_of_study && (
                          <DetailItem label="Course" value={seeker.course_of_study} />
                        )}
                        {seeker?.availability_period && (
                          <DetailItem label="Available" value={seeker.availability_period} />
                        )}
                      </div>
                      {seekerSkills.length > 0 && (
                        <div style={styles.allSkills}>
                          {seekerSkills.map(skill => (
                            <span key={skill} style={styles.skillTag}>{skill}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* CARD FOOTER */}
                  <div style={styles.cardFooter}>
                    <div style={styles.footerLeft}>
                      {/* Status action buttons */}
                      {(STATUS_ACTIONS[app.status] || []).map(action => (
                        <button
                          key={action}
                          onClick={() => updateStatus(app.id, action)}
                          disabled={updating === app.id}
                          style={{
                            ...styles.actionBtn,
                            ...(ACTION_STYLES[action] || {})
                          }}
                        >
                          {updating === app.id ? '...' : ACTION_LABELS[action]}
                        </button>
                      ))}
                    </div>
                    <div style={styles.footerRight}>
                      {seeker?.cv_url && (
                        <a
                          href={seeker.cv_url}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.cvLink}
                        >
                          View CV
                        </a>
                      )}
                      {whatsappLink && (
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.whatsappLink}
                        >
                          WhatsApp
                        </a>
                      )}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : app.id)}
                        style={styles.expandBtn}
                      >
                        {isExpanded ? 'Show less' : 'Full details'}
                      </button>
                    </div>
                  </div>

                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}

function DetailItem({ label, value }) {
  return (
    <div style={{ marginBottom: '8px' }}>
      <span style={{ fontSize: '11px', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', display: 'block' }}>
        {label}
      </span>
      <span style={{ fontSize: '13px', color: '#333' }}>{value}</span>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f5f7f5', padding: '40px 24px' },
  centred: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f7f5', padding: '24px' },
  loadingText: { color: '#888', fontSize: '15px' },
  backLink: { display: 'inline-block', fontSize: '14px', color: '#1a6b3c', textDecoration: 'none', fontWeight: '600', marginBottom: '20px' },

  // Header
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  pageTitle: { fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 'bold', color: '#222', margin: '0 0 4px 0' },
  pageSubtitle: { fontSize: '13px', color: '#888', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  jobStatusPill: { fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: '600', textTransform: 'capitalize' },
  totalCount: { display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#fff', borderRadius: '10px', padding: '12px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  totalCountNum: { fontSize: '28px', fontWeight: 'bold', color: '#1a6b3c' },
  totalCountLabel: { fontSize: '12px', color: '#888' },

  // Filter tabs
  filterRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' },
  filterBtn: { padding: '6px 14px', borderRadius: '20px', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#888' },
  filterBtnActive: { backgroundColor: '#1a6b3c', color: '#fff', borderColor: '#1a6b3c' },
  filterCount: { fontWeight: '400' },

  // Application cards
  appsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  appCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  appCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' },
  appCardLeft: { flex: 1 },
  appCardRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' },
  avatarRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#1a6b3c', color: '#fff', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  seekerName: { fontSize: '15px', fontWeight: '700', color: '#222', margin: '0 0 2px 0' },
  seekerMeta: { fontSize: '12px', color: '#888', margin: 0 },
  statusPill: { fontSize: '12px', padding: '3px 10px', borderRadius: '10px', fontWeight: '600' },
  appliedDate: { fontSize: '11px', color: '#aaa', margin: 0 },

  // Cover note
  coverNote: { fontSize: '13px', color: '#666', fontStyle: 'italic', margin: '0 0 10px 0', paddingLeft: '12px', borderLeft: '3px solid #e8f5ee' },

  // Quick info tags
  quickInfo: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' },
  quickTag: { fontSize: '11px', padding: '3px 10px', backgroundColor: '#f3f4f6', color: '#555', borderRadius: '10px' },
  skillTag: { fontSize: '11px', padding: '3px 10px', backgroundColor: '#e8f5ee', color: '#1a6b3c', borderRadius: '10px', fontWeight: '600' },

  // Expanded details
  expandedDetails: { backgroundColor: '#f9f9f9', borderRadius: '8px', padding: '16px', marginBottom: '12px' },
  allSkills: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' },

  // Card footer
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f0f0f0' },
  footerLeft: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  footerRight: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
  actionBtn: { padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  cvLink: { fontSize: '13px', color: '#1a6b3c', fontWeight: '600', textDecoration: 'none' },
  whatsappLink: { fontSize: '13px', color: '#25d366', fontWeight: '600', textDecoration: 'none' },
  expandBtn: { fontSize: '13px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: '4px 0' },

  // Empty
  emptyCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  emptyText: { fontSize: '14px', color: '#888' },
}
