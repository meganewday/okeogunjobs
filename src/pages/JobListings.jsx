import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { APP_NAME } from '../config/constants'
import { useAuth } from '../contexts/AuthContext'
import { Helmet } from 'react-helmet-async'
import JobAlertSubscribe from '../components/JobAlertSubscribe'

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
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
]

const LABOUR_TYPES = [
  { value: 'skilled', label: 'Skilled' },
  { value: 'unskilled', label: 'Unskilled' },
  { value: 'internship', label: 'Internship / IT / SIWES' },
]

function getSkillsMatch(profileSkills, jobSkillsRequired) {
  if (!jobSkillsRequired || jobSkillsRequired.length === 0) return null
  if (!profileSkills || profileSkills.length === 0) return { matched: 0, total: jobSkillsRequired.length }
  const matched = jobSkillsRequired.filter(id => profileSkills.includes(id)).length
  return { matched, total: jobSkillsRequired.length }
}

function getApplicationBlock(profile, job) {
  if (!profile) return null
  const seekerType = profile.seeker_type
  const labourType = job.labour_type
  if (!seekerType || !labourType) return null
  if (seekerType === 'student' && labourType === 'skilled')
    return 'This job is for skilled workers. Students can apply for internship or unskilled positions.'
  if (seekerType === 'unskilled' && labourType === 'skilled')
    return 'This job is for skilled workers. Update your profile if you have relevant skills.'
  return null
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.45} }
  select, input, textarea, button {
    font-family: 'Outfit', sans-serif;
  }
  select:focus, input:focus, textarea:focus {
    outline: none;
    border-color: #16a34a !important;
    box-shadow: 0 0 0 3px rgba(22,163,74,0.12) !important;
  }
  .oj-card {
    background: #fff;
    border-radius: 16px;
    padding: 24px;
    border: 1.5px solid #dcfce7;
    box-shadow: 0 2px 8px rgba(22,163,74,0.05);
    transition: transform 0.2s, box-shadow 0.2s;
    animation: fadeUp 0.4s ease both;
    opacity: 0;
  }
  .oj-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 22px rgba(22,163,74,0.1);
  }
  .oj-btn {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 9px 20px; border-radius: 50px; font-size: 13px;
    font-weight: 700; cursor: pointer; text-decoration: none;
    border: none; transition: all 0.15s; font-family: 'Outfit', sans-serif;
    white-space: nowrap;
  }
  .oj-btn-green  { background: #16a34a; color: #fff; box-shadow: 0 3px 10px rgba(22,163,74,0.28); }
  .oj-btn-green:hover  { background: #15803d; box-shadow: 0 5px 14px rgba(22,163,74,0.38); }
  .oj-btn-wa     { background: #25D366; color: #fff; }
  .oj-btn-wa:hover     { background: #1ebe5c; }
  .oj-btn-ghost  { background: #f0fdf4; color: #16a34a; border: 1.5px solid #bbf7d0; }
  .oj-btn-ghost:hover  { background: #dcfce7; }
  .oj-btn-cancel { background: transparent; color: #888; border: 1px solid #ddd; }
  .oj-btn-cancel:hover { background: #f5f5f5; }
  .oj-select {
    width: 100%; padding: 9px 32px 9px 12px; border: 1.5px solid #dcfce7;
    border-radius: 10px; background: #f0fdf4; color: #14532d; font-size: 13px;
    cursor: pointer; appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2316a34a' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 10px center;
    transition: border 0.15s;
  }
`

function Skeleton() {
  return (
    <div style={{ background:'#fff', borderRadius:16, padding:24, border:'1.5px solid #dcfce7', animation:'pulse 1.4s ease-in-out infinite' }}>
      <div style={{ height:18, background:'#dcfce7', borderRadius:8, width:'50%', marginBottom:12 }} />
      <div style={{ height:13, background:'#f0fdf4', borderRadius:8, width:'35%', marginBottom:16 }} />
      <div style={{ display:'flex', gap:8 }}>
        <div style={{ height:24, background:'#f0fdf4', borderRadius:20, width:70 }} />
        <div style={{ height:24, background:'#f0fdf4', borderRadius:20, width:80 }} />
      </div>
    </div>
  )
}

export default function JobListings() {
  const { user, profile } = useAuth()
  const [jobs, setJobs]       = useState([])
  const [skills, setSkills]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ lga: '', job_type: '', skill: '', labour_type: '' })
  const [appliedIds, setAppliedIds]   = useState(new Set())
  const [applying, setApplying]       = useState(null)
  const [coverNote, setCoverNote]     = useState('')
  const [applySuccess, setApplySuccess] = useState(null)
  const [applyError, setApplyError]   = useState('')
  const isDesktop = useIsDesktop()

  useEffect(() => { fetchSkills(); fetchJobs() }, [])
  useEffect(() => { if (profile) fetchExistingApplications() }, [profile])

  async function fetchSkills() {
    const { data } = await supabase.from('skills').select('*').order('category')
    if (data) setSkills(data)
  }

  async function fetchJobs() {
    setLoading(true)
    const { data } = await supabase
      .from('job_listings')
      .select('*, employers(organization_name, phone_number, logo_url)')
      .eq('status', 'approved')
      .order('approved_at', { ascending: false })
    if (data) setJobs(data)
    setLoading(false)
  }

  async function fetchExistingApplications() {
    const { data } = await supabase
      .from('applications')
      .select('job_listing_id')
      .eq('job_seeker_id', profile.id)
    if (data) setAppliedIds(new Set(data.map(a => a.job_listing_id)))
  }

  async function submitApplication(job) {
    if (!profile) return
    setApplyError('')
    try {
      const { error } = await supabase.from('applications').insert({
        job_listing_id: job.id,
        job_seeker_id: profile.id,
        cover_note: coverNote.trim() || null,
        status: 'submitted',
      })
      if (error) throw error
      setAppliedIds(prev => new Set([...prev, job.id]))
      setApplySuccess(job.id)
      setApplying(null)
      setCoverNote('')
      setTimeout(() => setApplySuccess(null), 4000)
    } catch {
      setApplyError('Something went wrong. Please try again.')
    }
  }

  function handleFilter(e) {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  function clearFilters() {
    setFilters({ lga: '', job_type: '', skill: '', labour_type: '' })
  }

  function getSkillName(id) {
    return skills.find(s => s.id === id)?.name || null
  }

  function buildWhatsAppLink(job) {
    const phone = job.employers?.phone_number?.replace(/\D/g, '')
    if (!phone) return null
    const intl = phone.startsWith('0') ? '234' + phone.slice(1) : phone
    const msg  = encodeURIComponent(
      `Hello, I am interested in the ${job.job_title} position listed on ${APP_NAME}. Please let me know how to apply.`
    )
    return `https://wa.me/${intl}?text=${msg}`
  }

  const filteredJobs = jobs.filter(job => {
    if (filters.lga && job.lga !== filters.lga) return false
    if (filters.job_type && job.job_type !== filters.job_type) return false
    if (filters.labour_type && job.labour_type !== filters.labour_type) return false
    if (filters.skill && (!job.skills_required || !job.skills_required.includes(filters.skill))) return false
    return true
  })

  const grouped = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = []
    acc[skill.category].push(skill)
    return acc
  }, {})

  const hasFilters = filters.lga || filters.job_type || filters.skill || filters.labour_type

  const labelStyle = { display:'block', fontSize:12, fontWeight:700, color:'#166534', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:7 }

  return (
    <div style={{ fontFamily:"'Outfit','Segoe UI',sans-serif", background:'#f0fdf4', minHeight:'100vh' }}>
      <Helmet>
        <title>Browse Jobs in Oke-Ogun | OkeOgunJobs</title>
        <meta name="description" content="Browse verified job listings across Saki, Iseyin, Itesiwaju, Kajola and all 10 LGAs of the Oke-Ogun zone. Filter by skill, location, and job type." />
        <link rel="canonical" href="https://okeogunjobs.com/jobs" />
      </Helmet>

      <style>{CSS}</style>

      {/* Page header */}
      <section style={{ background:'linear-gradient(135deg,#f0fdf4 0%,#dcfce7 60%,#bbf7d0 100%)', padding:'48px 24px 36px', borderBottom:'1.5px solid #bbf7d0' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ display:'inline-block', background:'#fff', color:'#16a34a', borderRadius:50, padding:'5px 16px', fontSize:13, fontWeight:700, marginBottom:14, border:'1.5px solid #bbf7d0' }}>
            📋 Verified Listings
          </div>
          <h1 style={{ fontSize:'clamp(26px,4vw,40px)', fontWeight:900, color:'#14532d', margin:'0 0 10px' }}>Job Listings</h1>
          <p style={{ fontSize:15, color:'#166534', margin:0, maxWidth:500, lineHeight:1.6 }}>
            Browse verified job opportunities across the Oke-Ogun region.
          </p>
        </div>
      </section>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'28px 24px 60px', display:'flex', flexDirection: isDesktop ? 'row' : 'column', gap:24, alignItems:'flex-start' }}>

        {/* SIDEBAR */}
        <div style={{ width: isDesktop ? 268 : '100%', flexShrink:0 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:20, border:'1.5px solid #dcfce7', boxShadow:'0 2px 8px rgba(22,163,74,0.05)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ fontSize:15, fontWeight:800, color:'#14532d', margin:0 }}>Filter Jobs</h3>
              {hasFilters && (
                <button onClick={clearFilters} style={{ fontSize:12, color:'#16a34a', border:'none', background:'none', cursor:'pointer', fontWeight:700, textDecoration:'underline', padding:0, fontFamily:"'Outfit',sans-serif" }}>
                  Clear all
                </button>
              )}
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <div>
                <label style={labelStyle}>Local Government Area</label>
                <select className="oj-select" name="lga" value={filters.lga} onChange={handleFilter}>
                  <option value="">All LGAs</option>
                  {LGAs.map(lga => <option key={lga} value={lga}>{lga}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Job Type</label>
                <select className="oj-select" name="job_type" value={filters.job_type} onChange={handleFilter}>
                  <option value="">All Types</option>
                  {JOB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Position Type</label>
                <select className="oj-select" name="labour_type" value={filters.labour_type} onChange={handleFilter}>
                  <option value="">All Positions</option>
                  {LABOUR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Skill</label>
                <select className="oj-select" name="skill" value={filters.skill} onChange={handleFilter}>
                  <option value="">All Skills</option>
                  {Object.entries(grouped).map(([category, catSkills]) => (
                    <optgroup key={category} label={category}>
                      {catSkills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>

            <p style={{ fontSize:13, color:'#888', marginTop:16, marginBottom:0 }}>
              {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} found
            </p>
          </div>

          {!user && (
            <div style={{ background:'#fff', borderRadius:16, padding:16, marginTop:12, border:'1.5px solid #dcfce7' }}>
              <p style={{ fontSize:13, color:'#4b6358', lineHeight:1.6, margin:0 }}>
                <Link to="/signup" style={{ color:'#16a34a', fontWeight:700, textDecoration:'none' }}>Create an account</Link>
                {' '}to apply for jobs directly on the platform.
              </p>
            </div>
          )}
        </div>

    <JobAlertSubscribe /> 
        {/* JOB CARDS */}
        <div style={{ flex:1, width:'100%' }}>
          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {[...Array(4)].map((_,i) => <Skeleton key={i} />)}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div style={{ background:'#fff', borderRadius:20, padding:'48px 24px', textAlign:'center', border:'1.5px dashed #bbf7d0' }}>
              <div style={{ fontSize:44, marginBottom:14 }}>🔍</div>
              <p style={{ fontSize:17, fontWeight:800, color:'#14532d', margin:'0 0 8px' }}>No jobs found</p>
              <p style={{ fontSize:14, color:'#4b6358', margin:'0 0 20px' }}>Try adjusting your filters or check back later.</p>
              {hasFilters && (
                <button onClick={clearFilters} className="oj-btn oj-btn-green">Clear Filters</button>
              )}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {filteredJobs.map((job, i) => {
                const whatsappLink = buildWhatsAppLink(job)
                const hasApplied   = appliedIds.has(job.id)
                const isApplying   = applying === job.id
                const justApplied  = applySuccess === job.id
                const matchScore   = profile ? getSkillsMatch(profile.skills, job.skills_required) : null
                const blockReason  = profile ? getApplicationBlock(profile, job) : null
                const logoUrl      = job.employers?.logo_url

                const labourColor = {
                  internship: { bg:'#fce7f3', text:'#9d174d' },
                  unskilled:  { bg:'#fef9c3', text:'#854d0e' },
                  skilled:    { bg:'#dbeafe', text:'#1e40af' },
                }[job.labour_type] || { bg:'#dcfce7', text:'#166534' }

                return (
                  <div key={job.id} className="oj-card" style={{ animationDelay:`${i*0.05}s` }}>
                    {/* Card top */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, gap:12 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
                        {logoUrl && (
                          <img src={logoUrl} alt={job.employers?.organization_name} style={{ width:40, height:40, borderRadius:10, objectFit:'contain', border:'1.5px solid #dcfce7', flexShrink:0 }}
                            onError={e => { e.target.style.display = 'none' }} />
                        )}
                        <div>
                          <h2 style={{ fontSize:17, fontWeight:800, color:'#14532d', margin:'0 0 3px' }}>{job.job_title}</h2>
                          <p style={{ fontSize:13, color:'#15803d', margin:0, fontWeight:500 }}>{job.employers?.organization_name}</p>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:6, flexShrink:0, flexWrap:'wrap', justifyContent:'flex-end' }}>
                        {job.labour_type && (
                          <span style={{ padding:'4px 10px', borderRadius:20, fontSize:12, fontWeight:700, background:labourColor.bg, color:labourColor.text, whiteSpace:'nowrap' }}>
                            {job.labour_type === 'internship' ? 'Internship' : job.labour_type === 'unskilled' ? 'Unskilled' : 'Skilled'}
                          </span>
                        )}
                        <span style={{ padding:'4px 12px', background:'#dcfce7', color:'#166634', borderRadius:20, fontSize:12, fontWeight:700, whiteSpace:'nowrap', textTransform:'capitalize' }}>
                          {job.job_type?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Meta tags */}
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
                      {job.location && <span style={{ fontSize:12, color:'#4b6358', background:'#f0fdf4', padding:'4px 10px', borderRadius:20, border:'1px solid #dcfce7' }}>📍 {job.location}</span>}
                      {job.lga      && <span style={{ fontSize:12, color:'#4b6358', background:'#f0fdf4', padding:'4px 10px', borderRadius:20, border:'1px solid #dcfce7' }}>🏛 {job.lga}</span>}
                      <span style={{ fontSize:12, color:'#4b6358', background:'#f0fdf4', padding:'4px 10px', borderRadius:20, border:'1px solid #dcfce7' }}>
                        📱 {job.application_method === 'whatsapp' ? 'WhatsApp' : 'Phone'}
                      </span>
                    </div>

                    {/* Description */}
                    <p style={{ fontSize:14, color:'#444', lineHeight:1.7, marginBottom:12 }}>{job.job_description}</p>

                    {/* Skills chips */}
                    {job.skills_required && job.skills_required.length > 0 && (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
                        {job.skills_required.map(skillId => {
                          const name    = getSkillName(skillId)
                          const isMatch = profile?.skills?.includes(skillId)
                          return name ? (
                            <span key={skillId} style={{ fontSize:12, padding:'4px 10px', borderRadius:20, border:'1px solid', fontWeight: isMatch ? 700 : 500, background: isMatch ? '#16a34a' : '#f0fdf4', color: isMatch ? '#fff' : '#166534', borderColor: isMatch ? '#16a34a' : '#bbf7d0' }}
                              title={isMatch ? 'You have this skill' : undefined}>
                              {isMatch && '✓ '}{name}
                            </span>
                          ) : null
                        })}
                      </div>
                    )}

                    {/* Skills match bar */}
                    {matchScore && (
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                        <div style={{ flex:1, height:6, background:'#e8f5ee', borderRadius:3, overflow:'hidden', maxWidth:120 }}>
                          <div style={{ height:'100%', borderRadius:3, transition:'width 0.3s', width:`${Math.round((matchScore.matched / matchScore.total) * 100)}%`, background: matchScore.matched === matchScore.total ? '#16a34a' : matchScore.matched > 0 ? '#f6a623' : '#ddd' }} />
                        </div>
                        <span style={{ fontSize:12, color:'#4b6358', whiteSpace:'nowrap' }}>
                          {matchScore.matched === matchScore.total
                            ? `All ${matchScore.total} skills match`
                            : matchScore.matched === 0
                            ? `0 of ${matchScore.total} skills match`
                            : `${matchScore.matched} of ${matchScore.total} skills match`}
                        </span>
                      </div>
                    )}

                    {/* Cover note box */}
                    {isApplying && (
                      <div style={{ background:'#f0fdf4', borderRadius:12, padding:16, marginBottom:16, border:'1.5px solid #bbf7d0' }}>
                        <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#14532d', marginBottom:8 }}>
                          Add a short message to the employer (optional)
                        </label>
                        <textarea
                          style={{ width:'100%', padding:'10px 12px', fontSize:13, border:'1.5px solid #bbf7d0', borderRadius:10, boxSizing:'border-box', resize:'vertical', fontFamily:"'Outfit',sans-serif", background:'#fff', color:'#14532d', lineHeight:1.6 }}
                          rows={3}
                          placeholder="e.g. I have 3 years of experience in this field and I am available immediately."
                          value={coverNote}
                          onChange={e => setCoverNote(e.target.value)}
                          maxLength={300}
                        />
                        <p style={{ fontSize:11, color:'#aaa', textAlign:'right', margin:'4px 0 0' }}>{coverNote.length}/300</p>
                        {applyError && <p style={{ color:'#dc2626', fontSize:12, marginTop:6 }}>{applyError}</p>}
                        <div style={{ display:'flex', gap:10, marginTop:12 }}>
                          <button onClick={() => submitApplication(job)} className="oj-btn oj-btn-green">Submit Application</button>
                          <button onClick={() => { setApplying(null); setCoverNote(''); setApplyError('') }} className="oj-btn oj-btn-cancel">Cancel</button>
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid #f0fdf4', paddingTop:14, flexWrap:'wrap', gap:8 }}>
                      <p style={{ fontSize:12, color:'#aaa', margin:0 }}>
                        Posted {new Date(job.approved_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                      </p>
                      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                        {whatsappLink && (
                          <a href={whatsappLink} target="_blank" rel="noreferrer" className="oj-btn oj-btn-wa">
                            WhatsApp
                          </a>
                        )}

                        {user && profile && (
                          hasApplied ? (
                            <span style={{ padding:'9px 16px', background:'#dcfce7', color:'#166534', borderRadius:50, fontSize:13, fontWeight:700 }}>
                              {justApplied ? '✓ Application Sent' : '✓ Applied'}
                            </span>
                          ) : blockReason ? (
                            <span style={{ padding:'9px 14px', background:'#fef9c3', color:'#854d0e', borderRadius:50, fontSize:13, fontWeight:600, cursor:'default' }} title={blockReason}>
                              Not eligible
                            </span>
                          ) : !isApplying ? (
                            <button onClick={() => { setApplying(job.id); setApplyError('') }} className="oj-btn oj-btn-green">
                              Apply Now
                            </button>
                          ) : null
                        )}

                        {user && !profile && (
                          <Link to="/register" className="oj-btn oj-btn-green">Complete Profile to Apply</Link>
                        )}

                        {!user && (
                          <Link to="/signup" className="oj-btn oj-btn-ghost">Sign Up to Apply</Link>
                        )}
                      </div>
                    </div>

                    {blockReason && user && profile && !hasApplied && (
                      <p style={{ fontSize:12, color:'#854d0e', background:'#fef9c3', borderRadius:10, padding:'8px 12px', marginTop:10, lineHeight:1.5 }}>
                        {blockReason}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
