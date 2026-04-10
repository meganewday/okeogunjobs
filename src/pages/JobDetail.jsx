import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { APP_NAME } from '../config/constants'
import {
  MapPin, Briefcase, Clock, Users, ChevronLeft, Share2,
  Copy, Check, Link2, MessageCircle,
  CheckCircle, XCircle, Building2, Calendar
} from 'lucide-react'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.45} }
  .jd-fade { animation: fadeUp 0.4s ease both; }
  .jd-btn-primary {
    display:inline-flex; align-items:center; justify-content:center; gap:8px;
    padding:12px 28px; background:#16a34a; color:#fff;
    border-radius:50px; font-weight:700; font-size:15px; text-decoration:none;
    border:none; cursor:pointer; font-family:'Outfit',sans-serif;
    box-shadow:0 4px 14px rgba(22,163,74,0.3);
    transition:transform 0.15s,box-shadow 0.15s;
  }
  .jd-btn-primary:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(22,163,74,0.4); }
  .jd-btn-ghost {
    display:inline-flex; align-items:center; justify-content:center; gap:8px;
    padding:10px 22px; background:#f0fdf4; color:#16a34a;
    border:1.5px solid #bbf7d0; border-radius:50px;
    font-weight:700; font-size:14px; text-decoration:none;
    cursor:pointer; font-family:'Outfit',sans-serif;
    transition:all 0.15s;
  }
  .jd-btn-ghost:hover { background:#dcfce7; }
  .jd-share-btn {
    display:inline-flex; align-items:center; justify-content:center; gap:6px;
    padding:8px 16px; border-radius:50px; font-size:13px; font-weight:600;
    cursor:pointer; border:1.5px solid #dcfce7; background:#fff;
    color:#444; font-family:'Outfit',sans-serif; transition:all 0.15s;
    white-space:nowrap;
  }
  .jd-share-btn:hover { transform:translateY(-1px); box-shadow:0 3px 10px rgba(0,0,0,0.08); }
`

const JOB_TYPE_LABELS = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  internship: 'Internship',
}

const LABOUR_TYPE_COLORS = {
  skilled:    { bg: '#dbeafe', color: '#1e40af' },
  unskilled:  { bg: '#fef9c3', color: '#854d0e' },
  internship: { bg: '#fce7f3', color: '#9d174d' },
}

function SkeletonDetail() {
  return (
    <div style={{ animation: 'pulse 1.4s ease-in-out infinite' }}>
      <div style={{ height: 32, background: '#dcfce7', borderRadius: 8, width: '60%', marginBottom: 16 }} />
      <div style={{ height: 18, background: '#f0fdf4', borderRadius: 8, width: '40%', marginBottom: 32 }} />
      <div style={{ height: 14, background: '#f0fdf4', borderRadius: 8, width: '100%', marginBottom: 10 }} />
      <div style={{ height: 14, background: '#f0fdf4', borderRadius: 8, width: '90%', marginBottom: 10 }} />
      <div style={{ height: 14, background: '#f0fdf4', borderRadius: 8, width: '80%' }} />
    </div>
  )
}

export default function JobDetail() {
  const { jobId } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)
  const [applying, setApplying] = useState(false)
  const [coverNote, setCoverNote] = useState('')
  const [applySuccess, setApplySuccess] = useState(false)
  const [applyError, setApplyError] = useState('')
  const [hasApplied, setHasApplied] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)

  const pageUrl = `https://okeogunjobs.com/jobs/${jobId}`

  useEffect(() => {
    fetchJob()
  }, [jobId])

  useEffect(() => {
    if (profile && job) checkExistingApplication()
  }, [profile, job])

  async function fetchJob() {
    setLoading(true)
    const { data } = await supabase
      .from('job_listings')
      .select('*')
      .eq('id', jobId)
      .eq('status', 'approved')
      .single()

    if (!data) {
      setNotFound(true)
      setLoading(false)
      return
    }

    // Fetch employer data separately
    if (data.employer_id) {
      try {
        const { data: employerData } = await supabase
          .from('employers')
          .select('organization_name, phone_number, whatsapp_number, logo_url, lga')
          .eq('id', data.employer_id)
          .maybeSingle()
        
        if (employerData) {
          data.employers = employerData
        }
      } catch (err) {
        console.error('Error fetching employer:', err)
      }
    }

    setJob(data)

    if (data.skills_required?.length > 0) {
      const { data: skillsData } = await supabase
        .from('skills')
        .select('id, name, category')
        .in('id', data.skills_required)
      if (skillsData) setSkills(skillsData)
    }

    setLoading(false)
  }

  async function checkExistingApplication() {
    const { data } = await supabase
      .from('applications')
      .select('id')
      .eq('job_listing_id', jobId)
      .eq('job_seeker_id', profile.id)
      .single()
    if (data) setHasApplied(true)
  }

  async function submitApplication() {
    if (!profile) return
    setApplyError('')
    try {
      const { error } = await supabase.from('applications').insert({
        job_listing_id: jobId,
        job_seeker_id: profile.id,
        cover_note: coverNote.trim() || null,
        status: 'submitted',
      })
      if (error) throw error
      setApplySuccess(true)
      setHasApplied(true)
      setApplying(false)
      setCoverNote('')
    } catch {
      setApplyError('Something went wrong. Please try again.')
    }
  }

  function buildWhatsAppLink() {
    const phone = job?.employers?.whatsapp_number || job?.employers?.phone_number
    if (!phone) return null
    const cleaned = phone.replace(/\D/g, '')
    const intl = cleaned.startsWith('0') ? '234' + cleaned.slice(1) : cleaned
    const msg = encodeURIComponent(
      `Hello, I am interested in the ${job.job_title} position listed on ${APP_NAME}. Please let me know how to apply. ${pageUrl}`
    )
    return `https://wa.me/${intl}?text=${msg}`
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // fallback
      const el = document.createElement('input')
      el.value = pageUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  function shareToWhatsApp() {
    const text = encodeURIComponent(`${job.job_title} at ${job.employers?.organization_name} — Apply on OkeOgunJobs:\n${pageUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  function shareToFacebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`, '_blank')
  }

  function shareToTwitter() {
    const text = encodeURIComponent(`${job.job_title} at ${job.employers?.organization_name} — Apply on OkeOgunJobs`)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(pageUrl)}`, '_blank')
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${job.job_title} — OkeOgunJobs`,
          text: `${job.job_title} at ${job.employers?.organization_name}. Apply on OkeOgunJobs.`,
          url: pageUrl,
        })
      } catch {}
    } else {
      setShowShareMenu(prev => !prev)
    }
  }

  // JSON-LD schema for Google for Jobs
  function buildJobSchema() {
    if (!job) return null
    return {
      '@context': 'https://schema.org/',
      '@type': 'JobPosting',
      title: job.job_title,
      description: job.job_description,
      datePosted: job.approved_at,
      employmentType: job.job_type === 'full_time' ? 'FULL_TIME'
        : job.job_type === 'part_time' ? 'PART_TIME'
        : job.job_type === 'contract' ? 'CONTRACTOR'
        : 'INTERN',
      hiringOrganization: {
        '@type': 'Organization',
        name: job.employers?.organization_name || 'OkeOgunJobs Employer',
        sameAs: 'https://okeogunjobs.com',
      },
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: job.location || job.lga || 'Oke-Ogun',
          addressRegion: 'Oyo State',
          addressCountry: 'NG',
        },
      },
      jobLocationType: 'TELECOMMUTE',
      applicantLocationRequirements: {
        '@type': 'Country',
        name: 'Nigeria',
      },
    }
  }

  if (loading) {
    return (
      <div style={{ fontFamily: "'Outfit','Segoe UI',sans-serif", background: '#f0fdf4', minHeight: '100vh' }}>
        <style>{CSS}</style>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>
          <SkeletonDetail />
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div style={{ fontFamily: "'Outfit','Segoe UI',sans-serif", background: '#f0fdf4', minHeight: '100vh' }}>
        <style>{CSS}</style>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <XCircle size={48} color="#dc2626" style={{ marginBottom: 16 }} />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#14532d', marginBottom: 8 }}>Job not found</h1>
          <p style={{ color: '#888', marginBottom: 24 }}>This listing may have been removed or is no longer available.</p>
          <Link to="/jobs" className="jd-btn-primary">Browse All Jobs</Link>
        </div>
      </div>
    )
  }

  const labourStyle = LABOUR_TYPE_COLORS[job.labour_type] || { bg: '#dcfce7', color: '#166534' }
  const waLink = buildWhatsAppLink()
  const schema = buildJobSchema()

  return (
    <div style={{ fontFamily: "'Outfit','Segoe UI',sans-serif", background: '#f0fdf4', minHeight: '100vh' }}>
      <style>{CSS}</style>

      <Helmet>
        <title>{`${job.job_title} at ${job.employers?.organization_name} | OkeOgunJobs`}</title>
        <meta name="description" content={`${job.job_title} — ${job.job_type?.replace('_', ' ')} position in ${job.lga || job.location || 'Oke-Ogun'}. Apply on OkeOgunJobs.`} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={`${job.job_title} at ${job.employers?.organization_name} | OkeOgunJobs`} />
        <meta property="og:description" content={`${job.job_type?.replace('_', ' ')} position in ${job.lga || job.location || 'Oke-Ogun'}. ${job.job_description?.slice(0, 120)}...`} />
        <meta property="og:image" content="https://okeogunjobs.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${job.job_title} at ${job.employers?.organization_name}`} />
        <meta name="twitter:description" content={`Apply for this ${job.job_type?.replace('_', ' ')} job in ${job.lga || 'Oke-Ogun'} on OkeOgunJobs.`} />
        {schema && (
          <script type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        )}
      </Helmet>

      {/* PAGE HEADER */}
      <section style={{ background: 'linear-gradient(135deg,#14532d 0%,#166534 45%,#15803d 100%)', padding: '36px 24px 32px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <Link to="/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
            <ChevronLeft size={16} /> Back to Jobs
          </Link>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: 1 }}>
              {/* Employer logo + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                {job.employers?.logo_url ? (
                  <img src={job.employers.logo_url} alt={job.employers.organization_name}
                    style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'contain', background: '#fff', padding: 4, flexShrink: 0 }}
                    onError={e => { e.target.style.display = 'none' }} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Building2 size={22} color="rgba(255,255,255,0.8)" />
                  </div>
                )}
                <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                  {job.employers?.organization_name}
                </span>
              </div>

              <h1 style={{ fontSize: 'clamp(22px,4vw,36px)', fontWeight: 900, color: '#fff', margin: '0 0 14px', lineHeight: 1.2 }}>
                {job.job_title}
              </h1>

              {/* Meta pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(job.location || job.lga) && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 50, padding: '5px 12px', fontSize: 13, fontWeight: 500 }}>
                    <MapPin size={13} /> {job.location || job.lga}
                  </span>
                )}
                {job.lga && job.location && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 50, padding: '5px 12px', fontSize: 13, fontWeight: 500 }}>
                    <MapPin size={13} /> {job.lga}
                  </span>
                )}
                {job.job_type && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 50, padding: '5px 12px', fontSize: 13, fontWeight: 500 }}>
                    <Briefcase size={13} /> {JOB_TYPE_LABELS[job.job_type] || job.job_type}
                  </span>
                )}
                {job.labour_type && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: labourStyle.bg, color: labourStyle.color, borderRadius: 50, padding: '5px 12px', fontSize: 13, fontWeight: 700 }}>
                    <Users size={13} />
                    {job.labour_type === 'internship' ? 'Internship' : job.labour_type === 'unskilled' ? 'Unskilled' : 'Skilled'}
                  </span>
                )}
                {job.approved_at && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 50, padding: '5px 12px', fontSize: 13, fontWeight: 500 }}>
                    <Calendar size={13} /> Posted {new Date(job.approved_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 24px 60px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* SHARE BAR */}
        <div className="jd-fade" style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', border: '1.5px solid #dcfce7', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#14532d', marginRight: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Share2 size={15} color="#16a34a" /> Share this job
          </span>

          {/* WhatsApp share */}
          <button onClick={shareToWhatsApp} className="jd-share-btn" style={{ color: '#25D366', borderColor: '#b7f5d0' }}>
            <MessageCircle size={15} /> WhatsApp
          </button>

          {/* Facebook */}
          <button onClick={shareToFacebook} className="jd-share-btn" style={{ color: '#1877f2', borderColor: '#bfdbfe' }}>
            <Share2 size={15} /> Facebook
          </button>

          {/* Twitter/X */}
          <button onClick={shareToTwitter} className="jd-share-btn" style={{ color: '#000', borderColor: '#e5e7eb' }}>
            <Share2 size={15} /> Twitter
          </button>

          {/* Copy link */}
          <button onClick={copyLink} className="jd-share-btn" style={{ color: copied ? '#16a34a' : '#555', borderColor: copied ? '#bbf7d0' : '#dcfce7', background: copied ? '#f0fdf4' : '#fff' }}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>

          {/* Native share (mobile) */}
          {typeof navigator !== 'undefined' && navigator.share && (
            <button onClick={nativeShare} className="jd-share-btn">
              <Link2 size={15} /> More
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>

          {/* LEFT — main content */}
          <div style={{ flex: '1 1 480px' }}>

            {/* Job Description */}
            <div className="jd-fade" style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1.5px solid #dcfce7', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#14532d', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Briefcase size={17} color="#16a34a" /> Job Description
              </h2>
              <p style={{ fontSize: 15, color: '#444', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>
                {job.job_description}
              </p>
            </div>

            {/* Skills Required */}
            {skills.length > 0 && (
              <div className="jd-fade" style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1.5px solid #dcfce7', marginBottom: 20 }}>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: '#14532d', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={17} color="#16a34a" /> Skills Required
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {skills.map(skill => {
                    const isMatch = profile?.skills?.includes(skill.id)
                    return (
                      <span key={skill.id} style={{
                        padding: '6px 14px', borderRadius: 50, fontSize: 13, fontWeight: isMatch ? 700 : 500,
                        background: isMatch ? '#16a34a' : '#f0fdf4',
                        color: isMatch ? '#fff' : '#166534',
                        border: `1px solid ${isMatch ? '#16a34a' : '#bbf7d0'}`,
                      }}>
                        {isMatch && <Check size={11} style={{ marginRight: 4, display: 'inline' }} />}
                        {skill.name}
                      </span>
                    )
                  })}
                </div>
                {profile && (
                  <p style={{ fontSize: 12, color: '#888', margin: '12px 0 0' }}>
                    Green skills match your profile.
                  </p>
                )}
              </div>
            )}

            {/* Apply Section */}
            <div className="jd-fade" style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1.5px solid #dcfce7' }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#14532d', margin: '0 0 6px' }}>Apply for this Job</h2>
              <p style={{ fontSize: 13, color: '#888', margin: '0 0 18px' }}>
                Application method: <strong style={{ color: '#14532d', textTransform: 'capitalize' }}>{job.application_method === 'whatsapp' ? 'WhatsApp' : job.application_method === 'phone' ? 'Phone' : 'Platform'}</strong>
              </p>

              {applySuccess ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f0fdf4', borderRadius: 12, padding: '14px 18px', border: '1.5px solid #bbf7d0' }}>
                  <CheckCircle size={20} color="#16a34a" />
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#16a34a', margin: 0 }}>Application submitted successfully!</p>
                </div>
              ) : hasApplied ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f0fdf4', borderRadius: 12, padding: '14px 18px', border: '1.5px solid #bbf7d0' }}>
                  <CheckCircle size={20} color="#16a34a" />
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#16a34a', margin: 0 }}>You have already applied for this job.</p>
                </div>
              ) : applying ? (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#14532d', marginBottom: 8 }}>
                    Add a short message to the employer (optional)
                  </label>
                  <textarea
                    style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '1.5px solid #bbf7d0', borderRadius: 10, boxSizing: 'border-box', resize: 'vertical', fontFamily: "'Outfit',sans-serif", background: '#f0fdf4', color: '#14532d', lineHeight: 1.6, minHeight: 90 }}
                    placeholder="e.g. I have 3 years of experience and am available immediately."
                    value={coverNote}
                    onChange={e => setCoverNote(e.target.value)}
                    maxLength={300}
                  />
                  <p style={{ fontSize: 11, color: '#aaa', textAlign: 'right', margin: '4px 0 12px' }}>{coverNote.length}/300</p>
                  {applyError && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 10 }}>{applyError}</p>}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={submitApplication} className="jd-btn-primary">Submit Application</button>
                    <button onClick={() => { setApplying(false); setCoverNote(''); setApplyError('') }}
                      style={{ padding: '10px 20px', background: 'transparent', color: '#888', border: '1px solid #ddd', borderRadius: 50, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {user && profile ? (
                    <button onClick={() => setApplying(true)} className="jd-btn-primary">
                      Apply Now
                    </button>
                  ) : user && !profile ? (
                    <Link to="/register" className="jd-btn-primary">Complete Profile to Apply</Link>
                  ) : (
                    <Link to="/signup" className="jd-btn-primary">Sign Up to Apply</Link>
                  )}
                  {waLink && (
                    <a href={waLink} target="_blank" rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', background: '#25D366', color: '#fff', borderRadius: 50, fontWeight: 700, fontSize: 14, textDecoration: 'none', fontFamily: "'Outfit',sans-serif" }}>
                      <MessageCircle size={16} /> WhatsApp
                    </a>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT — sidebar */}
          <div style={{ flex: '0 1 260px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Job summary card */}
            <div className="jd-fade" style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1.5px solid #dcfce7' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#14532d', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Job Summary
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { Icon: Building2, label: 'Employer', value: job.employers?.organization_name },
                  { Icon: MapPin, label: 'Location', value: [job.location, job.lga].filter(Boolean).join(', ') || 'Oke-Ogun' },
                  { Icon: Briefcase, label: 'Job Type', value: JOB_TYPE_LABELS[job.job_type] || job.job_type },
                  { Icon: Users, label: 'Position Type', value: job.labour_type ? job.labour_type.charAt(0).toUpperCase() + job.labour_type.slice(1) : null },
                  { Icon: Clock, label: 'Application', value: job.application_method === 'whatsapp' ? 'Via WhatsApp' : job.application_method === 'phone' ? 'Via Phone' : 'On Platform' },
                ].filter(item => item.value).map(({ Icon, label, value }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={15} color="#16a34a" strokeWidth={2} />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', margin: '0 0 2px', letterSpacing: '0.04em' }}>{label}</p>
                      <p style={{ fontSize: 13, color: '#333', fontWeight: 600, margin: 0 }}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* About Employer */}
            <div className="jd-fade" style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1.5px solid #dcfce7' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#14532d', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                About Employer
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Employer Logo & Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: '1.5px solid #f0fdf4' }}>
                  {job.employers?.logo_url ? (
                    <img src={job.employers.logo_url} alt={job.employers?.organization_name}
                      style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'contain', background: '#f0fdf4', padding: 4 }}
                      onError={e => { e.target.style.display = 'none' }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={24} color="#16a34a" />
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', margin: '0 0 2px', letterSpacing: '0.04em' }}>Company</p>
                    <p style={{ fontSize: 14, color: '#333', fontWeight: 700, margin: 0 }}>{job.employers?.organization_name || 'N/A'}</p>
                  </div>
                </div>

                {/* Contact Info */}
                {job.employers?.phone_number && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', margin: '0 0 2px', letterSpacing: '0.04em' }}>Phone</p>
                      <a href={`tel:${job.employers?.phone_number}`} style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, margin: 0, textDecoration: 'none' }}>
                        {job.employers?.phone_number}
                      </a>
                    </div>
                  </div>
                )}

                {/* WhatsApp */}
                {job.employers?.whatsapp_number && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MessageCircle size={15} color="#25D366" strokeWidth={2} />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', margin: '0 0 2px', letterSpacing: '0.04em' }}>WhatsApp</p>
                      <a href={`https://wa.me/${job.employers?.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#25D366', fontWeight: 600, margin: 0, textDecoration: 'none' }}>
                        {job.employers?.whatsapp_number}
                      </a>
                    </div>
                  </div>
                )}

                {/* Location */}
                {job.employers?.lga && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MapPin size={15} color="#16a34a" strokeWidth={2} />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', margin: '0 0 2px', letterSpacing: '0.04em' }}>Based In</p>
                      <p style={{ fontSize: 13, color: '#333', fontWeight: 600, margin: 0 }}>{job.employers?.lga}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Browse more */}
            <div className="jd-fade" style={{ background: '#f0fdf4', borderRadius: 16, padding: '18px 20px', border: '1.5px solid #dcfce7', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#4b6358', margin: '0 0 12px', lineHeight: 1.6 }}>
                Looking for more opportunities in Oke-Ogun?
              </p>
              <Link to="/jobs" className="jd-btn-ghost">Browse All Jobs</Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
