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
      .select('*, employers(organization_name, contact_person, phone_number, email)')
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
        <button onClick={handleLogout} style={styles.logoutBtn}>Sign Out</button>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <p style={styles.statNumber}>{pendingEmployers.length}</p>
          <p style={styles.statLabel}>Pending Employers</p>
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
                    {job.employers?.organization_name} — {job.lga || 'LGA not specified'}
                  </p>
                </div>
                {statusBadge(job.status)}
              </div>
              <p style={styles.cardDetail}><strong>Type:</strong> {job.job_type?.replace('_', ' ')}</p>
              <p style={styles.cardDetail}><strong>Location:</strong> {job.location || '—'}</p>
              <p style={styles.cardDetail}><strong>Application via:</strong> {job.application_method}</p>
              <p style={styles.cardDetail}><strong>Contact:</strong> {job.employers?.contact_person}</p>
              <p style={styles.cardDetail}><strong>Phone:</strong> {job.employers?.phone_number}</p>
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
}
