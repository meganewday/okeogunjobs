import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { APP_NAME, APP_TAGLINE, APP_REGION } from '../config/constants'

const STEPS = [
  { number: '1', title: 'Register', description: 'Job seekers sign up with their skills, location, and experience.' },
  { number: '2', title: 'Get Verified', description: 'Our team reviews and approves your profile before it goes live.' },
  { number: '3', title: 'Browse Jobs', description: 'Employers post verified job listings across the Oke-Ogun region.' },
  { number: '4', title: 'Apply', description: 'Connect directly with employers via WhatsApp or phone call.' },
]

const WHO_WE_SERVE = [
  { emoji: '👨‍🌾', title: 'Skilled Workers', description: 'Farmers, artisans, traders, drivers, and more looking for work in Oke-Ogun.' },
  { emoji: '🏢', title: 'Local Employers', description: 'Businesses and organizations in Oke-Ogun looking for reliable local talent.' },
  { emoji: '🎓', title: 'Fresh Graduates', description: 'Young people from the region starting their careers close to home.' },
  { emoji: '🤝', title: 'Community Partners', description: 'NGOs, cooperatives, and institutions supporting local employment.' },
]

export default function Home() {
  const [latestJobs, setLatestJobs] = useState([])
  const [jobCount, setJobCount] = useState(0)
  const [seekerCount, setSeekerCount] = useState(0)

  useEffect(() => {
    fetchLatestJobs()
    fetchStats()
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

  return (
    <div style={styles.page}>

      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.heroText}>
            <h1 style={styles.heroTitle}>{APP_TAGLINE}</h1>
            <p style={styles.heroSub}>
              A community-driven job bank connecting {APP_REGION} indigenes —
              skilled and unskilled — to verified employment opportunities, for free.
            </p>
            <div style={styles.heroButtons}>
              <Link to="/register" style={styles.heroBtnPrimary}>Register as Job Seeker</Link>
              <Link to="/post-job" style={styles.heroBtnSecondary}>Post a Job</Link>
            </div>
          </div>

          {/* Stats */}
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
              <span style={styles.statNumber}>10+</span>
              <span style={styles.statLabel}>LGAs Covered</span>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <div style={styles.aboutGrid}>
            <div style={styles.aboutText}>
              <h2 style={styles.sectionTitle}>About {APP_NAME}</h2>
              <p style={styles.sectionText}>
                {APP_NAME} is a free community job bank built specifically for the Oke-Ogun
                geopolitical zone of Oyo State, Nigeria. Our mission is simple — to make it
                easier for hardworking indigenes to find decent work, and for local employers
                to find reliable talent without leaving the region.
              </p>
              <p style={styles.sectionText}>
                Every job listing and job seeker profile on {APP_NAME} is manually reviewed
                before going live, ensuring that only genuine opportunities and verified
                candidates are visible on the platform.
              </p>
              <Link to="/register" style={styles.inlineBtn}>Get Started →</Link>
            </div>
            <div style={styles.aboutCards}>
              <div style={styles.aboutCard}>
                <span style={styles.aboutCardIcon}>✅</span>
                <h4 style={styles.aboutCardTitle}>Verified Listings</h4>
                <p style={styles.aboutCardText}>Every job is reviewed before publishing</p>
              </div>
              <div style={styles.aboutCard}>
                <span style={styles.aboutCardIcon}>🆓</span>
                <h4 style={styles.aboutCardTitle}>Completely Free</h4>
                <p style={styles.aboutCardText}>No fees for job seekers or employers</p>
              </div>
              <div style={styles.aboutCard}>
                <span style={styles.aboutCardIcon}>📍</span>
                <h4 style={styles.aboutCardTitle}>Hyperlocal</h4>
                <p style={styles.aboutCardText}>Built for Oke-Ogun communities</p>
              </div>
              <div style={styles.aboutCard}>
                <span style={styles.aboutCardIcon}>📱</span>
                <h4 style={styles.aboutCardTitle}>WhatsApp Apply</h4>
                <p style={styles.aboutCardText}>Apply directly via WhatsApp</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ ...styles.section, backgroundColor: '#f0f7f3' }}>
        <div style={styles.sectionInner}>
          <h2 style={{ ...styles.sectionTitle, textAlign: 'center', marginBottom: '32px' }}>How It Works</h2>
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

      {/* LATEST JOBS + WHO WE SERVE */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <div style={styles.twoColGrid}>

            {/* Latest Jobs */}
            <div>
              <div style={styles.sectionTitleRow}>
                <h2 style={styles.sectionTitle}>Latest Jobs</h2>
                <Link to="/jobs" style={styles.viewAllLink}>View all →</Link>
              </div>
              {latestJobs.length === 0 ? (
                <p style={styles.emptyText}>No job listings yet. Check back soon.</p>
              ) : (
                <div style={styles.jobsList}>
                  {latestJobs.map(job => (
                    <div key={job.id} style={styles.jobCard}>
                      <div style={styles.jobCardLeft}>
                        <h3 style={styles.jobCardTitle}>{job.job_title}</h3>
                        <p style={styles.jobCardSub}>
                          {job.employers?.organization_name} • {job.lga || job.location || 'Oke-Ogun'}
                        </p>
                      </div>
                      <span style={styles.jobTypePill}>
                        {job.job_type?.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: '16px' }}>
                <Link to="/jobs" style={styles.heroBtnPrimary}>Browse All Jobs</Link>
              </div>
            </div>

            {/* Who We Serve */}
            <div>
              <h2 style={{ ...styles.sectionTitle, marginBottom: '16px' }}>Who We Serve</h2>
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
            Join the Oke-Ogun community job network today — free for everyone.
          </p>
          <div style={styles.heroButtons}>
            <Link to="/register" style={styles.heroBtnPrimary}>Register as Job Seeker</Link>
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
  heroText: { textAlign: 'center', maxWidth: '700px' },
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
  aboutGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '40px', alignItems: 'center' },
  aboutText: {},
  aboutCards: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  aboutCard: { backgroundColor: '#f0f7f3', borderRadius: '12px', padding: '20px', textAlign: 'center' },
  aboutCardIcon: { fontSize: '28px', display: 'block', marginBottom: '8px' },
  aboutCardTitle: { fontSize: '14px', fontWeight: '700', color: '#222', marginBottom: '4px' },
  aboutCardText: { fontSize: '12px', color: '#666', lineHeight: '1.5' },

  // Steps
  stepsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' },
  stepCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '28px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  stepNumber: { width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#1a6b3c', color: '#fff', fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' },
  stepTitle: { fontSize: '16px', fontWeight: '700', color: '#222', marginBottom: '8px' },
  stepDesc: { fontSize: '13px', color: '#666', lineHeight: '1.6' },

  // Two col
  twoColGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '48px' },

  // Latest Jobs
  jobsList: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '8px' },
  jobCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '10px', border: '1px solid #eee' },
  jobCardLeft: {},
  jobCardTitle: { fontSize: '15px', fontWeight: '700', color: '#222', margin: '0 0 4px 0' },
  jobCardSub: { fontSize: '13px', color: '#888', margin: 0 },
  jobTypePill: { fontSize: '12px', padding: '4px 10px', backgroundColor: '#e8f5ee', color: '#1a6b3c', borderRadius: '12px', fontWeight: '600', whiteSpace: 'nowrap', textTransform: 'capitalize' },

  // Who We Serve
  whoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  whoCard: { backgroundColor: '#f9f9f9', borderRadius: '12px', padding: '20px', textAlign: 'center' },
  whoEmoji: { fontSize: '28px', display: 'block', marginBottom: '8px' },
  whoTitle: { fontSize: '14px', fontWeight: '700', color: '#222', marginBottom: '6px' },
  whoDesc: { fontSize: '12px', color: '#666', lineHeight: '1.6' },

  // CTA Banner
  ctaBanner: { backgroundColor: '#1a6b3c', padding: '72px 24px', textAlign: 'center' },
  ctaTitle: { fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 'bold', color: '#fff', marginBottom: '12px' },
  ctaText: { fontSize: '15px', color: 'rgba(255,255,255,0.85)', marginBottom: '32px', lineHeight: '1.6' },
}