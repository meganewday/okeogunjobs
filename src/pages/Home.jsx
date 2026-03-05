import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { APP_NAME } from '../config/constants'

const STEPS = [
  {
    number: '1',
    title: 'Register',
    description: 'Job seekers fill in a short form with their skills, location, and experience. Skilled workers, unskilled workers, and students all have their own registration path so we collect only what is relevant to them.',
  },
  {
    number: '2',
    title: 'Get Reviewed',
    description: 'Every profile goes through a manual review before it goes live. This keeps the platform reliable — employers know the people they find here are real, local, and available.',
  },
  {
    number: '3',
    title: 'Browse Jobs',
    description: 'Employers post job listings across the Oke-Ogun zone. Every listing is also reviewed before publishing. You can filter by LGA, job type, or skill to find what is relevant to you.',
  },
  {
    number: '4',
    title: 'Apply Directly',
    description: 'No middlemen and no complicated process. You contact the employer directly via WhatsApp or phone, or apply on the platform if you have an account.',
  },
]

const WHO_WE_SERVE = [
  {
    emoji: '🛠',
    title: 'Skilled Workers',
    description: 'Carpenters, electricians, nurses, teachers, farmers, drivers, and anyone with a trade or professional background. Register your profile and let employers in your LGA find you. Your skills are listed, your location is shown, and your CV can be uploaded if you have one.',
  },
  {
    emoji: '🏢',
    title: 'Local Employers',
    description: 'Businesses, farms, schools, clinics, and individuals across Oke-Ogun looking for staff. Post a job for free, specify the skill or labour type you need, and receive applications directly on WhatsApp or phone. Every listing is reviewed before it goes live.',
  },
  {
    emoji: '🎓',
    title: 'Fresh Graduates',
    description: 'If you recently finished your degree or diploma and are looking for your first job in the region, OkeOgunJobs gives you a place to be found. Register your profile with your qualification, your LGA, and the kind of work you are looking for.',
  },
  {
    emoji: '🤝',
    title: 'Community Partners',
    description: 'NGOs, cooperatives, government agencies, and community organisations that support employment in Oke-Ogun. Whether you are placing workers, running a programme, or looking for local talent for a project, this platform is built for the same communities you serve.',
  },
  {
    emoji: '💪',
    title: 'Unskilled Workers',
    description: 'Not everyone needs a certificate to work. If you are available for farm work, domestic work, load carrying, cleaning, security, or any kind of general labour, you belong here. Register, select the type of work you can do, and employers who need that kind of help will find you.',
  },
  {
    emoji: '📚',
    title: 'IT / SIWES Students',
    description: 'Students from polytechnics, universities, and colleges of education looking for industrial attachment or SIWES placement in Oke-Ogun. Fill in your institution, course, and academic level. Employers and organisations who accept IT students can post placement positions here too.',
  },
]

