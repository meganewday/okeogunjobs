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

const STATUS_STYLE = {
  pending:  { bg: '#fff8e1', text: '#b45309' },
  approved: { bg: '#dcfce7', text: '#166534' },
  rejected: { bg: '#fee2e2', text: '#b91c1c' },
  closed:   { bg: '#f3f4f6', text: '#6b7280' },
}

const JOB_TYPE_LABELS = {
  full_time: 'Full Time', part_time: 'Part Time',
  contract: 'Contract',  internship: 'Internship',
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.45} }
  .oj-tab {
    padding: 9px 22px; border-radius: 50px; border: none;
    background: transparent; cursor: pointer; font-size: 14px;
    font-weight: 600; color: #4b6358; font-family: 'Outfit', sans-serif;
    transition: all 0.15s;
  }
  .oj-tab:hover { background: #dcfce7; color: #16a34a; }
  .oj-tab-active { background: #16a34a !important; color: #fff !important; }
  .oj-listing-card {
    background: #fff; border-radius: 20px; padding: 24px;
    border: 1.5px solid #dcfce7;
    box-shadow: 0 2px 8px rgba(22,163,74,0.05);
    transition: transform 0.2s, box-shadow 0.2s;
    animation: fadeUp 0.4s ease both; opacity: 0;
  }
  .oj-listing-card:hover { transform: translateY(-3px); box-shadow: 0 8px 22px rgba(22,163,74,0.1); }
  .oj-detail-card {
    background: #fff; border-radius: 20px; padding: 28px;
    border: 1.5px solid #dcfce7;
    box-shadow: 0 2px 8px rgba(22,163,74,0.05);
    animation: fadeUp 0.4s ease both; opacity: 0;
  }
  .oj-btn-green {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 9px 20px; background: #16a34a; color: #fff;
    border-radius: 50px; font-size: 13px; font-weight: 700;
    text-decoration: none; border: none; cursor: pointer;
    font-family: 'Outfit', sans-serif;
    box-shadow: 0 3px 10px rgba(22,163,74,0.25);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .oj-btn-green:hover { transform: translateY(-1px); box-shadow: 0 5px 14px rgba(22,163,74,0.35); }
  .oj-btn-ghost {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 8px 18px; background: transparent; color: #4b6358;
    border: 1.5px solid #dcfce7; border-radius: 50px; font-size: 13px;
    font-weight: 600; cursor: pointer; font-family: 'Outfit', sans-serif;
    transition: all 0.15s;
  }
  .oj-btn-ghost:hover { background: #f0fdf4; border-color: #bbf7d0; }
  .oj-btn-danger {
    display: inline-flex; align-items: center;
    padding: 8px 16px; background: transparent; color: #dc2626;
    border: 1.5px solid #fca5a5; border-radius: 50px; font-size: 13px;
    font-weight: 600; cursor: pointer; font-family: 'Outfit', sans-serif;
    transition: all 0.15s;
  }
  .oj-btn-danger:hover { background: #fee2e2; }
`

function DetailRow({ label, value }) {
  if (!value) return null
  return (
    <div style={{ marginBottom: 14 }}>
      <span style={{ display:'block', fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:3 }}>{label}</span>
      <span style={{ fontSize:14, color:'#14532d', fontWeight:500 }}>{value}</span>
    </div>
  )
}

export default function EmployerDashboard() {
  const { employer, employerProfile, employerLoading, employerSignOut, refreshEmployerProfile } = useEmployerAuth()
  const navigate   = useNavigate()
  const isDesktop  = useIsDesktop()

  const [listings, setListings]           = useState([])
  const [listingsLoading, setListingsLoading] = useState(true)
  const [signingOut, setSigningOut]       = useState(false)
  const [activeTab, setActiveTab]         = useState('listings')
  const [stats, setStats]                 = useState({ total:0, approved:0, pending:0, closed:0 })
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError]         = useState('')

  const handleTimeout = useCallback(async () => {
    await employerSignOut()
    navigate('/employer/login?timeout=1')
  }, [employerSignOut, navigate])

  useInactivityTimeout('employer', handleTimeout)

  useEffect(() => {
    if (!employerLoading && !employer) navigate('/employer/login')
  }, [employer, employerLoading, navigate])

  useEffect(() => {
    if (employerProfile) fetchListings()
  }, [employerProfile])

  async function fetchListings() {
    setListingsLoading(true)
    const { data } = await supabase
      .from('job_listings')
      .select('id, job_title, job_type, labour_type, location, lga, status, created_at, approved_at, applications(id)')
      .eq('employer_id', employerProfile.id)
      .order('created_at', { ascending: false })
    if (data) {
      setListings(data)
      setStats({
        total:    data.length,
        approved: data.filter(j => j.status === 'approved').length,
        pending:  data.filter(j => j.status === 'pending').length,
        closed:   data.filter(j => j.status === 'closed').length,
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
      .from('job_listings').update({ status: 'closed' }).eq('id', jobId)
    if (!error) fetchListings()
  }

  async function handleLogoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
      setLogoError('Only JPG, PNG or WebP images are allowed.'); return
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Logo must be under 2MB.'); return
    }
    setLogoError(''); setLogoUploading(true)
    try {
      const ext      = file.name.split('.').pop()
      const fileName = `employer_${employerProfile.id}_${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('logos').upload(fileName, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from('logos').getPublicUrl(fileName)
      const { error: updateError } = await supabase
        .from('employers').update({ logo_url: urlData.publicUrl }).eq('id', employerProfile.id)
      if (updateError) throw updateError
      if (refreshEmployerProfile) await refreshEmployerProfile()
    } catch { setLogoError('Logo upload failed. Please try again.') }
    finally   { setLogoUploading(false) }
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (employerLoading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0fdf4', fontFamily:"'Outfit',sans-serif" }}>
        <style>{CSS}</style>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:48, height:48, borderRadius:'50%', border:'4px solid #dcfce7', borderTopColor:'#16a34a', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ color:'#4b6358', fontSize:15 }}>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // ── No profile state ──────────────────────────────────────────────────────
  if (!employerProfile) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0fdf4', padding:24, fontFamily:"'Outfit',sans-serif" }}>
        <style>{CSS}</style>
        <div style={{ background:'#fff', borderRadius:24, padding:'48px 36px', maxWidth:400, textAlign:'center', border:'1.5px solid #dcfce7' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🏢</div>
          <h2 style={{ fontSize:20, fontWeight:800, color:'#14532d', margin:'0 0 10px' }}>Profile not found</h2>
          <p style={{ fontSize:14, color:'#4b6358', margin:'0 0 24px', lineHeight:1.6 }}>
            Your account exists but your employer profile could not be loaded. Please try logging out and back in.
          </p>
          <button onClick={handleSignOut} className="oj-btn-green" style={{ width:'100%' }}>Sign Out</button>
        </div>
      </div>
    )
  }

  const STAT_CARDS = [
    { label:'Total Listings', value:stats.total,    color:'#14532d', bg:'#f0fdf4' },
    { label:'Active',         value:stats.approved, color:'#166534', bg:'#dcfce7' },
    { label:'Pending Review', value:stats.pending,  color:'#b45309', bg:'#fff8e1' },
    { label:'Closed',         value:stats.closed,   color:'#6b7280', bg:'#f3f4f6' },
  ]

  return (
    <div style={{ fontFamily:"'Outfit','Segoe UI',sans-serif", background:'#f0fdf4', minHeight:'100vh', padding:'0 0 60px' }}>
      <style>{CSS}</style>

      {/* ── PAGE HEADER ───────────────────────────────────────────────────── */}
      <section style={{ background:'linear-gradient(135deg,#14532d 0%,#166534 50%,#15803d 100%)', padding:'32px 24px 28px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.6)', margin:'0 0 4px', fontWeight:500 }}>{APP_NAME}</p>
            <h1 style={{ fontSize:'clamp(20px,3vw,28px)', fontWeight:900, color:'#fff', margin:0 }}>
              {employerProfile.organization_name}
            </h1>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <Link to="/post-job" className="oj-btn-green" style={{ background:'#fff', color:'#16a34a', boxShadow:'0 3px 10px rgba(0,0,0,0.1)' }}>
              + Post a Job
            </Link>
            <button onClick={handleSignOut} disabled={signingOut} className="oj-btn-danger"
              style={{ borderColor:'rgba(255,255,255,0.4)', color:'#fff' }}>
              {signingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </section>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 24px' }}>

        {/* ── STATS ROW ─────────────────────────────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:14, margin:'24px 0 20px', marginTop:-20 }}>
          {STAT_CARDS.map(s => (
            <div key={s.label} style={{ background:'#fff', borderRadius:18, padding:'20px 16px', textAlign:'center', border:'1.5px solid #dcfce7', boxShadow:'0 4px 14px rgba(22,163,74,0.07)' }}>
              <div style={{ fontSize:32, fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:12, color:'#9ca3af', marginTop:6, fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── TABS ──────────────────────────────────────────────────────── */}
        <div style={{ display:'flex', gap:6, margin:'0 0 20px', background:'#fff', borderRadius:50, padding:5, width:'fit-content', border:'1.5px solid #dcfce7' }}>
          <button className={`oj-tab${activeTab === 'listings' ? ' oj-tab-active' : ''}`}
            onClick={() => setActiveTab('listings')}>
            My Listings
          </button>
          <button className={`oj-tab${activeTab === 'profile' ? ' oj-tab-active' : ''}`}
            onClick={() => setActiveTab('profile')}>
            Employer Details
          </button>
        </div>

        {/* ── LISTINGS TAB ──────────────────────────────────────────────── */}
        {activeTab === 'listings' && (
          <div>
            {listingsLoading ? (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {[...Array(3)].map((_,i) => (
                  <div key={i} style={{ background:'#fff', borderRadius:20, height:100, animation:'pulse 1.4s ease-in-out infinite', border:'1.5px solid #dcfce7' }} />
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div style={{ background:'#fff', borderRadius:24, padding:'56px 24px', textAlign:'center', border:'1.5px dashed #bbf7d0' }}>
                <div style={{ fontSize:48, marginBottom:14 }}>📋</div>
                <p style={{ fontSize:17, fontWeight:800, color:'#14532d', margin:'0 0 8px' }}>No listings yet</p>
                <p style={{ fontSize:14, color:'#4b6358', margin:'0 0 24px' }}>You have not posted any jobs yet.</p>
                <Link to="/post-job" className="oj-btn-green">Post Your First Job</Link>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {listings.map((job, i) => {
                  const appCount = job.applications?.length || 0
                  const s = STATUS_STYLE[job.status] || STATUS_STYLE.pending
                  return (
                    <div key={job.id} className="oj-listing-card" style={{ animationDelay:`${i*0.05}s` }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12, marginBottom:14 }}>
                        <div style={{ flex:1 }}>
                          <h3 style={{ fontSize:17, fontWeight:800, color:'#14532d', margin:'0 0 5px' }}>{job.job_title}</h3>
                          <p style={{ fontSize:13, color:'#4b6358', margin:'0 0 4px', fontWeight:500 }}>
                            📍 {job.lga || job.location || 'Oke-Ogun'}
                            {job.job_type && ` · ${JOB_TYPE_LABELS[job.job_type] || job.job_type}`}
                            {job.labour_type && ` · ${job.labour_type.charAt(0).toUpperCase() + job.labour_type.slice(1)}`}
                          </p>
                          <p style={{ fontSize:12, color:'#9ca3af', margin:0 }}>
                            Posted {new Date(job.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                          </p>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                          <span style={{ fontSize:12, padding:'4px 12px', borderRadius:20, fontWeight:700, background:s.bg, color:s.text }}>
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                          </span>
                          <span style={{ fontSize:12, padding:'4px 12px', borderRadius:20, background:'#f0fdf4', color:'#166534', fontWeight:600, border:'1px solid #dcfce7' }}>
                            {appCount} {appCount === 1 ? 'application' : 'applications'}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display:'flex', gap:10, flexWrap:'wrap', paddingTop:14, borderTop:'1px solid #f0fdf4' }}>
                        {appCount > 0 && (
                          <Link to={`/employer/applications/${job.id}`} className="oj-btn-green" style={{ fontSize:13, padding:'8px 18px' }}>
                            View Applications
                          </Link>
                        )}
                        {job.status === 'approved' && (
                          <button onClick={() => handleCloseJob(job.id)} className="oj-btn-ghost" style={{ fontSize:13, padding:'8px 16px' }}>
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

        {/* ── PROFILE TAB ───────────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="oj-detail-card" style={{ maxWidth: isDesktop ? 560 : '100%' }}>

            {/* Logo section */}
            <div style={{ display:'flex', alignItems:'center', gap:18, marginBottom:24 }}>
              <div style={{ position:'relative', flexShrink:0 }}>
                {employerProfile.logo_url ? (
                  <img src={employerProfile.logo_url} alt="Logo"
                    style={{ width:72, height:72, borderRadius:14, objectFit:'contain', border:'1.5px solid #dcfce7', display:'block' }} />
                ) : (
                  <div style={{ width:72, height:72, borderRadius:14, background:'linear-gradient(135deg,#16a34a,#22c55e)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:900, color:'#fff' }}>
                    {employerProfile.organization_name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <label style={{ position:'absolute', bottom:-4, right:-4, width:26, height:26, borderRadius:'50%', background:'#fff', border:'1.5px solid #dcfce7', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:12, boxShadow:'0 2px 6px rgba(0,0,0,0.1)' }}
                  title={logoUploading ? 'Uploading...' : 'Upload logo'}>
                  {logoUploading ? '⏳' : '📷'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoChange} style={{ display:'none' }} disabled={logoUploading} />
                </label>
              </div>
              <div>
                <p style={{ fontSize:13, color:'#4b6358', margin:0, lineHeight:1.5 }}>
                  Upload your organisation logo (JPG, PNG or WebP, max 2MB)
                </p>
                {logoError && <p style={{ fontSize:12, color:'#dc2626', marginTop:4 }}>{logoError}</p>}
              </div>
            </div>

            <h3 style={{ fontSize:15, fontWeight:800, color:'#16a34a', margin:'0 0 20px', paddingBottom:10, borderBottom:'2px solid #dcfce7' }}>
              Employer Details
            </h3>

            <DetailRow label="Organisation"   value={employerProfile.organization_name} />
            <DetailRow label="Contact Person" value={employerProfile.contact_person} />
            <DetailRow label="Phone"          value={employerProfile.phone_number} />
            <DetailRow label="Email"          value={employerProfile.email} />
            <DetailRow label="LGA"            value={employerProfile.lga} />
            <DetailRow label="Industry"       value={employerProfile.industry} />
            <DetailRow label="About"          value={employerProfile.description} />
            <DetailRow label="Business Type"  value={employerProfile.business_type} />
            <DetailRow label="CAC Number"     value={employerProfile.cac_number} />
            <DetailRow label="Year Registered" value={employerProfile.year_registered} />
            <DetailRow
              label="Account Status"
              value={employerProfile.status === 'approved' ? '✓ Active' : '⏳ Pending Review'}
            />

            <p style={{ fontSize:13, color:'#9ca3af', marginTop:16, lineHeight:1.5 }}>
              To update your organisation details, contact us via WhatsApp.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
