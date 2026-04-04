import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { APP_NAME } from '../config/constants'
import { Helmet } from 'react-helmet-async'
import JobAlertSubscribe from '../components/JobAlertSubscribe';

// ─── Data ─────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    number: '01', color: '#16a34a', bg: '#dcfce7',
    title: 'Register',
    description: 'Job seekers fill in a short form with their skills, location, and experience. Skilled workers, unskilled workers, and students each have their own registration path.',
  },
  {
    number: '02', color: '#15803d', bg: '#bbf7d0',
    title: 'Get Reviewed',
    description: 'Every profile goes through a manual review before it goes live. Employers know the people they find here are real, local, and available.',
  },
  {
    number: '03', color: '#166534', bg: '#86efac',
    title: 'Browse Jobs',
    description: 'Employers post job listings across the Oke-Ogun zone. Every listing is reviewed before publishing. Filter by LGA, job type, or skill.',
  },
  {
    number: '04', color: '#14532d', bg: '#4ade80',
    title: 'Apply Directly',
    description: 'No middlemen. Contact the employer via WhatsApp or phone, or apply on the platform directly if you have an account.',
  },
]

const WHO_WE_SERVE = [
  { emoji: '🛠', title: 'Skilled Workers', description: 'Carpenters, electricians, nurses, teachers, farmers, drivers, and anyone with a trade or professional background. Register your profile and let employers in your LGA find you.' },
  { emoji: '🏢', title: 'Local Employers', description: 'Businesses, farms, schools, clinics, and individuals across Oke-Ogun looking for staff. Post a job for free, specify the skill or labour type you need, and receive applications directly.' },
  { emoji: '🎓', title: 'Fresh Graduates', description: 'Recently finished your degree or diploma? Register your profile with your qualification, your LGA, and the kind of work you are looking for.' },
  { emoji: '🤝', title: 'Community Partners', description: 'NGOs, cooperatives, government agencies, and community organisations. Whether placing workers or running a programme, this platform serves the same communities you do.' },
  { emoji: '💪', title: 'Unskilled Workers', description: 'Available for farm work, domestic work, load carrying, cleaning, or security? Register, select the type of work you can do, and employers who need that help will find you.' },
  { emoji: '📚', title: 'IT / SIWES Students', description: 'Students from polytechnics, universities, and colleges of education looking for industrial attachment in Oke-Ogun. Fill in your institution, course, and academic level.' },
]

