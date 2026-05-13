import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { APP_NAME } from '../config/constants'
import { useInactivityTimeout, clearActivity } from '../lib/inactivity'

export default function AdminDashboard() {
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState('employers')
  const [jobListings, setJobListings] = useState([])
  const [jobSeekers, setJobSeekers] = useState([])
  const [employers, setEmployers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPostJobForm, setShowPostJobForm] = useState(false)
  const [postingJob, setPostingJob] = useState(false)
  const [jobForm, setJobForm] = useState({
    job_title: '',
    job_description: '',
    job_type: '',
    labour_type: '',
    location: '',
    lga: '',
    application_method: 'phone'
  })
  const [jobError, setJobError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate('/admin/login')
        return
      }

      // Verify user is in the admins table
      const { data: adminRow } = await supabase
        .from('admins')
        .select('id, role')
        .eq('id', session.user.id)
        .single()

      if (!adminRow) {
        // Authenticated but not an admin — sign out and redirect
        await supabase.auth.signOut()
        navigate('/admin/login')
        return
      }

      setSession(session)
      setIsAdmin(true)
      fetchData()
    })
  }, [])

  async function fetchData() {
    setLoading(true)
    await Promise.all([fetchEmployers(), fetchJobListings(), fetchJobSeekers()])
    setLoading(false)
  }

  async function fetchEmployers() {
    const { data } = await supabase
      .from('employers')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setEmployers(data)
  }

  async function fetchJobListings() {
    const { data } = await supabase
      .from('job_listings')
      .select(`
        *,
        employers(
          organization_name,
          contact_person,
          phone_number,
          email
        )
      `)
      .order('created_at', { ascending: false })
    if (data) setJobListings(data)
  }

  async function fetchJobSeekers() {
    const { data } = await supabase
      .from('job_seekers')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setJobSeekers(data)
  }

  async function updateJobStatus(id, status) {
    const updates = { status }
    if (status === 'approved') updates.approved_at = new Date().toISOString()
    const { error } = await supabase
      .from('job_listings')
      .update(updates)
      .eq('id', id)
    if (!error) fetchJobListings()
  }

  async function updateSeekerStatus(id, status) {
    const { error } = await supabase
      .from('job_seekers')
      .update({ status })
      .eq('id', id)
    if (!error) fetchJobSeekers()
  }

  async function updateEmployerStatus(id, status) {
    const { error } = await supabase
      .from('employers')
      .update({ status })
      .eq('id', id)
    if (!error) fetchEmployers()
  }

  const handleTimeout = useCallback(async () => {
    clearActivity('admin')
    await supabase.auth.signOut()
    navigate('/admin/login?timeout=1')
  }, [navigate])

  useInactivityTimeout('admin', handleTimeout)

  async function handleLogout() {
    clearActivity('admin')
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  const pendingJobs     = jobListings.filter(j => j.status === 'pending')
  const approvedJobs    = jobListings.filter(j => j.status === 'approved')
  const pendingSeekers  = jobSeekers.filter(s => s.status === 'pending')
  const approvedSeekers = jobSeekers.filter(s => s.status === 'approved')
  const pendingEmployers = employers.filter(e => e.status === 'pending')
  const approvedEmployers = employers.filter(e => e.status === 'approved')
  const activePaidEmployers = employers.filter(e => e.is_paid_featured && e.paid_featured_until && new Date(e.paid_featured_until) > new Date())

  function statusBadge(status) {
    const colors = {
      pending:  { bg: '#fff8e1', color: '#f59e0b' },
      approved: { bg: '#e8f5ee', color: '#1a6b3c' },
      rejected: { bg: '#fef0ef', color: '#e53e3e' },
      closed:   { bg: '#f0f0f0', color: '#888' },
    }
    const c = colors[status] || colors.pending
    return (
      <span style={{ ...styles.badge, backgroundColor: c.bg, color: c.color }}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  function isEmployerSubscriptionActive(employer) {
    return Boolean(employer?.is_paid_featured && employer?.paid_featured_until && new Date(employer.paid_featured_until) > new Date())
  }

  async function updateEmployerSubscription(employerId, grant = true, days = 30) {
    const employer = employers.find(e => e.id === employerId)
    if (!employer) return

    const currentExpiry = employer.paid_featured_until ? new Date(employer.paid_featured_until) : new Date()
    const now = new Date()
    const baseDate = currentExpiry > now ? currentExpiry : now
    const nextExpiry = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000).toISOString()

    const updates = {
      is_paid_featured: grant,
      paid_featured_until: grant ? nextExpiry : null,
    }

    const { error } = await supabase
      .from('employers')
      .update(updates)
      .eq('id', employerId)

    if (!error) fetchEmployers()
  }

  function handleJobFormChange(e) {
    const { name, value } = e.target
    setJobForm(prev => ({ ...prev, [name]: value }))
  }

  async function handlePostJob(e) {
    e.preventDefault()
    setJobError('')

    if (!jobForm.job_title || !jobForm.job_description || !jobForm.job_type || !jobForm.labour_type) {
      setJobError('Please fill in all required fields.')
      return
    }

    setPostingJob(true)
    try {
      // Don't include employer_id to allow NULL for admin jobs
      const jobPayload = {
        job_title: jobForm.job_title.trim(),
        job_description: jobForm.job_description.trim(),
        job_type: jobForm.job_type,
        labour_type: jobForm.labour_type,
        location: jobForm.location.trim() || null,
        lga: jobForm.lga || null,
        application_method: jobForm.application_method,
        status: 'approved', // Admin jobs are auto-approved
        approved_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('job_listings').insert(jobPayload)
      if (error) throw error

      // Reset form and close modal
      setJobForm({
        job_title: '',
        job_description: '',
        job_type: '',
        labour_type: '',
        location: '',
        lga: '',
        application_method: 'phone'
      })
      setShowPostJobForm(false)
      fetchJobListings() // Refresh the job listings
    } catch (err) {
      console.error('Job posting error:', err)
      setJobError(`Failed to post job: ${err.message || 'Something went wrong'}`)
    } finally {
      setPostingJob(false)
    }
  }

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <p style={styles.loadingText}>Loading dashboard...</p>
      </div>
    )
  }

  // Extra guard — should never reach here due to useEffect redirect
  if (!isAdmin) return null

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>{APP_NAME} Admin</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={() => setShowPostJobForm(true)} style={styles.postJobBtn}>Post Job</button>
          <button onClick={handleLogout} style={styles.logoutBtn}>Sign Out</button>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <p style={styles.statNumber}>{pendingEmployers.length}</p>
          <p style={styles.statLabel}>Pending Employers</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statNumber}>{activePaidEmployers.length}</p>
          <p style={styles.statLabel}>Active Paid Employers</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statNumber}>{pendingJobs.length}</p>
          <p style={styles.statLabel}>Pending Jobs</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statNumber}>{approvedJobs.length}</p>
          <p style={styles.statLabel}>Approved Jobs</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statNumber}>{pendingSeekers.length}</p>
          <p style={styles.statLabel}>Pending Seekers</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statNumber}>{approvedSeekers.length}</p>
          <p style={styles.statLabel}>Approved Seekers</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('employers')}
          style={{ ...styles.tab, ...(activeTab === 'employers' ? styles.tabActive : {}) }}
        >
          Employers ({employers.length})
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          style={{ ...styles.tab, ...(activeTab === 'jobs' ? styles.tabActive : {}) }}
        >
          Job Listings ({jobListings.length})
        </button>
        <button
          onClick={() => setActiveTab('seekers')}
          style={{ ...styles.tab, ...(activeTab === 'seekers' ? styles.tabActive : {}) }}
        >
          Job Seekers ({jobSeekers.length})
        </button>
      </div>

      {/* Employers Tab */}
      {activeTab === 'employers' && (
        <div style={styles.list}>
          {employers.length === 0 && <p style={styles.empty}>No employers yet.</p>}
          {employers.map(employer => (
            <div key={employer.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {employer.logo_url ? (
                    <img src={employer.logo_url} alt="" style={styles.logoImage} />
                  ) : (
                    <div style={styles.logoPlaceholder}>
                      {employer.organization_name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 style={styles.cardTitle}>{employer.organization_name}</h3>
                    <p style={styles.cardSub}>{employer.industry || 'Industry not specified'} — {employer.lga || 'LGA not specified'}</p>
                  </div>
                </div>
                {statusBadge(employer.status)}
              </div>
              <p style={styles.cardDetail}><strong>Contact Person:</strong> {employer.contact_person}</p>
              <p style={styles.cardDetail}><strong>Phone:</strong> {employer.phone_number}</p>
              {employer.email && (
                <p style={styles.cardDetail}><strong>Email:</strong> {employer.email}</p>
              )}
              {employer.is_paid_featured && employer.paid_featured_until && new Date(employer.paid_featured_until) > new Date() ? (
                <p style={styles.cardDetail}><strong>Paid Access Until:</strong> {new Date(employer.paid_featured_until).toLocaleDateString()}</p>
              ) : (
                <p style={{ ...styles.cardDetail, color: '#b45309', fontWeight: 700 }}><strong>Paid access inactive</strong></p>
              )}
              {employer.business_type && (
                <p style={styles.cardDetail}><strong>Business Type:</strong> {employer.business_type}</p>
              )}
              {employer.cac_number && (
                <p style={styles.cardDetail}><strong>CAC Number:</strong> {employer.cac_number}</p>
              )}
              {employer.year_registered && (
                <p style={styles.cardDetail}><strong>Year Registered:</strong> {employer.year_registered}</p>
              )}
              {employer.description && (
                <p style={styles.cardDescription}>{employer.description}</p>
              )}
              <p style={styles.cardDate}>Registered: {new Date(employer.created_at).toLocaleDateString()}</p>

              {employer.status === 'pending' && (
                <div style={styles.actionRow}>
                  <button onClick={() => updateEmployerStatus(employer.id, 'approved')} style={styles.approveBtn}>Approve Account</button>
                  <button onClick={() => updateEmployerStatus(employer.id, 'rejected')} style={styles.rejectBtn}>Reject</button>
                </div>
              )}
              <div style={styles.actionRow}>
                {isEmployerSubscriptionActive(employer) ? (
                  <>
                    <button onClick={() => updateEmployerSubscription(employer.id, false)} style={styles.rejectBtn}>Revoke Paid Access</button>
                    <button onClick={() => updateEmployerSubscription(employer.id, true, 30)} style={styles.approveBtn}>Extend Paid Access 30d</button>
                  </>
                ) : (
                  <button onClick={() => updateEmployerSubscription(employer.id, true, 30)} style={styles.approveBtn}>Grant Paid Access 30d</button>
                )}
              </div>
              {employer.status === 'approved' && (
                <div style={styles.actionRow}>
                  <button onClick={() => updateEmployerStatus(employer.id, 'suspended')} style={styles.suspendBtn}>Suspend</button>
                  <button onClick={() => updateEmployerStatus(employer.id, 'rejected')} style={styles.rejectBtn}>Reject</button>
                </div>
              )}
              {employer.status === 'suspended' && (
                <div style={styles.actionRow}>
                  <button onClick={() => updateEmployerStatus(employer.id, 'approved')} style={styles.approveBtn}>Re-activate</button>
                </div>
              )}
              {employer.status === 'rejected' && (
                <div style={styles.actionRow}>
                  <button onClick={() => updateEmployerStatus(employer.id, 'approved')} style={styles.approveBtn}>Approve</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Job Listings Tab */}
      {activeTab === 'jobs' && (
        <div style={styles.list}>
          {jobListings.length === 0 && <p style={styles.empty}>No job listings yet.</p>}
          {jobListings.map(job => (
            <div key={job.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={styles.cardTitle}>{job.job_title}</h3>
                  <p style={styles.cardSub}>
                    {job.employers?.organization_name || 'Admin'} — {job.lga || 'LGA not specified'}
                  </p>
                </div>
                {statusBadge(job.status)}
              </div>
              <p style={styles.cardDetail}><strong>Type:</strong> {job.job_type?.replace('_', ' ')}</p>
              <p style={styles.cardDetail}><strong>Location:</strong> {job.location || '—'}</p>
              <p style={styles.cardDetail}><strong>Application via:</strong> {job.application_method}</p>
              <p style={styles.cardDetail}><strong>Contact:</strong> {job.employers?.contact_person || 'Admin'}</p>
              <p style={styles.cardDetail}><strong>Phone:</strong> {job.employers?.phone_number || 'Contact Admin'}</p>
              {job.employers?.email && (
                <p style={styles.cardDetail}><strong>Email:</strong> {job.employers.email}</p>
              )}
              <p style={styles.cardDescription}>{job.job_description}</p>
              <p style={styles.cardDate}>Submitted: {new Date(job.created_at).toLocaleDateString()}</p>

              {job.status === 'pending' && (
                <div style={styles.actionRow}>
                  <button onClick={() => updateJobStatus(job.id, 'approved')} style={styles.approveBtn}>Approve</button>
                  <button onClick={() => updateJobStatus(job.id, 'rejected')} style={styles.rejectBtn}>Reject</button>
                </div>
              )}
              {job.status === 'approved' && (
                <div style={styles.actionRow}>
                  <button onClick={() => updateJobStatus(job.id, 'closed')} style={styles.closeBtn}>Mark as Closed</button>
                  <button onClick={() => updateJobStatus(job.id, 'rejected')} style={styles.rejectBtn}>Reject</button>
                </div>
              )}
              {job.status === 'rejected' && (
                <div style={styles.actionRow}>
                  <button onClick={() => updateJobStatus(job.id, 'approved')} style={styles.approveBtn}>Re-approve</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Job Seekers Tab */}
      {activeTab === 'seekers' && (
        <div style={styles.list}>
          {jobSeekers.length === 0 && <p style={styles.empty}>No job seekers yet.</p>}
          {jobSeekers.map(seeker => (
            <div key={seeker.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {seeker.photo_url ? (
                    <img src={seeker.photo_url} alt="" style={styles.seekerAvatar} />
                  ) : (
                    <div style={styles.seekerAvatarInitial}>
                      {seeker.full_name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 style={styles.cardTitle}>{seeker.full_name}</h3>
                    <p style={styles.cardSub}>{seeker.lga || 'LGA not specified'}</p>
                  </div>
                </div>
                {statusBadge(seeker.status)}
              </div>
              <p style={styles.cardDetail}><strong>Phone:</strong> {seeker.phone_number}</p>
              {seeker.whatsapp_number && (
                <p style={styles.cardDetail}><strong>WhatsApp:</strong> {seeker.whatsapp_number}</p>
              )}
              {seeker.gender && (
                <p style={styles.cardDetail}><strong>Gender:</strong> {seeker.gender}</p>
              )}
              {seeker.age_range && (
                <p style={styles.cardDetail}><strong>Age Range:</strong> {seeker.age_range}</p>
              )}
              {seeker.education_level && (
                <p style={styles.cardDetail}><strong>Education:</strong> {seeker.education_level.replace(/_/g, ' ')}</p>
              )}
              {seeker.years_of_experience > 0 && (
                <p style={styles.cardDetail}><strong>Experience:</strong> {seeker.years_of_experience} year(s)</p>
              )}
              {seeker.location && (
                <p style={styles.cardDetail}><strong>Location:</strong> {seeker.location}{seeker.ward ? `, ${seeker.ward}` : ''}</p>
              )}
              {seeker.cv_url && (
                <p style={styles.cardDetail}>
                  <strong>CV: </strong>
                  <a href={seeker.cv_url} target="_blank" rel="noreferrer" style={styles.link}>View CV</a>
                </p>
              )}
              <p style={styles.cardDate}>Submitted: {new Date(seeker.created_at).toLocaleDateString()}</p>

              {seeker.status === 'pending' && (
                <div style={styles.actionRow}>
                  <button onClick={() => updateSeekerStatus(seeker.id, 'approved')} style={styles.approveBtn}>Approve</button>
                  <button onClick={() => updateSeekerStatus(seeker.id, 'rejected')} style={styles.rejectBtn}>Reject</button>
                </div>
              )}
              {seeker.status === 'approved' && (
                <div style={styles.actionRow}>
                  <button onClick={() => updateSeekerStatus(seeker.id, 'rejected')} style={styles.rejectBtn}>Reject</button>
                </div>
              )}
              {seeker.status === 'rejected' && (
                <div style={styles.actionRow}>
                  <button onClick={() => updateSeekerStatus(seeker.id, 'approved')} style={styles.approveBtn}>Re-approve</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Post Job Modal */}
      {showPostJobForm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Post Job as Admin</h2>
              <button onClick={() => setShowPostJobForm(false)} style={styles.modalClose}>×</button>
            </div>
            <form onSubmit={handlePostJob} style={styles.modalForm}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Job Title *</label>
                  <input
                    type="text"
                    name="job_title"
                    value={jobForm.job_title}
                    onChange={handleJobFormChange}
                    style={styles.input}
                    placeholder="e.g. Administrative Assistant"
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Job Type *</label>
                  <select name="job_type" value={jobForm.job_type} onChange={handleJobFormChange} style={styles.input} required>
                    <option value="">Select job type</option>
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Position Type *</label>
                  <select name="labour_type" value={jobForm.labour_type} onChange={handleJobFormChange} style={styles.input} required>
                    <option value="">Select position type</option>
                    <option value="skilled">Skilled</option>
                    <option value="unskilled">Unskilled</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Application Method</label>
                  <select name="application_method" value={jobForm.application_method} onChange={handleJobFormChange} style={styles.input}>
                    <option value="phone">Apply on Platform</option>
                    <option value="whatsapp">Apply via WhatsApp</option>
                  </select>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={jobForm.location}
                    onChange={handleJobFormChange}
                    style={styles.input}
                    placeholder="e.g. Saki, Oyo State"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Local Government Area</label>
                  <select name="lga" value={jobForm.lga} onChange={handleJobFormChange} style={styles.input}>
                    <option value="">Select LGA</option>
                    <option value="Saki West">Saki West</option>
                    <option value="Saki East">Saki East</option>
                    <option value="Atisbo">Atisbo</option>
                    <option value="Oorelope">Oorelope</option>
                    <option value="Olorunsogo">Olorunsogo</option>
                    <option value="Iseyin">Iseyin</option>
                    <option value="Itesiwaju">Itesiwaju</option>
                    <option value="Kajola">Kajola</option>
                    <option value="Iwajowa">Iwajowa</option>
                    <option value="Irepo">Irepo</option>
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Job Description *</label>
                <textarea
                  name="job_description"
                  value={jobForm.job_description}
                  onChange={handleJobFormChange}
                  style={{ ...styles.input, height: '100px', resize: 'vertical' }}
                  placeholder="Describe the job responsibilities, requirements, and any other relevant information..."
                  required
                />
              </div>

              {jobError && (
                <div style={styles.error}>
                  {jobError}
                </div>
              )}

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowPostJobForm(false)} style={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={postingJob} style={styles.submitBtn}>
                  {postingJob ? 'Posting...' : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f5f7f5', paddingBottom: '40px' },
  loadingWrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#888', fontSize: '16px' },
  header: { backgroundColor: '#1a6b3c', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: '20px', fontWeight: 'bold', margin: 0 },
  logoutBtn: { backgroundColor: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.5)', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  statsRow: { display: 'flex', gap: '12px', padding: '20px 24px', flexWrap: 'wrap' },
  statCard: { backgroundColor: '#fff', borderRadius: '10px', padding: '16px 20px', flex: '1', minWidth: '120px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center' },
  statNumber: { fontSize: '28px', fontWeight: 'bold', color: '#1a6b3c', margin: '0 0 4px 0' },
  statLabel: { fontSize: '12px', color: '#888', margin: 0 },
  tabs: { display: 'flex', gap: '8px', padding: '0 24px', marginBottom: '16px' },
  tab: { padding: '8px 20px', borderRadius: '20px', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px', color: '#555' },
  tabActive: { backgroundColor: '#1a6b3c', color: '#fff', borderColor: '#1a6b3c' },
  list: { padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  empty: { color: '#888', fontSize: '14px', textAlign: 'center', padding: '40px 0' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  cardTitle: { fontSize: '16px', fontWeight: '700', color: '#222', margin: '0 0 4px 0' },
  cardSub: { fontSize: '13px', color: '#888', margin: 0 },
  badge: { padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' },
  cardDetail: { fontSize: '13px', color: '#444', margin: '4px 0' },
  cardDescription: { fontSize: '13px', color: '#555', margin: '10px 0', lineHeight: '1.5', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '6px' },
  cardDate: { fontSize: '12px', color: '#aaa', marginTop: '8px' },
  actionRow: { display: 'flex', gap: '10px', marginTop: '14px' },
  approveBtn: { padding: '8px 20px', backgroundColor: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  rejectBtn: { padding: '8px 20px', backgroundColor: '#fff', color: '#e53e3e', border: '1px solid #e53e3e', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  suspendBtn: { padding: '8px 20px', backgroundColor: '#fff', color: '#f59e0b', border: '1px solid #f59e0b', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  closeBtn: { padding: '8px 20px', backgroundColor: '#fff', color: '#888', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  link: { color: '#1a6b3c', textDecoration: 'underline' },
  logoImage: { width: '48px', height: '48px', borderRadius: '6px', objectFit: 'contain', flexShrink: 0, backgroundColor: '#f5f5f5' },
  logoPlaceholder: { width: '48px', height: '48px', borderRadius: '6px', backgroundColor: '#1a6b3c', color: '#fff', fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  seekerAvatar: { width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  seekerAvatarInitial: { width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#1a6b3c', color: '#fff', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  postJobBtn: { backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#fff', borderRadius: '12px', padding: 0, maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e5e7eb' },
  modalTitle: { margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1a6b3c' },
  modalClose: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666', padding: 0, width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalForm: { padding: '24px' },
  formRow: { display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' },
  formGroup: { flex: 1, minWidth: '200px' },
  label: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' },
  error: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '6px', fontSize: '14px', marginBottom: '16px' },
  modalActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' },
  cancelBtn: { padding: '10px 20px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  submitBtn: { padding: '10px 20px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
}