export default function Home() {
  const [latestJobs, setLatestJobs] = useState([])
  const [jobCount, setJobCount] = useState(0)
  const [seekerCount, setSeekerCount] = useState(0)
  const [featuredEmployers, setFeaturedEmployers] = useState([])

  useEffect(() => {
    fetchLatestJobs()
    fetchStats()
    fetchFeaturedEmployers()
  }, [])

  async function fetchLatestJobs() {
    const { data } = await supabase
      .from('job_listings')
      .select('*, employers(organization_name)')
      .eq('status', 'approved')
      .order('approved_at', { ascending: false })
      .limit(5)
    if (data) setLatestJobs(data)
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

    // Tier 1 — paid featured (active paid_featured_until date)
    const { data: paid } = await supabase
      .from('employers')
      .select('id, organization_name, lga, about, is_paid_featured, paid_featured_until')
      .eq('status', 'approved')
      .eq('is_paid_featured', true)
      .gt('paid_featured_until', now)
      .limit(3)

    // Tier 2 — auto: top employers by active job count (excluding already paid)
    const paidIds = (paid || []).map(e => e.id)

    const { data: allActive } = await supabase
      .from('job_listings')
      .select('employer_id, employers(id, organization_name, lga, about, is_paid_featured)')
      .eq('status', 'approved')

    if (allActive) {
      // Count active listings per employer
      const counts = {}
      allActive.forEach(listing => {
        const id = listing.employer_id
        if (!id || paidIds.includes(id)) return
        if (!counts[id]) {
          counts[id] = {
            employer: listing.employers,
            count: 0,
          }
        }
        counts[id].count += 1
      })

      // Sort by count, take top 3
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
    <div style={styles.page}>

      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.heroText}>
            <h1 style={styles.heroTitle}>
              Find work in Oke-Ogun.<br />Find the right person for the job.
            </h1>
            <p style={styles.heroSub}>
              {APP_NAME} is a free job board built for the Oke-Ogun zone of Oyo State.
              It covers 9 LGAs, serves skilled workers, unskilled labour, and IT students,
              and every listing is reviewed before it goes live.
            </p>
            <div style={styles.heroButtons}>
              <Link to="/signup" style={styles.heroBtnPrimary}>Register as Job Seeker</Link>
              <Link to="/post-job" style={styles.heroBtnSecondary}>Post a Job</Link>
            </div>
          </div>

          <div style={styles.statsBox}>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>{jobCount}+</span>
              <span style={styles.statLabel}>Active Jobs</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statItem}>
              <span style={styles.statNumber}>{seekerCount}+</span>
              <span style={styles.statLabel}>Registered Seekers</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statItem}>
              <span style={styles.statNumber}>9</span>
              <span style={styles.statLabel}>LGAs Covered</span>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <div style={styles.aboutGrid}>
            <h2 style={styles.sectionTitle}>About {APP_NAME}</h2>
            <p style={styles.sectionText}>
              {APP_NAME} is a free job board built specifically for the Oke-Ogun
              geopolitical zone of Oyo State, Nigeria. It covers 9 LGAs — Saki West,
              Saki East, Atisbo, Oorelope, Olorunsogo, Iseyin, Itesiwaju, Kajola,
              and Iwajowa.
            </p>
            <p style={styles.sectionText}>
              The idea is simple. People in this region need work. Employers in this
              region need workers. Most job platforms are built for Lagos and Abuja.
              This one is built for here.
            </p>
            <p style={styles.sectionText}>
              Every profile and every job listing goes through a manual review before
              it appears on the platform. That means employers find real candidates,
              and job seekers find real opportunities.
            </p>
            <Link to="/signup" style={styles.inlineBtn}>Register for free →</Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ ...styles.section, backgroundColor: '#f0f7f3' }}>
        <div style={styles.sectionInner}>
          <h2 style={{ ...styles.sectionTitle, textAlign: 'center', marginBottom: '8px' }}>How It Works</h2>
          <p style={{ ...styles.sectionText, textAlign: 'center', marginBottom: '32px' }}>
            Four steps from registration to getting hired.
          </p>
          <div style={styles.stepsGrid}>
            {STEPS.map(step => (
              <div key={step.number} style={styles.stepCard}>
                <div style={styles.stepNumber}>{step.number}</div>
                <h3 style={styles.stepTitle}>{step.title}</h3>
                <p style={styles.stepDesc}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED EMPLOYERS */}
      {featuredEmployers.length > 0 && (
        <section style={styles.section}>
          <div style={styles.sectionInner}>
            <h2 style={{ ...styles.sectionTitle, marginBottom: '4px' }}>Featured Employers</h2>
            <p style={{ ...styles.sectionText, marginBottom: '24px' }}>
              Organisations currently hiring across Oke-Ogun.
            </p>
            <div style={styles.employerGrid}>
              {featuredEmployers.map(employer => (
                <div key={employer.id} style={styles.employerCard}>
                  <div style={styles.employerCardTop}>
                    <div style={styles.employerAvatar}>
                      {employer.organization_name?.charAt(0).toUpperCase()}
                    </div>
                    {employer.isPaid && (
                      <span style={styles.sponsoredBadge}>Sponsored</span>
                    )}
                  </div>
                  <h3 style={styles.employerName}>{employer.organization_name}</h3>
                  {employer.lga && (
                    <p style={styles.employerLga}>📍 {employer.lga}</p>
                  )}
                  <div style={styles.employerFooter}>
                    <span style={styles.activeJobsTag}>
                      {employer.activeJobs} active {employer.activeJobs === 1 ? 'job' : 'jobs'}
                    </span>
                    <Link to="/jobs" style={styles.viewJobsLink}>View Jobs →</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* LATEST JOBS + WHO WE SERVE */}
      <section style={{ ...styles.section, backgroundColor: featuredEmployers.length > 0 ? '#f0f7f3' : '#fff' }}>
        <div style={styles.sectionInner}>
          <div style={styles.twoColGrid}>

            {/* Latest Jobs */}
            <div>
              <div style={styles.sectionTitleRow}>
                <h2 style={styles.sectionTitle}>Latest Jobs</h2>
                <Link to="/jobs" style={styles.viewAllLink}>See all →</Link>
              </div>
              {latestJobs.length === 0 ? (
                <p style={styles.emptyText}>No listings yet. Check back soon.</p>
              ) : (
                <div style={styles.jobsList}>
                  {latestJobs.map(job => (
                    <Link to="/jobs" key={job.id} style={{ textDecoration: 'none' }}>
                      <div style={styles.jobCard}>
                        <div style={styles.jobCardLeft}>
                          <h3 style={styles.jobCardTitle}>{job.job_title}</h3>
                          <p style={styles.jobCardSub}>
                            {job.employers?.organization_name} &mdash; {job.lga || job.location || 'Oke-Ogun'}
                          </p>
                        </div>
                        <span style={styles.jobTypePill}>
                          {job.job_type?.replace('_', ' ')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              <div style={{ marginTop: '16px' }}>
                <Link to="/jobs" style={styles.heroBtnPrimary}>Browse All Jobs</Link>
              </div>
            </div>

            {/* Who We Serve */}
            <div>
              <h2 style={{ ...styles.sectionTitle, marginBottom: '16px' }}>Who OkeOgunJobs is For</h2>
              <div style={styles.whoGrid}>
                {WHO_WE_SERVE.map(item => (
                  <div key={item.title} style={styles.whoCard}>
                    <span style={styles.whoEmoji}>{item.emoji}</span>
                    <h3 style={styles.whoTitle}>{item.title}</h3>
                    <p style={styles.whoDesc}>{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section style={styles.ctaBanner}>
        <div style={styles.sectionInner}>
          <h2 style={styles.ctaTitle}>Ready to get started?</h2>
          <p style={styles.ctaText}>
            Registration is free and takes less than five minutes.
            Whether you are looking for work or looking to hire,
            start here.
          </p>
          <div style={styles.heroButtons}>
            <Link to="/signup" style={styles.heroBtnPrimary}>Register as Job Seeker</Link>
            <Link to="/post-job" style={{ ...styles.heroBtnSecondary, borderColor: '#fff', color: '#fff' }}>Post a Job</Link>
          </div>
        </div>
      </section>

    </div>
  )
}

const styles = {
  page: { fontFamily: 'Arial, sans-serif', color: '#222' },

  // Hero
  hero: { backgroundColor: '#1a6b3c', padding: '64px 24px' },
  heroInner: { maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'center' },
  heroText: { textAlign: 'center', maxWidth: '720px' },
  heroTitle: { fontSize: 'clamp(24px, 4vw, 42px)', fontWeight: 'bold', color: '#fff', lineHeight: '1.3', marginBottom: '16px' },
  heroSub: { fontSize: 'clamp(14px, 2vw, 17px)', color: 'rgba(255,255,255,0.85)', lineHeight: '1.7', marginBottom: '32px' },
  heroButtons: { display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' },
  heroBtnPrimary: { padding: '14px 28px', backgroundColor: '#fff', color: '#1a6b3c', borderRadius: '8px', fontWeight: '700', textDecoration: 'none', fontSize: '15px' },
  heroBtnSecondary: { padding: '14px 28px', backgroundColor: 'transparent', color: '#fff', borderRadius: '8px', fontWeight: '700', textDecoration: 'none', fontSize: '15px', border: '2px solid rgba(255,255,255,0.6)' },

  // Stats
  statsBox: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '32px', flexWrap: 'wrap', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px 40px' },
  statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  statNumber: { fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginTop: '4px' },
  statDivider: { width: '1px', height: '48px', backgroundColor: 'rgba(255,255,255,0.3)' },

  // Sections
  section: { padding: '72px 24px', backgroundColor: '#fff' },
  sectionInner: { maxWidth: '1200px', margin: '0 auto' },
  sectionTitle: { fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 'bold', color: '#1a6b3c', marginBottom: '12px' },
  sectionTitleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sectionText: { fontSize: '15px', color: '#555', lineHeight: '1.8', marginBottom: '16px' },
  viewAllLink: { fontSize: '14px', color: '#1a6b3c', textDecoration: 'none', fontWeight: '600' },
  inlineBtn: { display: 'inline-block', marginTop: '8px', padding: '10px 24px', backgroundColor: '#1a6b3c', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '14px' },
  emptyText: { color: '#888', fontSize: '14px' },

  // About
  aboutGrid: { maxWidth: '680px' },

  // Steps
  stepsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' },
  stepCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '28px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  stepNumber: { width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#1a6b3c', color: '#fff', fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' },
  stepTitle: { fontSize: '16px', fontWeight: '700', color: '#222', marginBottom: '8px' },
  stepDesc: { fontSize: '13px', color: '#666', lineHeight: '1.7' },

  // Featured Employers
  employerGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' },
  employerCard: { backgroundColor: '#f9f9f9', borderRadius: '12px', padding: '20px', border: '1px solid #eee' },
  employerCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  employerAvatar: { width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#1a6b3c', color: '#fff', fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  sponsoredBadge: { fontSize: '11px', padding: '3px 8px', backgroundColor: '#fff8e1', color: '#b45309', borderRadius: '6px', fontWeight: '700', border: '1px solid #fde68a' },
  employerName: { fontSize: '15px', fontWeight: '700', color: '#222', marginBottom: '4px' },
  employerLga: { fontSize: '12px', color: '#888', marginBottom: '12px' },
  employerFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  activeJobsTag: { fontSize: '12px', padding: '3px 10px', backgroundColor: '#e8f5ee', color: '#1a6b3c', borderRadius: '10px', fontWeight: '600' },
  viewJobsLink: { fontSize: '13px', color: '#1a6b3c', fontWeight: '700', textDecoration: 'none' },

  // Two col
  twoColGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '48px' },

  // Latest Jobs
  jobsList: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '8px' },
  jobCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '10px', border: '1px solid #eee', cursor: 'pointer' },
  jobCardLeft: {},
  jobCardTitle: { fontSize: '15px', fontWeight: '700', color: '#222', margin: '0 0 4px 0' },
  jobCardSub: { fontSize: '13px', color: '#888', margin: 0 },
  jobTypePill: { fontSize: '12px', padding: '4px 10px', backgroundColor: '#e8f5ee', color: '#1a6b3c', borderRadius: '12px', fontWeight: '600', whiteSpace: 'nowrap', textTransform: 'capitalize' },

  // Who We Serve
  whoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  whoCard: { backgroundColor: '#f9f9f9', borderRadius: '12px', padding: '20px' },
  whoEmoji: { fontSize: '24px', display: 'block', marginBottom: '8px' },
  whoTitle: { fontSize: '14px', fontWeight: '700', color: '#222', marginBottom: '6px' },
  whoDesc: { fontSize: '12px', color: '#666', lineHeight: '1.7' },

  // CTA Banner
  ctaBanner: { backgroundColor: '#1a6b3c', padding: '72px 24px', textAlign: 'center' },
  ctaTitle: { fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 'bold', color: '#fff', marginBottom: '12px' },
  ctaText: { fontSize: '15px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.7', maxWidth: '560px', margin: '0 auto 32px' },
}