// ─── SVG Illustration ─────────────────────────────────────────────────────────
const HeroIllustration = () => (
  <svg viewBox="0 0 480 400" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 520 }}>
    <ellipse cx="300" cy="200" rx="160" ry="150" fill="#bbf7d0" opacity="0.5" />
    <ellipse cx="180" cy="280" rx="100" ry="80" fill="#86efac" opacity="0.3" />
    <rect x="60" y="160" width="100" height="200" rx="8" fill="#166534" />
    <rect x="72" y="175" width="22" height="22" rx="3" fill="#4ade80" />
    <rect x="104" y="175" width="22" height="22" rx="3" fill="#4ade80" />
    <rect x="72" y="210" width="22" height="22" rx="3" fill="#86efac" />
    <rect x="104" y="210" width="22" height="22" rx="3" fill="#4ade80" />
    <rect x="72" y="245" width="22" height="22" rx="3" fill="#86efac" />
    <rect x="104" y="245" width="22" height="22" rx="3" fill="#86efac" />
    <rect x="80" y="305" width="40" height="55" rx="4" fill="#14532d" />
    <rect x="60" y="152" width="100" height="12" rx="4" fill="#15803d" />
    <rect x="330" y="100" width="90" height="260" rx="8" fill="#15803d" />
    <rect x="340" y="115" width="18" height="18" rx="3" fill="#86efac" />
    <rect x="366" y="115" width="18" height="18" rx="3" fill="#4ade80" />
    <rect x="392" y="115" width="18" height="18" rx="3" fill="#86efac" />
    <rect x="340" y="145" width="18" height="18" rx="3" fill="#4ade80" />
    <rect x="366" y="145" width="18" height="18" rx="3" fill="#86efac" />
    <rect x="392" y="145" width="18" height="18" rx="3" fill="#4ade80" />
    <rect x="352" y="300" width="46" height="60" rx="4" fill="#14532d" />
    <rect x="330" y="92" width="90" height="12" rx="4" fill="#16a34a" />
    <circle cx="180" cy="210" r="22" fill="#fde68a" />
    <rect x="160" y="232" width="40" height="60" rx="10" fill="#16a34a" />
    <rect x="155" y="238" width="15" height="40" rx="6" fill="#fde68a" />
    <rect x="210" y="238" width="15" height="40" rx="6" fill="#fde68a" />
    <rect x="165" y="292" width="16" height="30" rx="6" fill="#14532d" />
    <rect x="199" y="292" width="16" height="30" rx="6" fill="#14532d" />
    <rect x="190" y="258" width="26" height="20" rx="4" fill="#92400e" />
    <path d="M173 220 Q180 226 187 220" stroke="#92400e" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <circle cx="290" cy="195" r="22" fill="#fcd34d" />
    <rect x="270" y="217" width="40" height="65" rx="10" fill="#166534" />
    <rect x="264" y="224" width="15" height="42" rx="6" fill="#fcd34d" />
    <rect x="311" y="224" width="15" height="42" rx="6" fill="#fcd34d" />
    <rect x="274" y="282" width="16" height="30" rx="6" fill="#14532d" />
    <rect x="300" y="282" width="16" height="30" rx="6" fill="#14532d" />
    <path d="M283 205 Q290 212 297 205" stroke="#92400e" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <circle cx="230" cy="155" r="20" fill="#fed7aa" />
    <rect x="212" y="175" width="36" height="55" rx="10" fill="#22c55e" />
    <rect x="206" y="182" width="14" height="36" rx="6" fill="#fed7aa" />
    <rect x="248" y="182" width="14" height="36" rx="6" fill="#fed7aa" />
    <rect x="214" y="230" width="14" height="26" rx="6" fill="#14532d" />
    <rect x="234" y="230" width="14" height="26" rx="6" fill="#14532d" />
    <path d="M224 163 Q230 169 236 163" stroke="#92400e" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <rect x="40" y="356" width="400" height="10" rx="5" fill="#bbf7d0" />
    <circle cx="420" cy="70" r="20" fill="#fde047" />
    <defs>
      <filter id="sh" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.15" />
      </filter>
    </defs>
  </svg>
)

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="10" fill="#16a34a"/>
    <path d="M6 10.5l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ─── Global CSS ───────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  @keyframes fadeUp    { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideInL  { from{opacity:0;transform:translateX(-36px)} to{opacity:1;transform:translateX(0)} }
  @keyframes slideInR  { from{opacity:0;transform:translateX(36px)}  to{opacity:1;transform:translateX(0)} }
  @keyframes floatUp   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.45} }
  .oj-hero-text { animation: slideInL 0.65s ease both; }
  .oj-hero-img  { animation: slideInR 0.75s 0.15s ease both; }
  .oj-fade      { opacity:0; animation: fadeUp 0.5s ease forwards; }
  .oj-float     { animation: floatUp 3s ease-in-out infinite; }
  .oj-btn-primary {
    display:inline-block; padding:13px 28px; background:#16a34a; color:#fff;
    border-radius:50px; font-weight:700; font-size:15px; text-decoration:none;
    border:none; cursor:pointer; font-family:'Outfit',sans-serif;
    box-shadow:0 4px 14px rgba(22,163,74,0.35);
    transition:transform 0.15s,box-shadow 0.15s;
  }
  .oj-btn-primary:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(22,163,74,0.45); }
  .oj-btn-outline {
    display:inline-block; padding:11px 26px; background:transparent; color:#16a34a;
    border:2px solid #16a34a; border-radius:50px; font-weight:700; font-size:15px;
    text-decoration:none; cursor:pointer; font-family:'Outfit',sans-serif;
    transition:all 0.15s;
  }
  .oj-btn-outline:hover { background:#16a34a; color:#fff; }
  .oj-who-card {
    background:#fff; border-radius:20px; padding:24px 20px;
    border:1.5px solid #dcfce7; transition:transform 0.2s,box-shadow 0.2s;
  }
  .oj-who-card:hover { transform:translateY(-5px); box-shadow:0 10px 26px rgba(22,163,74,0.11); }
  .oj-step-card {
    background:#fff; border-radius:20px; padding:28px 20px;
    text-align:center; position:relative; overflow:hidden;
    transition:transform 0.2s; box-shadow:0 2px 8px rgba(0,0,0,0.04);
  }
  .oj-step-card:hover { transform:translateY(-4px); }
  .oj-job-card {
    background:#fff; border-radius:16px; padding:18px 20px;
    border-left:4px solid #16a34a;
    transition:transform 0.2s,box-shadow 0.2s;
    box-shadow:0 2px 6px rgba(0,0,0,0.04);
  }
  .oj-job-card:hover { transform:translateY(-3px); box-shadow:0 6px 20px rgba(22,163,74,0.1); }
  .oj-employer-card {
    background:#fff; border-radius:20px; padding:24px 20px;
    border:1.5px solid #dcfce7; position:relative; overflow:hidden;
    transition:transform 0.2s,box-shadow 0.2s;
  }
  .oj-employer-card:hover { transform:translateY(-4px); box-shadow:0 10px 26px rgba(22,163,74,0.11); }
`

function SectionPill({ children }) {
  return (
    <span style={{ display:'inline-block', background:'#dcfce7', color:'#16a34a', borderRadius:50, padding:'5px 16px', fontSize:13, fontWeight:700, marginBottom:14 }}>
      {children}
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Home() {
  const [latestJobs, setLatestJobs]             = useState([])
  const [jobCount, setJobCount]                 = useState(0)
  const [seekerCount, setSeekerCount]           = useState(0)
  const [featuredEmployers, setFeaturedEmployers] = useState([])
  const [loadingJobs, setLoadingJobs]           = useState(true)

  useEffect(() => {
    fetchLatestJobs()
    fetchStats()
    fetchFeaturedEmployers()
  }, [])

  async function fetchLatestJobs() {
    setLoadingJobs(true)
    const { data } = await supabase
      .from('job_listings')
      .select('*, employers(organization_name)')
      .eq('status', 'approved')
      .order('approved_at', { ascending: false })
      .limit(5)
    if (data) setLatestJobs(data)
    setLoadingJobs(false)
  }

  async function fetchStats() {
    const { count: jobs } = await supabase
      .from('job_listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
    const { count: seekers } = await supabase
      .from('job_seekers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
    if (jobs !== null) setJobCount(jobs)
    if (seekers !== null) setSeekerCount(seekers)
  }

  async function fetchFeaturedEmployers() {
    const now = new Date().toISOString()

    // Tier 1 — paid featured
    const { data: paid } = await supabase
      .from('employers')
      .select('id, organization_name, lga, about, is_paid_featured, paid_featured_until')
      .eq('status', 'approved')
      .eq('is_paid_featured', true)
      .gt('paid_featured_until', now)
      .limit(3)

    const paidIds = (paid || []).map(e => e.id)

    // Tier 2 — auto: top by active job count
    const { data: allActive } = await supabase
      .from('job_listings')
      .select('employer_id, employers(id, organization_name, lga, about)')
      .eq('status', 'approved')

    if (allActive) {
      const counts = {}
      allActive.forEach(listing => {
        const id = listing.employer_id
        if (!id || paidIds.includes(id)) return
        if (!counts[id]) counts[id] = { employer: listing.employers, count: 0 }
        counts[id].count += 1
      })

      const autoFeatured = Object.values(counts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map(item => ({ ...item.employer, activeJobs: item.count, isPaid: false }))

      const paidWithMeta = (paid || []).map(e => ({
        ...e,
        activeJobs: allActive.filter(l => l.employer_id === e.id).length,
        isPaid: true,
      }))

      setFeaturedEmployers([...paidWithMeta, ...autoFeatured])
    }
  }

  return (
    <div style={{ fontFamily:"'Outfit','Segoe UI',sans-serif", background:'#f0fdf4', overflowX:'hidden' }}>
      <style>{CSS}</style>
<Helmet>
  <title>OkeOgunJobs | Oke-Ogun Job Bank | Find Jobs in Oke-Ogun</title>
  <meta name="description" content="OkeOgunJobs connects Oke-Ogun indigenes to verified jobs across 10 LGAs in Oyo State. Browse job listings, register as a job seeker, or post a job today." />
  <link rel="canonical" href="https://okeogunjobs.com/" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://okeogunjobs.com/" />
  <meta property="og:title" content="OkeOgunJobs — Oke-Ogun Job Bank" />
  <meta property="og:description" content="Find verified jobs across all 10 LGAs of Oke-Ogun, Oyo State. Free for job seekers. Employers post jobs and find local talent directly." />
  <meta property="og:image" content="https://okeogunjobs.com/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="OkeOgunJobs" />
  <meta property="og:locale" content="en_NG" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="OkeOgunJobs — Oke-Ogun Job Bank" />
  <meta name="twitter:description" content="Find verified jobs across all 10 LGAs of Oke-Ogun, Oyo State. Free for job seekers." />
  <meta name="twitter:image" content="https://okeogunjobs.com/og-image.png" />
</Helmet>
      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section style={{ background:'linear-gradient(135deg,#14532d 0%,#166534 45%,#15803d 100%)', padding:'64px 24px 52px', position:'relative', overflow:'hidden' }}>
        {/* Decorative circles */}
        <div style={{ position:'absolute', top:-60, right:-60, width:240, height:240, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />
        <div style={{ position:'absolute', bottom:-40, left:-40, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />

        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', flexWrap:'wrap', alignItems:'center', gap:48, justifyContent:'space-between' }}>
          {/* Left */}
          <div className="oj-hero-text" style={{ flex:'1 1 320px', maxWidth:540 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.12)', borderRadius:50, padding:'6px 16px', marginBottom:24, fontSize:13, fontWeight:600, color:'#bbf7d0' }}>
              🌿 Oke-Ogun's Free Job Platform
            </div>
            <h1 style={{ fontSize:'clamp(30px,5vw,52px)', fontWeight:900, lineHeight:1.1, color:'#fff', margin:'0 0 18px' }}>
              Find work in Oke-Ogun.<br />
              <span style={{ color:'#86efac' }}>Find the right person</span><br />
              for the job.
            </h1>
            <p style={{ fontSize:16, color:'rgba(255,255,255,0.82)', lineHeight:1.75, margin:'0 0 32px', maxWidth:460 }}>
              {APP_NAME} is a free job board built for the Oke-Ogun zone of Oyo State. It covers 10 LGAs, serves skilled workers, unskilled labour, and IT students, and every listing is reviewed before it goes live.
            </p>
            <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
              <Link to="/signup" className="oj-btn-primary" style={{ background:'#fff', color:'#16a34a' }}>Register as Job Seeker</Link>
              <Link to="/post-job" style={{ display:'inline-block', padding:'11px 26px', background:'transparent', color:'#fff', border:'2px solid rgba(255,255,255,0.55)', borderRadius:50, fontWeight:700, fontSize:15, textDecoration:'none', fontFamily:"'Outfit',sans-serif" }}>Post a Job</Link>
            </div>
            <div style={{ display:'flex', gap:18, marginTop:28, flexWrap:'wrap' }}>
              {['Always free for seekers','Admin-verified listings','Covers 10 LGAs'].map(t => (
                <div key={t} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'rgba(255,255,255,0.8)', fontWeight:500 }}>
                  <CheckIcon /> {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right — illustration + live stats */}
          <div className="oj-hero-img" style={{ flex:'1 1 280px', display:'flex', flexDirection:'column', alignItems:'center', gap:24 }}>
            <div style={{ position:'relative' }}>
              <HeroIllustration />
              <div className="oj-float" style={{ position:'absolute', top:-8, right:-8, background:'#fff', borderRadius:14, padding:'10px 16px', boxShadow:'0 4px 16px rgba(0,0,0,0.12)', fontSize:13, fontWeight:700, color:'#15803d', border:'1.5px solid #dcfce7' }}>
                📍 Oke-Ogun, Oyo State
              </div>
            </div>

            {/* Live stats box */}
            <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:20, padding:'20px 32px', display:'flex', gap:28, alignItems:'center', flexWrap:'wrap', justifyContent:'center', backdropFilter:'blur(4px)', border:'1px solid rgba(255,255,255,0.15)' }}>
              {[
                { num: jobCount, suffix: '+', label: 'Active Jobs' },
                { num: seekerCount, suffix: '+', label: 'Registered Seekers' },
                { num: 10, suffix: '', label: 'LGAs Covered' },
              ].map((stat, i) => (
                <div key={i} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:30, fontWeight:900, color:'#fff', lineHeight:1 }}>{stat.num}{stat.suffix}</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', marginTop:4, fontWeight:500 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
<JobAlertSubscribe /> 
      
      {/* ── ABOUT ───────────────────────────────────────────────────────── */}
      <section style={{ padding:'72px 24px', background:'#fff' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ maxWidth:700 }}>
            <SectionPill>About {APP_NAME}</SectionPill>
            <h2 style={{ fontSize:'clamp(22px,3vw,34px)', fontWeight:900, color:'#14532d', margin:'0 0 16px' }}>Built for Oke-Ogun, by people who know it</h2>
            <p style={{ fontSize:15, color:'#4b6358', lineHeight:1.8, marginBottom:14 }}>
              {APP_NAME} is a free job board built specifically for the Oke-Ogun geopolitical zone of Oyo State, Nigeria. It covers 10 LGAs — Saki West, Saki East, Atisbo, Oorelope, Olorunsogo, Iseyin, Itesiwaju, Kajola, Iwajowa, and Irepo.
            </p>
            <p style={{ fontSize:15, color:'#4b6358', lineHeight:1.8, marginBottom:14 }}>
              Most job platforms are built for Lagos and Abuja. This one is built for here. Every profile and every job listing goes through a manual review before it appears — employers find real candidates, and job seekers find real opportunities.
            </p>
            <Link to="/signup" className="oj-btn-primary" style={{ marginTop:8, display:'inline-block' }}>Register for free →</Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section style={{ padding:'72px 24px', background:'#f0fdf4' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <SectionPill>How It Works</SectionPill>
            <h2 style={{ fontSize:'clamp(22px,3vw,36px)', fontWeight:900, color:'#14532d', margin:0 }}>Four steps from registration to getting hired</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:20 }}>
            {STEPS.map(step => (
              <div key={step.number} className="oj-step-card">
                <div style={{ position:'absolute', top:0, left:0, right:0, height:5, background:step.color, borderRadius:'20px 20px 0 0' }} />
                <div style={{ width:52, height:52, borderRadius:'50%', background:step.bg, display:'flex', alignItems:'center', justifyContent:'center', margin:'14px auto 18px', fontSize:18, fontWeight:900, color:step.color }}>
                  {step.number}
                </div>
                <h3 style={{ fontSize:17, fontWeight:800, color:'#14532d', margin:'0 0 10px' }}>{step.title}</h3>
                <p style={{ fontSize:13, color:'#4b6358', lineHeight:1.7, margin:0 }}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED EMPLOYERS ──────────────────────────────────────────── */}
      {featuredEmployers.length > 0 && (
        <section style={{ padding:'72px 24px', background:'#fff' }}>
          <div style={{ maxWidth:1100, margin:'0 auto' }}>
            <SectionPill>Featured Employers</SectionPill>
            <h2 style={{ fontSize:'clamp(22px,3vw,34px)', fontWeight:900, color:'#14532d', margin:'0 0 8px' }}>Hiring in Oke-Ogun now</h2>
            <p style={{ fontSize:15, color:'#4b6358', margin:'0 0 28px' }}>Organisations currently hiring across Oke-Ogun.</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:20 }}>
              {featuredEmployers.map((emp, i) => (
                <div key={emp.id} className={`oj-employer-card oj-fade`} style={{ animationDelay:`${i*0.07}s` }}>
                  {emp.isPaid && (
                    <div style={{ position:'absolute', top:14, right:14, background:'#fef9c3', color:'#854d0e', fontSize:11, fontWeight:700, borderRadius:20, padding:'3px 10px', border:'1px solid #fde68a' }}>
                      Sponsored
                    </div>
                  )}
                  <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
                    <div style={{ width:48, height:48, borderRadius:12, background:'linear-gradient(135deg,#16a34a,#22c55e)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:900, color:'#fff', flexShrink:0 }}>
                      {emp.organization_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ fontSize:15, fontWeight:800, color:'#14532d', margin:'0 0 4px' }}>{emp.organization_name}</h3>
                      {emp.lga && <p style={{ fontSize:12, color:'#888', margin:0 }}>📍 {emp.lga}</p>}
                    </div>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ background:'#dcfce7', color:'#166534', borderRadius:20, padding:'3px 12px', fontSize:12, fontWeight:700 }}>
                      {emp.activeJobs} active {emp.activeJobs === 1 ? 'job' : 'jobs'}
                    </span>
                    <Link to="/jobs" style={{ fontSize:13, color:'#16a34a', fontWeight:700, textDecoration:'none' }}>View Jobs →</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── LATEST JOBS + WHO WE SERVE ──────────────────────────────────── */}
      <section style={{ padding:'72px 24px', background: featuredEmployers.length > 0 ? '#f0fdf4' : '#fff' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:52 }}>

            {/* Latest Jobs */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <div>
                  <SectionPill>Open Positions</SectionPill>
                  <h2 style={{ fontSize:'clamp(20px,2.5vw,28px)', fontWeight:900, color:'#14532d', margin:0 }}>Latest Jobs</h2>
                </div>
                <Link to="/jobs" style={{ fontSize:14, color:'#16a34a', fontWeight:700, textDecoration:'none' }}>See all →</Link>
              </div>

              {loadingJobs ? (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {[...Array(3)].map((_,i) => (
                    <div key={i} style={{ background:'#fff', borderRadius:14, height:72, animation:'pulse 1.4s ease-in-out infinite', border:'1.5px solid #dcfce7' }} />
                  ))}
                </div>
              ) : latestJobs.length === 0 ? (
                <p style={{ color:'#888', fontSize:14 }}>No listings yet. Check back soon.</p>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
                  {latestJobs.map((job, i) => (
                    <Link to="/jobs" key={job.id} style={{ textDecoration:'none' }}>
                      <div className="oj-job-card oj-fade" style={{ animationDelay:`${i*0.06}s` }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
                          <div>
                            <h3 style={{ fontSize:15, fontWeight:800, color:'#14532d', margin:'0 0 4px' }}>{job.job_title}</h3>
                            <p style={{ fontSize:13, color:'#15803d', margin:0, fontWeight:500 }}>
                              {job.employers?.organization_name} — {job.lga || job.location || 'Oke-Ogun'}
                            </p>
                          </div>
                          <span style={{ background:'#dcfce7', color:'#166534', borderRadius:20, padding:'4px 12px', fontSize:12, fontWeight:700, whiteSpace:'nowrap', textTransform:'capitalize', flexShrink:0 }}>
                            {job.job_type?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              <Link to="/jobs" className="oj-btn-primary">Browse All Jobs</Link>
            </div>

            {/* Who We Serve */}
            <div>
              <SectionPill>Who We Serve</SectionPill>
              <h2 style={{ fontSize:'clamp(20px,2.5vw,28px)', fontWeight:900, color:'#14532d', margin:'0 0 20px' }}>OkeOgunJobs is for everyone</h2>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                {WHO_WE_SERVE.map((item, i) => (
                  <div key={item.title} className="oj-who-card oj-fade" style={{ animationDelay:`${i*0.07}s` }}>
                    <span style={{ fontSize:22, display:'block', marginBottom:8 }}>{item.emoji}</span>
                    <h3 style={{ fontSize:13, fontWeight:800, color:'#14532d', margin:'0 0 6px' }}>{item.title}</h3>
                    <p style={{ fontSize:12, color:'#4b6358', lineHeight:1.65, margin:0 }}>{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────────────── */}
      <section style={{ background:'linear-gradient(135deg,#14532d 0%,#166534 50%,#15803d 100%)', padding:'72px 24px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-60, left:-60, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />
        <div style={{ position:'absolute', bottom:-80, right:-40, width:240, height:240, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />
        <div style={{ position:'relative', maxWidth:600, margin:'0 auto' }}>
          <div style={{ fontSize:44, marginBottom:14 }}>🌿</div>
          <h2 style={{ fontSize:'clamp(24px,3.5vw,38px)', fontWeight:900, color:'#fff', margin:'0 0 14px' }}>Ready to get started?</h2>
          <p style={{ fontSize:16, color:'rgba(255,255,255,0.82)', margin:'0 0 32px', lineHeight:1.7 }}>
            Registration is free and takes less than five minutes. Whether you are looking for work or looking to hire, start here.
          </p>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/signup" style={{ display:'inline-block', padding:'13px 32px', background:'#fff', color:'#16a34a', borderRadius:50, fontWeight:800, fontSize:15, textDecoration:'none', boxShadow:'0 4px 14px rgba(0,0,0,0.18)', fontFamily:"'Outfit',sans-serif" }}>
              Register as Job Seeker
            </Link>
            <Link to="/post-job" style={{ display:'inline-block', padding:'11px 28px', background:'transparent', color:'#fff', border:'2px solid rgba(255,255,255,0.55)', borderRadius:50, fontWeight:700, fontSize:15, textDecoration:'none', fontFamily:"'Outfit',sans-serif" }}>
              Post a Job
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
