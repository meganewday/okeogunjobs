import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { APP_NAME } from '../config/constants'

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

  useEffect(() => {
    fetchSkills()
    fetchJobs()
  }, [])

  async function fetchSkills() {
    const { data } = await supabase
      .from('skills')
      .select('*')
      .order('name')
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
    const internationalPhone = phone.startsWith('0')
      ? '234' + phone.slice(1)
      : phone
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

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <h1 style={styles.title}>Job Listings</h1>
        <p style={styles.subtitle}>
          Browse verified job opportunities across the Oke-Ogun region.
        </p>

        {/* Filters */}
        <div style={styles.filterBox}>
          <div style={styles.filterRow}>
            <select
              style={styles.filterSelect}
              name="lga"
              value={filters.lga}
              onChange={handleFilter}
            >
              <option value="">All LGAs</option>
              {LGAs.map(lga => (
                <option key={lga} value={lga}>{lga}</option>
              ))}
            </select>

            <select
              style={styles.filterSelect}
              name="job_type"
              value={filters.job_type}
              onChange={handleFilter}
            >
              <option value="">All Job Types</option>
              {JOB_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            <select
              style={styles.filterSelect}
              name="skill"
              value={filters.skill}
              onChange={handleFilter}
            >
              <option value="">All Skills</option>
              {skills.map(skill => (
                <option key={skill.id} value={skill.id}>{skill.name}</option>
              ))}
            </select>

            {(filters.lga || filters.job_type || filters.skill) && (
              <button onClick={clearFilters} style={styles.clearBtn}>
                Clear
              </button>
            )}
          </div>

          <p style={styles.resultCount}>
            {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} found
          </p>
        </div>

        {/* Job Cards */}
        {loading ? (
          <p style={styles.empty}>Loading jobs...</p>
        ) : filteredJobs.length === 0 ? (
          <div style={styles.emptyBox}>
            <p style={styles.emptyTitle}>No jobs found</p>
            <p style={styles.emptyText}>Try adjusting your filters or check back later for new listings.</p>
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
                      <p style={styles.employerName}>
                        {job.employers?.organization_name}
                      </p>
                    </div>
                    <span style={styles.jobTypeBadge}>
                      {job.job_type?.replace('_', ' ')}
                    </span>
                  </div>

                  <div style={styles.metaRow}>
                    {job.location && (
                      <span style={styles.metaTag}>📍 {job.location}</span>
                    )}
                    {job.lga && (
                      <span style={styles.metaTag}>🏛 {job.lga}</span>
                    )}
                    <span style={styles.metaTag}>
                      📱 Apply via {job.application_method === 'whatsapp' ? 'WhatsApp' : 'Phone'}
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
                    {whatsappLink && <a href={whatsappLink} target="_blank" rel="noreferrer" style={styles.applyBtn}>Apply via WhatsApp</a>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f5f7f5', padding: '24px 16px' },
  container: { maxWidth: '700px', margin: '0 auto' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#1a6b3c', marginBottom: '8px' },
  subtitle: { fontSize: '14px', color: '#555', marginBottom: '20px' },
  filterBox: { backgroundColor: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  filterRow: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' },
  filterSelect: { flex: '1', minWidth: '140px', padding: '8px 12px', fontSize: '13px', border: '1px solid #ddd', borderRadius: '8px', outline: 'none', backgroundColor: '#fff', color: '#333' },
  clearBtn: { padding: '8px 16px', fontSize: '13px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9', cursor: 'pointer', color: '#555' },
  resultCount: { fontSize: '13px', color: '#888', margin: 0 },
  list: { display: 'flex', flexDirection: 'column', gap: '16px' },
  empty: { textAlign: 'center', color: '#888', padding: '40px 0' },
  emptyBox: { backgroundColor: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  emptyTitle: { fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '8px' },
  emptyText: { fontSize: '14px', color: '#888' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' },
  jobTitle: { fontSize: '17px', fontWeight: '700', color: '#222', margin: '0 0 4px 0' },
  employerName: { fontSize: '13px', color: '#888', margin: 0 },
  jobTypeBadge: { padding: '4px 10px', backgroundColor: '#e8f5ee', color: '#1a6b3c', borderRadius: '12px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', textTransform: 'capitalize' },
  metaRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' },
  metaTag: { fontSize: '12px', color: '#555', backgroundColor: '#f5f5f5', padding: '4px 10px', borderRadius: '10px' },
  description: { fontSize: '14px', color: '#444', lineHeight: '1.6', marginBottom: '12px' },
  skillsRow: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' },
  skillTag: { fontSize: '12px', padding: '4px 10px', backgroundColor: '#f0f7f3', color: '#1a6b3c', borderRadius: '10px', border: '1px solid #c8e6d4' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '12px' },
  postedDate: { fontSize: '12px', color: '#aaa', margin: 0 },
  applyBtn: { padding: '8px 18px', backgroundColor: '#25D366', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none' },
}