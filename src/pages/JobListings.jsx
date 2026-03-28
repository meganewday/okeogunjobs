import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toWhatsApp(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? "234" + digits.slice(1) : digits;
}

const JOB_TYPE_LABEL = {
  full_time: "Full-time", part_time: "Part-time",
  contract: "Contract",  internship: "Internship",
};
const LABOUR_STYLE = {
  skilled:    { bg: "#dcfce7", text: "#166534" },
  unskilled:  { bg: "#fef9c3", text: "#854d0e" },
  internship: { bg: "#dbeafe", text: "#1e40af" },
};
const LGAS = [
  "Saki West","Saki East","Atisbo","Oorelope","Olorunsogo",
  "Iseyin","Itesiwaju","Kajola","Iwajowa","Irepo",
];

// ─── Icons ────────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);
const LocationIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const BuildingIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
  </svg>
);
const WhatsAppIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);

// ─── Global CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.45} }
  select, input { font-family:'Outfit',sans-serif; font-size:14px; outline:none; }
  select:focus, input:focus { border-color:#16a34a !important; box-shadow:0 0 0 3px rgba(22,163,74,0.12) !important; }
  .job-card { background:#fff; border-radius:20px; padding:28px 24px; border:1.5px solid #dcfce7; box-shadow:0 2px 10px rgba(22,163,74,0.06); transition:transform 0.2s,box-shadow 0.2s; animation:fadeUp 0.4s ease both; opacity:0; }
  .job-card:hover { transform:translateY(-4px); box-shadow:0 10px 28px rgba(22,163,74,0.13); }
`;

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ background:"#fff", borderRadius:20, padding:"28px 24px", border:"1.5px solid #dcfce7", animation:"pulse 1.4s ease-in-out infinite" }}>
      <div style={{ height:18, background:"#dcfce7", borderRadius:8, width:"55%", marginBottom:12 }} />
      <div style={{ height:13, background:"#f0fdf4", borderRadius:8, width:"40%", marginBottom:16 }} />
      <div style={{ display:"flex", gap:8 }}>
        <div style={{ height:24, background:"#f0fdf4", borderRadius:20, width:70 }} />
        <div style={{ height:24, background:"#f0fdf4", borderRadius:20, width:80 }} />
        <div style={{ height:24, background:"#f0fdf4", borderRadius:20, width:60 }} />
      </div>
    </div>
  );
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({ job, index, skillsMap }) {
  const employer  = job.employers;
  const labour    = (job.labour_type || "skilled").toLowerCase();
  const tag       = LABOUR_STYLE[labour] || LABOUR_STYLE.skilled;
  const typeLabel = JOB_TYPE_LABEL[job.job_type] || job.job_type;
  const waNumber  = toWhatsApp(employer?.phone_number);
  const waMsg     = `Hello, I'm interested in the ${job.job_title} role listed on OkeOgunJobs.`;
  const dispLoc   = [job.location, job.lga].filter(Boolean).join(", ") || "Oke-Ogun";

  // Resolve skills from map
  const resolvedSkills = (job.skills_required || []).map(id => skillsMap[id]).filter(Boolean);
  const category = resolvedSkills[0]?.category || "General";

  return (
    <div className="job-card" style={{ animationDelay:`${index*0.06}s` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, flexWrap:"wrap" }}>
        <div style={{ flex:1 }}>
          <h3 style={{ fontSize:18, fontWeight:800, color:"#14532d", margin:"0 0 8px", lineHeight:1.3 }}>{job.job_title}</h3>
          <div style={{ display:"flex", flexWrap:"wrap", gap:14, fontSize:13, color:"#15803d", fontWeight:500, marginBottom:14 }}>
            <span style={{ display:"flex", alignItems:"center", gap:4 }}><BuildingIcon />{employer?.organization_name || "—"}</span>
            <span style={{ display:"flex", alignItems:"center", gap:4 }}><LocationIcon />{dispLoc}</span>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <span style={{ background:"#dcfce7", color:"#166534", borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:700 }}>{category}</span>
            <span style={{ background:"#f0fdf4", color:"#166534", borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:700, border:"1px solid #bbf7d0" }}>{typeLabel}</span>
            <span style={{ background:tag.bg, color:tag.text, borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:700 }}>
              {labour.charAt(0).toUpperCase() + labour.slice(1)}
            </span>
          </div>
        </div>

        {waNumber ? (
          <a
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(waMsg)}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#16a34a", color:"#fff", fontWeight:700, fontSize:14, padding:"12px 22px", borderRadius:50, textDecoration:"none", boxShadow:"0 4px 12px rgba(22,163,74,0.3)", whiteSpace:"nowrap", flexShrink:0, fontFamily:"'Outfit',sans-serif" }}
          >
            <WhatsAppIcon /> Apply
          </a>
        ) : (
          <span style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#f0fdf4", color:"#166534", fontWeight:600, fontSize:13, padding:"10px 18px", borderRadius:50, border:"1.5px solid #bbf7d0", whiteSpace:"nowrap", flexShrink:0 }}>
            📞 Call to Apply
          </span>
        )}
      </div>

      {/* Skill chips */}
      {resolvedSkills.length > 1 && (
        <div style={{ marginTop:16, paddingTop:16, borderTop:"1px solid #f0fdf4", display:"flex", gap:6, flexWrap:"wrap" }}>
          {resolvedSkills.slice(0, 5).map(s => (
            <span key={s.id || s.name} style={{ background:"#f0fdf4", color:"#15803d", borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:600 }}>{s.name}</span>
          ))}
          {resolvedSkills.length > 5 && (
            <span style={{ background:"#f0fdf4", color:"#15803d", borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:600 }}>+{resolvedSkills.length - 5} more</span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────
function FilterPanel({ skills, skillsMap, filterSkill, setFilterSkill, filterLGA, setFilterLGA, filterType, setFilterType, filterLabour, setFilterLabour, activeFilters, clearFilters }) {
  const selectStyle = {
    width:"100%", padding:"10px 12px", border:"1.5px solid #dcfce7", borderRadius:12,
    background:"#f0fdf4", color:"#14532d", fontSize:14, cursor:"pointer",
    appearance:"none", transition:"border 0.15s,box-shadow 0.15s",
    backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2316a34a' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center", paddingRight:32,
  };
  const labelStyle = { fontSize:12, fontWeight:700, color:"#166534", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8, display:"block" };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h3 style={{ fontSize:16, fontWeight:800, color:"#14532d", margin:0 }}>Filters</h3>
        {activeFilters > 0 && (
          <button onClick={clearFilters} style={{ background:"none", border:"none", color:"#16a34a", fontSize:13, fontWeight:600, cursor:"pointer", textDecoration:"underline", padding:0 }}>Clear all</button>
        )}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
        {/* Worker type — radio */}
        <div>
          <label style={labelStyle}>Worker Type</label>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {[["","All Types"],["skilled","Skilled"],["unskilled","Unskilled"],["internship","Internship / IT"]].map(([val, lbl]) => (
              <label key={val} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", fontSize:14, color: filterLabour === val ? "#16a34a" : "#166534", fontWeight: filterLabour === val ? 700 : 500 }}>
                <input type="radio" name="labour" value={val} checked={filterLabour === val} onChange={() => setFilterLabour(val)} style={{ accentColor:"#16a34a", width:16, height:16 }} />
                {lbl}
              </label>
            ))}
          </div>
        </div>
        {/* Job type */}
        <div>
          <label style={labelStyle}>Job Type</label>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={selectStyle}>
            <option value="">All Types</option>
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
        </div>
        {/* LGA */}
        <div>
          <label style={labelStyle}>LGA</label>
          <select value={filterLGA} onChange={e => setFilterLGA(e.target.value)} style={selectStyle}>
            <option value="">All LGAs</option>
            {LGAS.map(lga => <option key={lga} value={lga}>{lga}</option>)}
          </select>
        </div>
        {/* Skill */}
        <div>
          <label style={labelStyle}>Skill</label>
          <select value={filterSkill} onChange={e => setFilterSkill(e.target.value)} style={selectStyle}>
            <option value="">All Skills</option>
            {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

// ─── Filter Chip ──────────────────────────────────────────────────────────────
function FilterChip({ label, onRemove }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#dcfce7", color:"#166534", borderRadius:20, padding:"5px 12px", fontSize:12, fontWeight:700 }}>
      {label}
      <button onClick={onRemove} style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"flex", alignItems:"center", color:"#16a34a" }}>
        <CloseIcon />
      </button>
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function JobListings() {
  const [jobs, setJobs]           = useState([]);
  const [skills, setSkills]       = useState([]);       // array for filter dropdown
  const [skillsMap, setSkillsMap] = useState({});       // id → skill object
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile]   = useState(window.innerWidth < 900);

  const [search, setSearch]             = useState("");
  const [filterSkill, setFilterSkill]   = useState("");
  const [filterLGA, setFilterLGA]       = useState("");
  const [filterType, setFilterType]     = useState("");
  const [filterLabour, setFilterLabour] = useState("");

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [jobsRes, skillsRes] = await Promise.all([
          supabase
            .from("job_listings")
            .select("id, job_title, job_type, location, lga, labour_type, skills_required, employers(organization_name, phone_number)")
            .eq("status", "approved")
            .order("approved_at", { ascending: false }),
          supabase
            .from("skills")
            .select("id, name, category")
            .order("category"),
        ]);
        if (jobsRes.error) throw jobsRes.error;
        if (skillsRes.error) throw skillsRes.error;

        // Build map
        const map = {};
        (skillsRes.data || []).forEach(s => { map[s.id] = s; });
        setSkillsMap(map);
        setSkills(skillsRes.data || []);
        setJobs(jobsRes.data || []);
      } catch (err) {
        setError("Could not load job listings. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const activeFilters = [filterSkill, filterLGA, filterType, filterLabour].filter(Boolean).length;

  function clearFilters() {
    setFilterSkill(""); setFilterLGA(""); setFilterType(""); setFilterLabour(""); setSearch("");
  }

  // Client-side filtering
  const filtered = jobs.filter(job => {
    const q = search.toLowerCase();
    const resolvedSkills = (job.skills_required || []).map(id => skillsMap[id]).filter(Boolean);

    const matchSearch = !search ||
      job.job_title?.toLowerCase().includes(q) ||
      job.employers?.organization_name?.toLowerCase().includes(q) ||
      job.location?.toLowerCase().includes(q) ||
      resolvedSkills.some(s => s.name.toLowerCase().includes(q));

    const matchSkill  = !filterSkill  || (job.skills_required || []).includes(filterSkill);
    const matchLGA    = !filterLGA    || job.lga === filterLGA;
    const matchType   = !filterType   || job.job_type === filterType;
    const matchLabour = !filterLabour || (job.labour_type || "").toLowerCase() === filterLabour;

    return matchSearch && matchSkill && matchLGA && matchType && matchLabour;
  });

  const filterPanelProps = { skills, skillsMap, filterSkill, setFilterSkill, filterLGA, setFilterLGA, filterType, setFilterType, filterLabour, setFilterLabour, activeFilters, clearFilters };

  return (
    <div style={{ fontFamily:"'Outfit','Segoe UI',sans-serif", background:"#f0fdf4", minHeight:"100vh" }}>
      <style>{GLOBAL_CSS}</style>

      {/* PAGE HEADER */}
      <section style={{ background:"linear-gradient(135deg,#f0fdf4 0%,#dcfce7 60%,#bbf7d0 100%)", padding:"52px 24px 40px", borderBottom:"1.5px solid #bbf7d0" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ display:"inline-block", background:"#fff", color:"#16a34a", borderRadius:50, padding:"6px 16px", fontSize:13, fontWeight:700, marginBottom:16, border:"1.5px solid #bbf7d0" }}>
            📋 Verified Listings
          </div>
          <h1 style={{ fontSize:"clamp(28px,4vw,44px)", fontWeight:900, color:"#14532d", margin:"0 0 10px" }}>Browse Job Listings</h1>
          <p style={{ fontSize:16, color:"#166534", margin:"0 0 28px", maxWidth:520, lineHeight:1.6 }}>
            Every listing here has been reviewed by our team. Find work across all 10 LGAs of Oke-Ogun.
          </p>
          {/* Search */}
          <div style={{ position:"relative", maxWidth:560 }}>
            <div style={{ position:"absolute", left:16, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
              <SearchIcon />
            </div>
            <input
              type="text" placeholder="Search by job title, employer, or skill…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width:"100%", padding:"14px 16px 14px 46px", border:"1.5px solid #bbf7d0", borderRadius:50, background:"#fff", fontSize:14, color:"#14532d", boxShadow:"0 2px 8px rgba(22,163,74,0.08)", transition:"border 0.15s,box-shadow 0.15s" }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"#f0fdf4", border:"none", borderRadius:"50%", width:26, height:26, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#16a34a" }}>
                <CloseIcon />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* MAIN */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"32px 24px 64px", display:"flex", gap:28, alignItems:"flex-start" }}>

        {/* Sidebar — desktop only */}
        {!isMobile && (
          <aside style={{ width:260, flexShrink:0, background:"#fff", borderRadius:20, padding:"24px 20px", border:"1.5px solid #dcfce7", position:"sticky", top:24 }}>
            <FilterPanel {...filterPanelProps} />
          </aside>
        )}

        {/* Job list */}
        <div style={{ flex:1, minWidth:0 }}>
          {/* Toolbar */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:12 }}>
            <p style={{ fontSize:14, color:"#166534", fontWeight:600, margin:0 }}>
              {loading ? "Loading…" : `${filtered.length} listing${filtered.length !== 1 ? "s" : ""} found`}
            </p>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              {isMobile && (
                <button onClick={() => setShowFilters(v => !v)} style={{ display:"flex", alignItems:"center", gap:6, background: activeFilters > 0 ? "#16a34a" : "#fff", color: activeFilters > 0 ? "#fff" : "#16a34a", border:"1.5px solid #16a34a", borderRadius:50, padding:"8px 16px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                  <FilterIcon /> Filters {activeFilters > 0 && `(${activeFilters})`}
                </button>
              )}
              {activeFilters > 0 && (
                <button onClick={clearFilters} style={{ background:"none", border:"none", color:"#16a34a", fontSize:13, fontWeight:600, cursor:"pointer", textDecoration:"underline", padding:0 }}>
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilters > 0 && (
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:20 }}>
              {filterLabour && <FilterChip label={filterLabour.charAt(0).toUpperCase()+filterLabour.slice(1)} onRemove={() => setFilterLabour("")} />}
              {filterType   && <FilterChip label={JOB_TYPE_LABEL[filterType] || filterType} onRemove={() => setFilterType("")} />}
              {filterLGA    && <FilterChip label={filterLGA} onRemove={() => setFilterLGA("")} />}
              {filterSkill  && <FilterChip label={skillsMap[filterSkill]?.name || filterSkill} onRemove={() => setFilterSkill("")} />}
            </div>
          )}

          {/* Mobile filter drawer */}
          {isMobile && showFilters && (
            <div style={{ background:"#fff", borderRadius:20, padding:"24px 20px", border:"1.5px solid #dcfce7", marginBottom:20 }}>
              <FilterPanel {...filterPanelProps} />
            </div>
          )}

          {/* States */}
          {loading && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {[...Array(4)].map((_,i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loading && error && (
            <div style={{ background:"#fff", borderRadius:20, padding:"40px 24px", textAlign:"center", border:"1.5px solid #dcfce7" }}>
              <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
              <p style={{ color:"#14532d", fontWeight:700, fontSize:16, margin:"0 0 6px" }}>Something went wrong</p>
              <p style={{ color:"#166534", fontSize:14, margin:0 }}>{error}</p>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div style={{ background:"#fff", borderRadius:20, padding:"60px 24px", textAlign:"center", border:"1.5px dashed #bbf7d0" }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
              <p style={{ color:"#14532d", fontWeight:800, fontSize:18, margin:"0 0 8px" }}>No listings match your search</p>
              <p style={{ color:"#166534", fontSize:14, margin:"0 0 20px" }}>Try adjusting your filters or search term.</p>
              <button onClick={clearFilters} style={{ background:"#16a34a", color:"#fff", border:"none", padding:"12px 28px", borderRadius:50, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                Clear Filters
              </button>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {filtered.map((job, i) => <JobCard key={job.id} job={job} index={i} skillsMap={skillsMap} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
