import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const JOB_TYPE_LABELS = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
};

const EMPLOYMENT_TYPE_SCHEMA = {
  full_time: 'FULL_TIME',
  part_time: 'PART_TIME',
  contract: 'CONTRACTOR',
  internship: 'INTERN',
};

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [job, setJob] = useState(null);
  const [employer, setEmployer] = useState(null);
  const [skillNames, setSkillNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [applying, setApplying] = useState(false);
  const [coverNote, setCoverNote] = useState('');
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  useEffect(() => {
    fetchJob();
  }, [id]);

  async function fetchJob() {
    setLoading(true);
    const { data, error } = await supabase
      .from('job_listings')
      .select('*')
      .eq('id', id)
      .eq('status', 'approved')
      .single();

    if (error || !data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setJob(data);

    // Fetch employer
    const { data: emp } = await supabase
      .from('employers')
      .select('organization_name, lga, logo_url, about, whatsapp_number, phone_number')
      .eq('id', data.employer_id)
      .single();
    setEmployer(emp);

    // Fetch skill names
    if (data.skills_required?.length > 0) {
      const { data: skills } = await supabase
        .from('skills')
        .select('id, name')
        .in('id', data.skills_required);
      setSkillNames(skills?.map(s => s.name) || []);
    }

    // Check if already applied
    if (profile?.id) {
      const { data: existing } = await supabase
        .from('applications')
        .select('id')
        .eq('job_listing_id', id)
        .eq('job_seeker_id', profile.id)
        .maybeSingle();
      if (existing) setAlreadyApplied(true);
    }

    setLoading(false);
  }

  async function handleApply() {
    if (!profile) {
      navigate('/login');
      return;
    }
    setApplyError('');
    setApplying(true);
    const { error } = await supabase.from('applications').insert({
      job_listing_id: id,
      job_seeker_id: profile.id,
      cover_note: coverNote.trim() || null,
      status: 'submitted',
    });
    setApplying(false);
    if (error) {
      setApplyError('Something went wrong. Please try again.');
    } else {
      setApplySuccess(true);
      setAlreadyApplied(true);
    }
  }

  function whatsappLink() {
    const num = (employer?.whatsapp_number || employer?.phone_number || '')
      .replace(/\D/g, '')
      .replace(/^0/, '234');
    const msg = encodeURIComponent(
      `Hello, I am interested in the ${job.job_title} position listed on OkeOgunJobs.`
    );
    return `https://wa.me/${num}?text=${msg}`;
  }

  // JSON-LD schema for Google for Jobs
  function jsonLD() {
    if (!job || !employer) return null;
    const schema = {
      '@context': 'https://schema.org/',
      '@type': 'JobPosting',
      title: job.job_title,
      description: job.job_description,
      datePosted: job.approved_at || job.created_at,
      employmentType: EMPLOYMENT_TYPE_SCHEMA[job.job_type] || 'OTHER',
      hiringOrganization: {
        '@type': 'Organization',
        name: employer.organization_name,
        sameAs: 'https://okeogunjobs.com',
      },
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: job.location || employer.lga || 'Oke-Ogun',
          addressRegion: 'Oyo State',
          addressCountry: 'NG',
        },
      },
      url: `https://okeogunjobs.com/jobs/${job.id}`,
    };
    return JSON.stringify(schema);
  }

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#15803d', fontFamily: 'Outfit, sans-serif' }}>Loading job details…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'Outfit, sans-serif' }}>
        <Helmet><title>Job Not Found | OkeOgunJobs</title></Helmet>
        <h2 style={{ color: '#14532d' }}>Job not found</h2>
        <p style={{ color: '#15803d' }}>This listing may have been removed or is no longer active.</p>
        <Link to="/jobs" style={{ background: '#16a34a', color: '#fff', padding: '10px 24px', borderRadius: 50, textDecoration: 'none', fontWeight: 600 }}>
          Browse All Jobs
        </Link>
      </div>
    );
  }

  const pageTitle = `${job.job_title} at ${employer?.organization_name || 'Employer'} — ${job.location || 'Oke-Ogun'} | OkeOgunJobs`;
  const pageDesc = `${job.job_title} job in ${job.location || 'Oke-Ogun'}, Oyo State. ${JOB_TYPE_LABELS[job.job_type] || ''} position. Apply now on OkeOgunJobs.`;

  const canApplyOnPlatform = job.application_method === 'phone';
  const canApplyWhatsApp = job.application_method === 'whatsapp';

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={`https://okeogunjobs.com/jobs/${job.id}`} />
        {jsonLD() && (
          <script type="application/ld+json">{jsonLD()}</script>
        )}
      </Helmet>

      <div style={{ background: '#f0fdf4', minHeight: '100vh', padding: '40px 16px 80px', fontFamily: 'Outfit, sans-serif' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>

          {/* Back link */}
          <Link to="/jobs" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 500, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
            ← Back to Jobs
          </Link>

          {/* Header card */}
          <div style={{ background: '#fff', border: '1.5px solid #dcfce7', borderRadius: 20, padding: '28px 28px 24px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              {employer?.logo_url && (
                <img src={employer.logo_url} alt={employer.organization_name} style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', border: '1.5px solid #dcfce7', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1 }}>
                <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#14532d', lineHeight: 1.3 }}>{job.job_title}</h1>
                <p style={{ margin: '0 0 10px', color: '#15803d', fontWeight: 500, fontSize: 15 }}>{employer?.organization_name}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <span style={badgeStyle('#dcfce7', '#14532d')}>📍 {job.location || employer?.lga || 'Oke-Ogun'}</span>
                  <span style={badgeStyle('#dcfce7', '#14532d')}>{JOB_TYPE_LABELS[job.job_type] || job.job_type}</span>
                  {job.labour_type && (
                    <span style={badgeStyle('#fef9c3', '#854d0e')}>{capitalise(job.labour_type)}</span>
                  )}
                  {job.is_promoted && (
                    <span style={badgeStyle('#fef3c7', '#b45309')}>⭐ Promoted</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Job description */}
          <div style={{ background: '#fff', border: '1.5px solid #dcfce7', borderRadius: 20, padding: '24px 28px', marginBottom: 20 }}>
            <h2 style={sectionHeading}>Job Description</h2>
            <p style={{ color: '#166534', lineHeight: 1.75, whiteSpace: 'pre-wrap', margin: 0, fontSize: 15 }}>{job.job_description}</p>
          </div>

          {/* Skills required */}
          {(skillNames.length > 0 || job.custom_skills) && (
            <div style={{ background: '#fff', border: '1.5px solid #dcfce7', borderRadius: 20, padding: '24px 28px', marginBottom: 20 }}>
              <h2 style={sectionHeading}>Skills Required</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {skillNames.map(s => (
                  <span key={s} style={badgeStyle('#bbf7d0', '#14532d')}>{s}</span>
                ))}
                {job.custom_skills && job.custom_skills.split(',').map(s => s.trim()).filter(Boolean).map(s => (
                  <span key={s} style={badgeStyle('#bbf7d0', '#14532d')}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* About employer */}
          {employer?.about && (
            <div style={{ background: '#fff', border: '1.5px solid #dcfce7', borderRadius: 20, padding: '24px 28px', marginBottom: 20 }}>
              <h2 style={sectionHeading}>About {employer.organization_name}</h2>
              <p style={{ color: '#166534', lineHeight: 1.75, margin: 0, fontSize: 15 }}>{employer.about}</p>
            </div>
          )}

          {/* Apply section */}
          <div style={{ background: '#fff', border: '1.5px solid #dcfce7', borderRadius: 20, padding: '24px 28px' }}>
            <h2 style={sectionHeading}>Apply for this Job</h2>

            {alreadyApplied && !applySuccess && (
              <div style={alertBox('#dcfce7', '#14532d')}>You have already applied for this job.</div>
            )}

            {applySuccess && (
              <div style={alertBox('#dcfce7', '#14532d')}>✅ Application submitted! The employer will review and get back to you.</div>
            )}

            {!alreadyApplied && canApplyOnPlatform && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', color: '#166534', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                  Cover note (optional)
                </label>
                <textarea
                  value={coverNote}
                  onChange={e => setCoverNote(e.target.value)}
                  placeholder="Briefly introduce yourself and why you're a good fit…"
                  rows={4}
                  style={{ width: '100%', borderRadius: 12, border: '1.5px solid #dcfce7', background: '#f0fdf4', padding: '10px 14px', fontFamily: 'Outfit, sans-serif', fontSize: 14, color: '#14532d', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
                />
                {applyError && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 6 }}>{applyError}</p>}
                <button
                  onClick={handleApply}
                  disabled={applying}
                  style={{ marginTop: 12, background: applying ? '#86efac' : '#16a34a', color: '#fff', border: 'none', borderRadius: 50, padding: '12px 32px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, cursor: applying ? 'default' : 'pointer', width: '100%' }}
                >
                  {applying ? 'Submitting…' : 'Submit Application'}
                </button>
              </div>
            )}

            {canApplyWhatsApp && (
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', background: '#25D366', color: '#fff', border: 'none', borderRadius: 50, padding: '12px 32px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, textDecoration: 'none', textAlign: 'center' }}
              >
                💬 Apply via WhatsApp
              </a>
            )}

            {!profile && canApplyOnPlatform && (
              <p style={{ color: '#15803d', fontSize: 13, marginTop: 12, textAlign: 'center' }}>
                <Link to="/login" style={{ color: '#16a34a', fontWeight: 600 }}>Log in</Link> to apply directly through the platform.
              </p>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

function badgeStyle(bg, color) {
  return { background: bg, color, padding: '4px 12px', borderRadius: 50, fontSize: 13, fontWeight: 500 };
}

const sectionHeading = { color: '#14532d', fontSize: 16, fontWeight: 700, marginBottom: 14, marginTop: 0 };

function alertBox(bg, color) {
  return { background: bg, color, borderRadius: 12, padding: '12px 16px', fontSize: 14, marginBottom: 16, fontWeight: 500 };
}

function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
