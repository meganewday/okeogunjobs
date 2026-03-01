import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { APP_NAME } from '../config/constants'

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
  'Iseyin', 'Itesiwaju', 'Kajola', 'Iwajowa'
]

const JOB_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
]

export default function JobListings() {
  const [jobs, setJobs] = useState([])
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    lga: '',
    job_type: '',
    skill: '',
  })
  const isDesktop = useIsDesktop()

  useEffect(() => {
    fetchSkills()
    fetchJobs()
  }, [])

  async function fetchSkills() {
    const { data } = await supabase
      .from('skills')
      .select('*')
      .order('category')
    if (data) setSkills(data)
  }

  async function fetchJobs() {
    setLoading(true)
    const { data } = await supabase
      .from('job_listings')
      .select('*, employers(organization_name, phone_number)')
      .eq('status', 'approved')
      .order('approved_at', { ascending: false })
    if (data) setJobs(data)
    setLoading(false)
  }

  function handleFilter(e) {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  function clearFilters() {
    setFilters({ lga: '', job_type: '', skill: '' })
  }

  function getSkillName(id) {
    const skill = skills.find(s => s.id === id)
    return skill ? skill.name : null
  }

  function buildWhatsAppLink(job) {
    const phone = job.employers?.phone_number?.replace(/\D/g, '')
    if (!phone) return null
    const internationalPhone = phone.startsWith('0') ? '234' + phone.slice(1) : phone
    const message = encodeURIComponent(
      `Hello, I am interested in the ${job.job_title} position listed on ${APP_NAME}. Please let me know how to apply.`
    )
    return `https://wa.me/${internationalPhone}?text=${message}`
  }

  const filteredJobs = jobs.filter(job => {
    if (filters.lga && job.lga !== filters.lga) return false
    if (filters.job_type && job.job_type !== filters.job_type) return false
    if (filters.skill && (!job.skills_required || !job.skills_required.includes(filters.skill))) return false
    return true
  })

  const grouped = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = []
    acc[skill.category].push(skill)
    return acc
  }, {})

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <div style={styles.pageHeader}>
          <h1 style={styles.title}>Job Listings</h1>
          <p style={styles.subtitle}>
            Browse verified job opportunities across the Oke-Ogun region.
          </p>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: isDesktop ? 'row' : 'column',
          gap: '24px',
          alignItems: 'flex-start',
        }}>

          {/* Sidebar Filters */}
          <div style={{ width: isDesktop ? '280px' : '100%', flexShrink: 0 }}>
            <div style={styles.filterBox}>
              <div style={styles.filterHeader}>
                <h3 style={styles.filterTitle}>Filter Jobs</h3>
                {(filters.lga || filters.job_type || filters.skill) && (
                  <button onClick={clearFilters} style={styles.clearBtn}>Clear</button>
                )}
              </div>

              <div style={styles.filterField}>
                <label style={styles.filterLabel}>Local Government Area</label>
                <select style={styles.filterSelect} name="lga" value={filters.lga} onChange={handleFilter}>
                  <option value="">All LGAs</option>
                  {LGAs.map(lga => (
                    <option key={lga} value={lga}>{lga}</option>
                  ))}
                </select>
              </div>

              <div style={styles.filterField}>
                <label style={styles.filterLabel}>Job Type</label>
                <select style={styles.filterSelect} name="job_type" value={filters.job_type} onChange={handleFilter}>
                  <option value="">All Types</option>
                  {JOB_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div style={styles.filterField}>
                <label style={styles.filterLabel}>Skill</label>
                <select style={styles.filterSelect} name="skill" value={filters.skill} onChange={handleFilter}>
                  <option value="">All Skills</option>
                  {Object.entries(grouped).map(([category, categorySkills]) => (
                    <optgroup key={category} label={category}>
                      {categorySkills.map(skill => (
                        <option key={skill.id} value={skill.id}>{skill.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <p style={styles.resultCount}>
                {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} found
              </p>
            </div>
          </div>

          {/* Job Cards */}
          <div style={{ flex: 1, width: '100%' }}>
            {loading ? (
              <p style={styles.empty}>Loading jobs...</p>
            ) : filteredJobs.length === 0 ? (
              <div style={styles.emptyBox}>
                <p style={styles.emptyTitle}>No jobs found</p>
                <p style={styles.emptyText}>Try adjusting your filters or check back later.</p>
              </div>
            ) : (
              <div style={styles.list}>
                {filteredJobs.map(job => {
                  const whatsappLink = buildWhatsAppLink(job)
                  return (
                    <div key={job.id} style={styles.card}>
                      <div style={styles.cardTop}>
                        <div>
                          <h2 style={styles.jobTitle}>{job.job_title}</h2>
                          <p style={styles.employerName}>{job.employers?.organization_name}</p>
                        </div>
                        <span style={styles.jobTypeBadge}>
                          {job.job_type?.replace('_', ' ')}
                        </span>
                      </div>

                      <div style={styles.metaRow}>
                        {job.location && <span style={styles.metaTag}>📍 {job.location}</span>}
                        {job.lga && <span style={styles.metaTag}>🏛 {job.lga}</span>}
                        <span style={styles.metaTag}>
                          📱 {job.application_method === 'whatsapp' ? 'WhatsApp' : 'Phone'}
                        </span>
                      </div>

                      <p style={styles.description}>{job.job_description}</p>

                      {job.skills_required && job.skills_required.length > 0 && (
                        <div style={styles.skillsRow}>
                          {job.skills_required.map(skillId => {
                            const name = getSkillName(skillId)
                            return name ? (
                              <span key={skillId} style={styles.skillTag}>{name}</span>
                            ) : null
                          })}
                        </div>
                      )}

                      <div style={styles.cardFooter}>
                        <p style={styles.postedDate}>
                          Posted {new Date(job.approved_at).toLocaleDateString()}
                        </p>
                        {whatsappLink && (
                          <a href={whatsappLink} target="_blank" rel="noreferrer" style={styles.applyBtn}>
                            Apply via WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f5f7f5', padding: '32px 24px' },
  container: { maxWidth: '1200px', margin: '0 auto' },
  pageHeader: { marginBottom: '32px' },
  title: { fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 'bold', color: '#1a6b3c', marginBottom: '8px' },
  subtitle: { fontSize: '15px', color: '#555' },
  filterBox: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  filterHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  filterTitle: { fontSize: '15px', fontWeight: '700', color: '#222' },
  clearBtn: { fontSize: '12px', color: '#e53e3e', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '600' },
  filterField: { marginBottom: '16px' },
  filterLabel: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '6px' },
  filterSelect: { width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #ddd', borderRadius: '8px', outline: 'none', backgroundColor: '#fff', color: '#333' },
  resultCount: { fontSize: '13px', color: '#888', marginTop: '8px' },
  list: { display: 'flex', flexDirection: 'column', gap: '16px' },
  empty: { textAlign: 'center', color: '#888', padding: '40px 0' },
  emptyBox: { backgroundColor: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center' },
  emptyTitle: { fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '8px' },
  emptyText: { fontSize: '14px', color: '#888' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  jobTitle: { fontSize: '18px', fontWeight: '700', color: '#222', margin: '0 0 4px 0' },
  employerName: { fontSize: '14px', color: '#888', margin: 0 },
  jobTypeBadge: { padding: '4px 12px', backgroundColor: '#e8f5ee', color: '#1a6b3c', borderRadius: '12px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', textTransform: 'capitalize' },
  metaRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' },
  metaTag: { fontSize: '12px', color: '#555', backgroundColor: '#f5f5f5', padding: '4px 10px', borderRadius: '10px' },
  description: { fontSize: '14px', color: '#444', lineHeight: '1.7', marginBottom: '12px' },
  skillsRow: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' },
  skillTag: { fontSize: '12px', padding: '4px 10px', backgroundColor: '#f0f7f3', color: '#1a6b3c', borderRadius: '10px', border: '1px solid #c8e6d4' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '14px' },
  postedDate: { fontSize: '12px', color: '#aaa', margin: 0 },
  applyBtn: { padding: '8px 18px', backgroundColor: '#25D366', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none' },
}