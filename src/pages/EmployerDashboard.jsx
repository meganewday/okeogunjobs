import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEmployerAuth } from '../contexts/EmployerAuthContext'
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

const STATUS_STYLES = {
  pending:  { backgroundColor: '#fff8e1', color: '#b45309' },
  approved: { backgroundColor: '#e8f5ee', color: '#1a6b3c' },
  rejected: { backgroundColor: '#fee2e2', color: '#b91c1c' },
  closed:   { backgroundColor: '#f3f4f6', color: '#6b7280' },
}

const JOB_TYPE_LABELS = {
  full_time:  'Full Time',
  part_time:  'Part Time',
  contract:   'Contract',
  internship: 'Internship',
}

export default function EmployerDashboard() {
  const { employer, employerProfile, employerLoading, employerSignOut, refreshEmployerProfile } = useEmployerAuth()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()

  const [listings, setListings] = useState([])
  const [listingsLoading, setListingsLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)
  const [activeTab, setActiveTab] = useState('listings')
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, closed: 0 })

  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState('')

  const handleTimeout = useCallback(async () => {
    await employerSignOut()
    navigate('/employer/login?timeout=1')
  }, [employerSignOut, navigate])

  useInactivityTimeout('employer', handleTimeout)

  useEffect(() => {
    if (!employerLoading && !employer) {
      navigate('/employer/login')
    }
  }, [employer, employerLoading, navigate])

  useEffect(() => {
    if (employerProfile) {
      fetchListings()
    }
  }, [employerProfile])

  async function fetchListings() {
    setListingsLoading(true)
    const { data } = await supabase
      .from('job_listings')
      .select(`
        id, job_title, job_type, labour_type, location, lga,
        status, created_at, approved_at,
        applications ( id )
      `)
      .eq('employer_id', employerProfile.id)
      .order('created_at', { ascending: false })

    if (data) {
      setListings(data)
      setStats({
        total: data.length,
        approved: data.filter(j => j.status === 'approved').length,
        pending: data.filter(j => j.status === 'pending').length,
        closed: data.filter(j => j.status === 'closed').length,
      })
    }
    setListingsLoading(false)
  }

  async function handleSignOut() {
    setSigningOut(true)
    clearActivity('employer')
    await employerSignOut()
    navigate('/')
  }

  async function handleCloseJob(jobId) {
    const { error } = await supabase
      .from('job_listings')
      .update({ status: 'closed' })
      .eq('id', jobId)
    if (!error) fetchListings()
  }

  async function handleLogoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setLogoError('Only JPG, PNG or WebP images are allowed.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Logo must be under 2MB.')
      return
    }
    setLogoError('')
    setLogoUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `employer_${employerProfile.id}_${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars').upload(fileName, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
      const { error: updateError } = await supabase
        .from('employers').update({ logo_url: urlData.publicUrl }).eq('id', employerProfile.id)
      if (updateError) throw updateError
      if (refreshEmployerProfile) await refreshEmployerProfile()
    } catch (err) {
      console.error(err)
      setLogoError('Logo upload failed. Please try again.')
    } finally {
      setLogoUploading(false)
    }
  }

  if (employerLoading) {
    return (
      <div style={styles.centred}>
        <p style={styles.loadingText}>Loading your dashboard...</p>
      </div>
    )
  }

  if (!employerProfile) {
    return (
      <div style={styles.centred}>
        <div style={styles.emptyCard}>
          <h2 style={styles.emptyTitle}>Profile not found</h2>
          <p style={styles.emptyText}>
            Your account exists but your employer profile could not be loaded.
            Please try logging out and back in.
          </p>
          <button onClick={handleSignOut} style={styles.btn}>Sign Out</button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* PAGE HEADER */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Employer Dashboard</h1>
            <p style={styles.pageSubtitle}>{APP_NAME} — {employerProfile.organization_name}</p>
          </div>
          <div style={styles.headerActions}>
            <Link to="/post-job" style={styles.postJobBtn}>+ Post a Job</Link>
            <button onClick={handleSignOut} disabled={signingOut} style={styles.signOutBtn}>
              {signingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>

        {/* STATS ROW */}
        <div style={styles.statsRow}>
          {[
            { label: 'Total Listings', value: stats.total },
            { label: 'Active', value: stats.approved },
            { label: 'Pending Review', value: stats.pending },
            { label: 'Closed', value: stats.closed },
          ].map(stat => (
            <div key={stat.label} style={styles.statCard}>
              <span style={styles.statValue}>{stat.value}</span>
              <span style={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(activeTab === 'listings' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('listings')}
          >
            My Listings
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab === 'profile' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('profile')}
          >
            Employer Details
          </button>
        </div>

        {/* LISTINGS TAB */}
        {activeTab === 'listings' && (
          <div>
            {listingsLoading ? (
              <p style={styles.loadingText}>Loading listings...</p>
            ) : listings.length === 0 ? (
              <div style={styles.emptyCard}>
                <p style={styles.emptyText}>You have not posted any jobs yet.</p>
                <Link to="/post-job" style={styles.btn}>Post Your First Job</Link>
              </div>
            ) : (
              <div style={styles.listingsList}>
                {listings.map(job => {
                  const appCount = job.applications?.length || 0
                  return (
                    <div key={job.id} style={styles.listingCard}>
                      <div style={styles.listingCardTop}>
                        <div style={styles.listingCardLeft}>
                          <h3 style={styles.listingTitle}>{job.job_title}</h3>
                          <p style={styles.listingMeta}>
                            {job.lga || job.location || 'Oke-Ogun'}
                            {job.job_type && ` · ${JOB_TYPE_LABELS[job.job_type] || job.job_type}`}
                            {job.labour_type && ` · ${job.labour_type.charAt(0).toUpperCase() + job.labour_type.slice(1)}`}
                          </p>
                          <p style={styles.listingDate}>
                            Posted {new Date(job.created_at).toLocaleDateString('en-GB', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div style={styles.listingCardRight}>
                          <span style={{
                            ...styles.statusPill,
                            ...(STATUS_STYLES[job.status] || STATUS_STYLES.pending)
                          }}>
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                          </span>
                          <span style={styles.appCountPill}>
                            {appCount} {appCount === 1 ? 'application' : 'applications'}
                          </span>
                        </div>
                      </div>

                      <div style={styles.listingActions}>
                        {appCount > 0 && (
                          <Link to={`/employer/applications/${job.id}`} style={styles.viewAppsBtn}>
                            View Applications
                          </Link>
                        )}
                        {job.status === 'approved' && (
                          <button onClick={() => handleCloseJob(job.id)} style={styles.closeJobBtn}>
                            Close Listing
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* EMPLOYER DETAILS TAB */}
        {activeTab === 'profile' && (
          <div style={styles.detailCard}>
            <div style={styles.logoRow}>
              <div style={styles.logoWrap}>
                {employerProfile.logo_url ? (
                  <img src={employerProfile.logo_url} alt="Logo" style={styles.logoImg} />
                ) : (
                  <div style={styles.logoInitial}>
                    {employerProfile.organization_name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <label style={styles.logoEditBtn} title={logoUploading ? 'Uploading...' : 'Upload logo'}>
                  {logoUploading ? '⏳' : '📷'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleLogoChange}
                    style={{ display: 'none' }}
                    disabled={logoUploading}
                  />
                </label>
              </div>
              <div>
                <p style={styles.logoHint}>Upload your organisation logo (JPG, PNG or WebP, max 2MB)</p>
                {logoError && <p style={styles.logoError}>{logoError}</p>}
              </div>
            </div>

            <h3 style={styles.detailCardTitle}>Employer Details</h3>
            <div style={styles.detailGrid}>
              <DetailRow label="Organisation" value={employerProfile.organization_name} />
              <DetailRow label="Contact Person" value={employerProfile.contact_person} />
              <DetailRow label="Phone" value={employerProfile.phone_number} />
              {employerProfile.email && <DetailRow label="Email" value={employerProfile.email} />}
              {employerProfile.lga && <DetailRow label="LGA" value={employerProfile.lga} />}
              {employerProfile.industry && <DetailRow label="Industry" value={employerProfile.industry} />}
              {employerProfile.description && <DetailRow label="About" value={employerProfile.description} />}
              <DetailRow
                label="Account Status"
                value={employerProfile.status === 'approved' ? 'Active' : 'Pending Review'}
              />
            </div>
            <p style={styles.detailNote}>
              To update your organisation details, contact us via WhatsApp.
            </p>
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
  row: { display: 'flex', flexDirection: 'column', marginBottom: '16px' },
  label: { fontSize: '12px', fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: '2px' },
  value: { fontSize: '14px', color: '#222' },
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f5f7f5', padding: '40px 24px' },
  centred: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f7f5', padding: '24px' },
  loadingText: { color: '#888', fontSize: '15px' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  pageTitle: { fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 'bold', color: '#1a6b3c', margin: 0 },
  pageSubtitle: { fontSize: '13px', color: '#888', marginTop: '2px' },
  headerActions: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' },
  postJobBtn: { padding: '9px 20px', backgroundColor: '#1a6b3c', color: '#fff', borderRadius: '8px', fontWeight: '700', fontSize: '14px', textDecoration: 'none' },
  signOutBtn: { padding: '8px 16px', backgroundColor: 'transparent', color: '#e53e3e', border: '1px solid #e53e3e', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '20px' },
  statCard: { backgroundColor: '#fff', borderRadius: '10px', padding: '16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  statValue: { fontSize: '28px', fontWeight: 'bold', color: '#1a6b3c' },
  statLabel: { fontSize: '12px', color: '#888', marginTop: '4px', textAlign: 'center' },
  tabs: { display: 'flex', gap: '4px', marginBottom: '16px', backgroundColor: '#fff', borderRadius: '10px', padding: '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', width: 'fit-content' },
  tab: { padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#888' },
  tabActive: { backgroundColor: '#1a6b3c', color: '#fff' },
  listingsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  listingCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  listingCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' },
  listingCardLeft: { flex: 1 },
  listingCardRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' },
  listingTitle: { fontSize: '16px', fontWeight: '700', color: '#222', margin: '0 0 4px 0' },
  listingMeta: { fontSize: '13px', color: '#666', margin: '0 0 4px 0' },
  listingDate: { fontSize: '12px', color: '#aaa', margin: 0 },
  statusPill: { fontSize: '12px', padding: '4px 12px', borderRadius: '12px', fontWeight: '600' },
  appCountPill: { fontSize: '12px', padding: '4px 12px', borderRadius: '12px', backgroundColor: '#f3f4f6', color: '#555', fontWeight: '600' },
  listingActions: { display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid #f0f0f0' },
  viewAppsBtn: { padding: '7px 16px', backgroundColor: '#1a6b3c', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none' },
  closeJobBtn: { padding: '7px 16px', backgroundColor: 'transparent', color: '#888', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  detailCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', maxWidth: '520px' },
  detailCardTitle: { fontSize: '15px', fontWeight: '700', color: '#1a6b3c', marginBottom: '20px', paddingBottom: '8px', borderBottom: '2px solid #e8f5ee' },
  detailGrid: {},
  detailNote: { fontSize: '13px', color: '#aaa', marginTop: '8px' },
  logoRow: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' },
  logoWrap: { position: 'relative', flexShrink: 0 },
  logoImg: { width: '72px', height: '72px', borderRadius: '12px', objectFit: 'cover', display: 'block', border: '1px solid #eee' },
  logoInitial: { width: '72px', height: '72px', borderRadius: '12px', backgroundColor: '#1a6b3c', color: '#fff', fontSize: '28px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoEditBtn: { position: 'absolute', bottom: '-4px', right: '-4px', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#fff', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' },
  logoHint: { fontSize: '13px', color: '#888', margin: 0 },
  logoError: { fontSize: '12px', color: '#e53e3e', marginTop: '4px' },
  emptyCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  emptyTitle: { fontSize: '18px', fontWeight: '700', color: '#222', marginBottom: '8px' },
  emptyText: { fontSize: '14px', color: '#888', marginBottom: '20px' },
  btn: { display: 'inline-block', padding: '12px 28px', backgroundColor: '#1a6b3c', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '14px', border: 'none', cursor: 'pointer' },
}
