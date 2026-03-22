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

const NOTIFICATION_MESSAGES = {
  shortlisted: (jobTitle, orgName) =>
    `Good news! Your application for "${jobTitle}" at ${orgName} has been shortlisted. The employer may contact you soon for the next step.`,
  accepted: (jobTitle, orgName) =>
    `Congratulations! Your application for "${jobTitle}" at ${orgName} has been accepted. Expect a call or message from the employer.`,
  rejected: (jobTitle, orgName) =>
    `Your application for "${jobTitle}" at ${orgName} was not successful this time. Keep applying — new jobs are added regularly.`,
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
  const [updateError, setUpdateError] = useState(null)

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

    const { data: appsData } = await supabase
      .from('applications')
      .select(`
        id, status, applied_at, cover_note,
        job_seekers (
          id, full_name, phone_number, whatsapp_number, email,
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

  async function updateStatus(applicationId, newStatus, seekerId, seekerEmail, seekerName) {
    setUpdating(applicationId)
    setUpdateError(null)

    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', applicationId)

    if (error) {
      console.error('Status update error:', error)
      setUpdateError('Could not update status. Please try again.')
      setUpdating(null)
      return
    }

    // Update local state immediately
    setApplications(prev =>
      prev.map(app =>
        app.id === applicationId ? { ...app, status: newStatus } : app
      )
    )

    // Write in-app notification to notifications table
    const message = NOTIFICATION_MESSAGES[newStatus]?.(
      job.job_title,
      employerProfile.organization_name
    )

    if (message && seekerId) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          seeker_id: seekerId,
          recipient_type: 'job_seeker',
          message_type: `application_${newStatus}`,
          reference_id: applicationId,
          sent_at: new Date().toISOString(),
          delivery_status: 'delivered',
          message,
        })

      if (notifError) {
        console.error('Notification insert error:', notifError)
      }
    }

    // Send email notification — non-blocking, does not affect UI if it fails
    if (seekerEmail) {
      try {
        await supabase.functions.invoke('notify-application-status', {
          body: {
            seekerEmail,
            seekerName: seekerName || 'Applicant',
            jobTitle: job.job_title,
            orgName: employerProfile.organization_name,
            newStatus,
          },
        })
      } catch (emailErr) {
        // Log only — email failure must never block the status update
        console.error('Email notification error:', emailErr)
      }
    }

    setUpdating(null)
  }

  function getWhatsAppLink(phone, seekerName, newStatus) {
    if (!phone) return null
    const cleaned = phone.replace(/\D/g, '')
    const formatted = cleaned.startsWith('0') ? '234' + cleaned.slice(1) : cleaned
    const messages = {
      shortlisted: `Hello ${seekerName}, your application for the "${job?.job_title}" position at ${employerProfile?.organization_name} has been shortlisted. We will be in touch with next steps.`,
      accepted: `Hello ${seekerName}, congratulations! Your application for the "${job?.job_title}" position at ${employerProfile?.organization_name} has been accepted. Please contact us to discuss next steps.`,
      rejected: `Hello ${seekerName}, thank you for applying for the "${job?.job_title}" position at ${employerProfile?.organization_name}. Unfortunately, we will not be moving forward with your application at this time.`,
    }
    const text = messages[newStatus] || `Hello ${seekerName}, regarding your application for "${job?.job_title}" at ${employerProfile?.organization_name}.`
    return `https://wa.me/${formatted}?text=${encodeURIComponent(text)}`
  }

  function getContactWhatsAppLink(phone) {
    if (!phone) return null
    const cleaned = phone.replace(/\D/g, '')
    const formatted = cleaned.startsWith('0') ? '234' + cleaned.slice(1) : cleaned
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

        <Link to="/employer/dashboard" style={styles.backLink}>← Back to Dashboard</Link>

        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>{job.job_title}</h1>
            <p style={styles.pageSubtitle}>
              {job.lga || job.location || 'Oke-Ogun'}
              {job.job_type && ` · ${job.job_type.replace('_', ' ')}`}
              {' · '}
              <span style={{ ...styles.jobStatusPill, ...(STATUS_STYLES[job.status] || {}) }}>
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

        {updateError && (
          <div style={styles.errorBanner}>{updateError}</div>
        )}

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
              const contactWaLink = getContactWhatsAppLink(
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

                  {/* ACTION SECTION */}
                  <div style={styles.actionSection}>

                    {/* SUBMITTED — show Shortlist + Accept + Reject */}
                    {app.status === 'submitted' && (
                      <div style={styles.actionRow}>
                        <p style={styles.actionLabel}>Move this application:</p>
                        <div style={styles.actionButtons}>
                          {['shortlisted', 'accepted', 'rejected'].map(action => (
                            <button
                              key={action}
                              onClick={() => updateStatus(app.id, action, seeker?.id, seeker?.email, seeker?.full_name)}
                              disabled={updating === app.id}
                              style={{ ...styles.actionBtn, ...(ACTION_STYLES[action] || {}) }}
                            >
                              {updating === app.id ? '...' : ACTION_LABELS[action]}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SHORTLISTED — show badge + Final Decision section */}
                    {app.status === 'shortlisted' && (
                      <div style={styles.finalDecisionBox}>
                        <p style={styles.finalDecisionTitle}>Final Decision</p>
                        <p style={styles.finalDecisionHint}>
                          This applicant is shortlisted. Make a final decision after interview or further review.
                        </p>
                        <div style={styles.actionButtons}>
                          <button
                            onClick={() => updateStatus(app.id, 'accepted', seeker?.id, seeker?.email, seeker?.full_name)}
                            disabled={updating === app.id}
                            style={{ ...styles.actionBtn, ...ACTION_STYLES.accepted }}
                          >
                            {updating === app.id ? '...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => updateStatus(app.id, 'rejected', seeker?.id, seeker?.email, seeker?.full_name)}
                            disabled={updating === app.id}
                            style={{ ...styles.actionBtn, ...ACTION_STYLES.rejected }}
                          >
                            {updating === app.id ? '...' : 'Reject'}
                          </button>
                        </div>
                        {/* WhatsApp shortlist notification link */}
                        {(seeker?.whatsapp_number || seeker?.phone_number) && (
                          <a
                            href={getWhatsAppLink(seeker.whatsapp_number || seeker.phone_number, seeker.full_name, 'shortlisted')}
                            target="_blank"
                            rel="noreferrer"
                            style={styles.waNotifyLink}
                          >
                            📲 Also notify via WhatsApp
                          </a>
                        )}
                      </div>
                    )}

                    {/* ACCEPTED — WhatsApp link to follow up */}
                    {app.status === 'accepted' && (
                      <div style={styles.decisionMadeRow}>
                        <span style={{ ...styles.decisionBadge, backgroundColor: '#e8f5ee', color: '#1a6b3c' }}>
                          ✓ Accepted
                        </span>
                        {(seeker?.whatsapp_number || seeker?.phone_number) && (
                          <a
                            href={getWhatsAppLink(seeker.whatsapp_number || seeker.phone_number, seeker.full_name, 'accepted')}
                            target="_blank"
                            rel="noreferrer"
                            style={styles.waNotifyLink}
                          >
                            📲 Send acceptance message via WhatsApp
                          </a>
                        )}
                      </div>
                    )}

                    {/* REJECTED */}
                    {app.status === 'rejected' && (
                      <div style={styles.decisionMadeRow}>
                        <span style={{ ...styles.decisionBadge, backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                          ✗ Rejected
                        </span>
                      </div>
                    )}

                    {/* WITHDRAWN */}
                    {app.status === 'withdrawn' && (
                      <div style={styles.decisionMadeRow}>
                        <span style={{ ...styles.decisionBadge, backgroundColor: '#f3f4f6', color: '#6b7280' }}>
                          Withdrawn by applicant
                        </span>
                      </div>
                    )}

                  </div>

                  {/* CARD FOOTER */}
                  <div style={styles.cardFooter}>
                    <div style={styles.footerRight}>
                      {seeker?.cv_url && (
                        <a href={seeker.cv_url} target="_blank" rel="noreferrer" style={styles.cvLink}>
                          View CV
                        </a>
                      )}
                      {contactWaLink && (
                        <a href={contactWaLink} target="_blank" rel="noreferrer" style={styles.whatsappLink}>
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
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  pageTitle: { fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 'bold', color: '#222', margin: '0 0 4px 0' },
  pageSubtitle: { fontSize: '13px', color: '#888', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  jobStatusPill: { fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: '600', textTransform: 'capitalize' },
  totalCount: { display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#fff', borderRadius: '10px', padding: '12px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  totalCountNum: { fontSize: '28px', fontWeight: 'bold', color: '#1a6b3c' },
  totalCountLabel: { fontSize: '12px', color: '#888' },
  errorBanner: { backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '13px', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontWeight: '600' },
  filterRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' },
  filterBtn: { padding: '6px 14px', borderRadius: '20px', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#888' },
  filterBtnActive: { backgroundColor: '#1a6b3c', color: '#fff', borderColor: '#1a6b3c' },
  filterCount: { fontWeight: '400' },
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
  coverNote: { fontSize: '13px', color: '#666', fontStyle: 'italic', margin: '0 0 10px 0', paddingLeft: '12px', borderLeft: '3px solid #e8f5ee' },
  quickInfo: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' },
  quickTag: { fontSize: '11px', padding: '3px 10px', backgroundColor: '#f3f4f6', color: '#555', borderRadius: '10px' },
  skillTag: { fontSize: '11px', padding: '3px 10px', backgroundColor: '#e8f5ee', color: '#1a6b3c', borderRadius: '10px', fontWeight: '600' },
  expandedDetails: { backgroundColor: '#f9f9f9', borderRadius: '8px', padding: '16px', marginBottom: '12px' },
  allSkills: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' },

  // Action section
  actionSection: { borderTop: '1px solid #f0f0f0', paddingTop: '14px', marginBottom: '4px' },
  actionRow: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' },
  actionLabel: { fontSize: '12px', color: '#888', fontWeight: '600', margin: 0 },
  actionButtons: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  actionBtn: { padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: 'none' },

  // Final decision box (shortlisted state)
  finalDecisionBox: { backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '14px 16px' },
  finalDecisionTitle: { fontSize: '13px', fontWeight: '700', color: '#0369a1', margin: '0 0 4px 0' },
  finalDecisionHint: { fontSize: '12px', color: '#555', margin: '0 0 12px 0' },

  // Decision made (accepted/rejected)
  decisionMadeRow: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
  decisionBadge: { fontSize: '13px', padding: '5px 14px', borderRadius: '8px', fontWeight: '700' },

  // WhatsApp notify link
  waNotifyLink: { display: 'inline-block', marginTop: '10px', fontSize: '13px', color: '#25d366', fontWeight: '600', textDecoration: 'none' },

  // Card footer
  cardFooter: { display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid #f0f0f0', marginTop: '12px' },
  footerRight: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
  cvLink: { fontSize: '13px', color: '#1a6b3c', fontWeight: '600', textDecoration: 'none' },
  whatsappLink: { fontSize: '13px', color: '#25d366', fontWeight: '600', textDecoration: 'none' },
  expandBtn: { fontSize: '13px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: '4px 0' },

  emptyCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  emptyText: { fontSize: '14px', color: '#888' },
}