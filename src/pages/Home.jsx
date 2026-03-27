import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

// ─── Animated counter hook ───────────────────────────────────────────────────
function useCounter(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

// ─── Intersection observer hook ──────────────────────────────────────────────
function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

// ─── SVG Illustrations ───────────────────────────────────────────────────────
const HeroIllustration = () => (
  <svg viewBox="0 0 480 400" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxWidth: 520 }}>
    {/* Background blobs */}
    <ellipse cx="300" cy="200" rx="160" ry="150" fill="#bbf7d0" opacity="0.5" />
    <ellipse cx="180" cy="280" rx="100" ry="80" fill="#86efac" opacity="0.3" />

    {/* Building / office */}
    <rect x="60" y="160" width="100" height="200" rx="8" fill="#166534" />
    <rect x="72" y="175" width="22" height="22" rx="3" fill="#4ade80" />
    <rect x="104" y="175" width="22" height="22" rx="3" fill="#4ade80" />
    <rect x="72" y="210" width="22" height="22" rx="3" fill="#86efac" />
    <rect x="104" y="210" width="22" height="22" rx="3" fill="#4ade80" />
    <rect x="72" y="245" width="22" height="22" rx="3" fill="#86efac" />
    <rect x="104" y="245" width="22" height="22" rx="3" fill="#86efac" />
    <rect x="80" y="305" width="40" height="55" rx="4" fill="#14532d" />
    <rect x="60" y="152" width="100" height="12" rx="4" fill="#15803d" />

    {/* Taller building */}
    <rect x="330" y="100" width="90" height="260" rx="8" fill="#15803d" />
    <rect x="340" y="115" width="18" height="18" rx="3" fill="#86efac" />
    <rect x="366" y="115" width="18" height="18" rx="3" fill="#4ade80" />
    <rect x="392" y="115" width="18" height="18" rx="3" fill="#86efac" />
    <rect x="340" y="145" width="18" height="18" rx="3" fill="#4ade80" />
    <rect x="366" y="145" width="18" height="18" rx="3" fill="#86efac" />
    <rect x="392" y="145" width="18" height="18" rx="3" fill="#4ade80" />
    <rect x="340" y="175" width="18" height="18" rx="3" fill="#86efac" />
    <rect x="366" y="175" width="18" height="18" rx="3" fill="#4ade80" />
    <rect x="392" y="175" width="18" height="18" rx="3" fill="#bbf7d0" />
    <rect x="340" y="205" width="18" height="18" rx="3" fill="#4ade80" />
    <rect x="366" y="205" width="18" height="18" rx="3" fill="#86efac" />
    <rect x="392" y="205" width="18" height="18" rx="3" fill="#4ade80" />
    <rect x="352" y="300" width="46" height="60" rx="4" fill="#14532d" />
    <rect x="330" y="92" width="90" height="12" rx="4" fill="#16a34a" />

    {/* Person 1 — job seeker with briefcase */}
    <circle cx="180" cy="210" r="22" fill="#fde68a" />
    <rect x="160" y="232" width="40" height="60" rx="10" fill="#16a34a" />
    <rect x="155" y="238" width="15" height="40" rx="6" fill="#fde68a" />
    <rect x="210" y="238" width="15" height="40" rx="6" fill="#fde68a" />
    <rect x="165" y="292" width="16" height="30" rx="6" fill="#14532d" />
    <rect x="199" y="292" width="16" height="30" rx="6" fill="#14532d" />
    {/* briefcase */}
    <rect x="190" y="258" width="26" height="20" rx="4" fill="#92400e" />
    <rect x="196" y="254" width="14" height="6" rx="2" fill="#b45309" />
    {/* smile */}
    <path d="M173 220 Q180 226 187 220" stroke="#92400e" strokeWidth="2" strokeLinecap="round" fill="none"/>

    {/* Person 2 — employer with clipboard */}
    <circle cx="290" cy="195" r="22" fill="#fcd34d" />
    <rect x="270" y="217" width="40" height="65" rx="10" fill="#166534" />
    <rect x="264" y="224" width="15" height="42" rx="6" fill="#fcd34d" />
    <rect x="311" y="224" width="15" height="42" rx="6" fill="#fcd34d" />
    <rect x="274" y="282" width="16" height="30" rx="6" fill="#14532d" />
    <rect x="300" y="282" width="16" height="30" rx="6" fill="#14532d" />
    {/* clipboard */}
    <rect x="308" y="230" width="22" height="28" rx="3" fill="#f0fdf4" />
    <rect x="312" y="238" width="14" height="2" rx="1" fill="#16a34a" />
    <rect x="312" y="243" width="10" height="2" rx="1" fill="#16a34a" />
    <rect x="312" y="248" width="12" height="2" rx="1" fill="#16a34a" />
    {/* smile */}
    <path d="M283 205 Q290 212 297 205" stroke="#92400e" strokeWidth="2" strokeLinecap="round" fill="none"/>

    {/* Person 3 — student with book */}
    <circle cx="230" cy="155" r="20" fill="#fed7aa" />
    <rect x="212" y="175" width="36" height="55" rx="10" fill="#22c55e" />
    <rect x="206" y="182" width="14" height="36" rx="6" fill="#fed7aa" />
    <rect x="248" y="182" width="14" height="36" rx="6" fill="#fed7aa" />
    <rect x="214" y="230" width="14" height="26" rx="6" fill="#14532d" />
    <rect x="234" y="230" width="14" height="26" rx="6" fill="#14532d" />
    {/* book */}
    <rect x="215" y="188" width="20" height="24" rx="2" fill="#fef9c3" />
    <rect x="217" y="193" width="12" height="2" rx="1" fill="#15803d" />
    <rect x="217" y="198" width="10" height="2" rx="1" fill="#15803d" />
    {/* smile */}
    <path d="M224 163 Q230 169 236 163" stroke="#92400e" strokeWidth="2" strokeLinecap="round" fill="none"/>

    {/* Floating badges */}
    <rect x="30" y="80" width="90" height="36" rx="18" fill="#ffffff" filter="url(#shadow)" />
    <text x="75" y="103" textAnchor="middle" fontSize="12" fill="#15803d" fontWeight="700">✓ Job Posted</text>

    <rect x="360" y="60" width="100" height="36" rx="18" fill="#ffffff" filter="url(#shadow)" />
    <text x="410" y="83" textAnchor="middle" fontSize="12" fill="#15803d" fontWeight="700">🎉 Hired!</text>

    <rect x="10" y="280" width="110" height="36" rx="18" fill="#ffffff" filter="url(#shadow)" />
    <text x="65" y="303" textAnchor="middle" fontSize="11" fill="#166534" fontWeight="700">📋 100+ Listings</text>

    {/* Ground */}
    <rect x="40" y="356" width="400" height="10" rx="5" fill="#bbf7d0" />

    {/* Sun / decoration */}
    <circle cx="420" cy="70" r="28" fill="#fef08a" opacity="0.8" />
    <circle cx="420" cy="70" r="20" fill="#fde047" />

    <defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.15" />
      </filter>
    </defs>
  </svg>
);

const SkillWorkerIcon = () => (
  <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" width="56" height="56">
    <circle cx="28" cy="28" r="28" fill="#dcfce7"/>
    <rect x="18" y="20" width="20" height="22" rx="4" fill="#16a34a"/>
    <circle cx="28" cy="17" r="7" fill="#fde68a"/>
    <rect x="22" y="32" width="12" height="2" rx="1" fill="#bbf7d0"/>
    <rect x="22" y="36" width="8" height="2" rx="1" fill="#bbf7d0"/>
  </svg>
);

const EmployerIcon = () => (
  <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" width="56" height="56">
    <circle cx="28" cy="28" r="28" fill="#d1fae5"/>
    <rect x="16" y="24" width="24" height="20" rx="3" fill="#166534"/>
    <rect x="22" y="18" width="12" height="8" rx="2" fill="#15803d"/>
    <rect x="24" y="30" width="8" height="6" rx="1" fill="#4ade80"/>
    <rect x="24" y="38" width="3" height="6" rx="1" fill="#bbf7d0"/>
    <rect x="29" y="38" width="3" height="6" rx="1" fill="#bbf7d0"/>
  </svg>
);

const GradIcon = () => (
  <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" width="56" height="56">
    <circle cx="28" cy="28" r="28" fill="#ecfdf5"/>
    <polygon points="28,14 42,22 28,30 14,22" fill="#15803d"/>
    <rect x="24" y="30" width="8" height="12" rx="2" fill="#16a34a"/>
    <rect x="20" y="40" width="16" height="3" rx="1.5" fill="#4ade80"/>
    <circle cx="40" cy="22" r="3" fill="#fde68a"/>
    <rect x="39" y="22" width="2" height="10" rx="1" fill="#15803d"/>
  </svg>
);

const UnkilledIcon = () => (
  <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" width="56" height="56">
    <circle cx="28" cy="28" r="28" fill="#f0fdf4"/>
    <circle cx="28" cy="18" r="8" fill="#fcd34d"/>
    <rect x="18" y="26" width="20" height="18" rx="4" fill="#22c55e"/>
    <rect x="13" y="28" width="8" height="14" rx="4" fill="#fcd34d"/>
    <rect x="35" y="28" width="8" height="14" rx="4" fill="#fcd34d"/>
    <rect x="20" y="44" width="7" height="10" rx="3" fill="#14532d"/>
    <rect x="29" y="44" width="7" height="10" rx="3" fill="#14532d"/>
  </svg>
);

const InternIcon = () => (
  <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" width="56" height="56">
    <circle cx="28" cy="28" r="28" fill="#dcfce7"/>
    <circle cx="28" cy="17" r="7" fill="#fde68a"/>
    <rect x="20" y="24" width="16" height="20" rx="4" fill="#16a34a"/>
    <rect x="22" y="28" width="12" height="16" rx="3" fill="#f0fdf4"/>
    <rect x="24" y="31" width="8" height="2" rx="1" fill="#16a34a"/>
    <rect x="24" y="35" width="6" height="2" rx="1" fill="#16a34a"/>
    <rect x="24" y="39" width="7" height="2" rx="1" fill="#16a34a"/>
  </svg>
);

const PartnerIcon = () => (
  <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" width="56" height="56">
    <circle cx="28" cy="28" r="28" fill="#bbf7d0"/>
    <circle cx="20" cy="22" r="7" fill="#fde68a"/>
    <circle cx="36" cy="22" r="7" fill="#fcd34d"/>
    <path d="M10 44 Q10 34 20 34 Q28 34 28 34 Q28 34 36 34 Q46 34 46 44" fill="#15803d"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="10" fill="#16a34a"/>
    <path d="M6 10.5l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─── Data ─────────────────────────────────────────────────────────────────────
const WHO_WE_SERVE = [
  { icon: <SkillWorkerIcon />, title: "Skilled Workers", desc: "Carpenters, welders, tailors, nurses, teachers — if you have a trade or profession, we match you with employers who need exactly that." },
  { icon: <EmployerIcon />,    title: "Local Employers",  desc: "Businesses and organizations across Oke-Ogun can post verified job listings and reach a pool of local talent fast." },
  { icon: <GradIcon />,        title: "Fresh Graduates",  desc: "Newly qualified? Register your profile and get notified when relevant openings appear across the 10 LGAs we cover." },
  { icon: <PartnerIcon />,     title: "Community Partners", desc: "NGOs, cooperatives, and government agencies working in Oke-Ogun can partner with us to connect residents to opportunities." },
  { icon: <UnkilledIcon />,    title: "Unskilled Workers", desc: "No formal training? No problem. We list general labour and entry-level roles suited to anyone ready to work." },
  { icon: <InternIcon />,      title: "Interns & Students", desc: "SIWES, IT, and industrial attachment placements for ND, HND, and university students studying in or from Oke-Ogun." },
];

const HOW_IT_WORKS = [
  { num: "01", color: "#16a34a", bg: "#dcfce7", title: "Register", desc: "Create your free job seeker profile or post a job listing in minutes." },
  { num: "02", color: "#15803d", bg: "#bbf7d0", title: "Get Reviewed", desc: "Our admin team checks every listing and profile before it goes live." },
  { num: "03", color: "#166534", bg: "#86efac", title: "Browse & Match", desc: "Job seekers browse live listings. Employers receive matched applicant profiles." },
  { num: "04", color: "#14532d", bg: "#4ade80", title: "Connect", desc: "Apply via WhatsApp or phone and get hired — right here in Oke-Ogun." },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ value, suffix = "", label, start }) {
  const count = useCounter(value, 1800, start);
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 40, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: 13, color: "#bbf7d0", marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Home() {
  const [statsRef, statsInView] = useInView(0.3);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ fontFamily: "'Outfit', 'Segoe UI', sans-serif", background: "#f0fdf4", overflowX: "hidden" }}>
      {/* Load Outfit font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .hero-text { animation: slideInLeft 0.7s ease both; }
        .hero-img  { animation: slideInRight 0.8s 0.2s ease both; }
        .fade-card {
          opacity: 0;
          animation: fadeUp 0.5s ease forwards;
        }
        .badge-float { animation: floatBadge 3s ease-in-out infinite; }
        .btn-primary {
          background: #16a34a;
          color: #fff;
          border: none;
          padding: 14px 28px;
          border-radius: 50px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: transform 0.15s, box-shadow 0.15s;
          box-shadow: 0 4px 14px rgba(22,163,74,0.35);
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(22,163,74,0.45); }
        .btn-outline {
          background: transparent;
          color: #16a34a;
          border: 2px solid #16a34a;
          padding: 12px 26px;
          border-radius: 50px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: all 0.15s;
        }
        .btn-outline:hover { background: #16a34a; color: #fff; }
        .who-card {
          background: #fff;
          border-radius: 20px;
          padding: 28px 24px;
          transition: transform 0.2s, box-shadow 0.2s;
          border: 1.5px solid #dcfce7;
        }
        .who-card:hover { transform: translateY(-6px); box-shadow: 0 12px 30px rgba(22,163,74,0.12); }
        .job-card {
          background: #fff;
          border-radius: 16px;
          padding: 22px 24px;
          border-left: 5px solid #16a34a;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .job-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(22,163,74,0.12); }
        .step-card {
          background: #fff;
          border-radius: 20px;
          padding: 32px 24px;
          text-align: center;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s;
        }
        .step-card:hover { transform: translateY(-4px); }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{
        background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)",
        padding: "60px 24px 40px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative dots */}
        <div style={{ position: "absolute", top: 40, left: 40, width: 12, height: 12, borderRadius: "50%", background: "#4ade80", opacity: 0.6 }} />
        <div style={{ position: "absolute", top: 80, left: 80, width: 8, height: 8, borderRadius: "50%", background: "#16a34a", opacity: 0.4 }} />
        <div style={{ position: "absolute", top: 30, right: 60, width: 16, height: 16, borderRadius: "50%", background: "#22c55e", opacity: 0.5 }} />
        <div style={{ position: "absolute", bottom: 60, left: 30, width: 20, height: 20, borderRadius: "50%", background: "#bbf7d0" }} />

        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 40, justifyContent: "space-between" }}>
          
          {/* Left text */}
          <div className="hero-text" style={{ flex: "1 1 320px", maxWidth: 520 }}>
            {/* Badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#fff", border: "1.5px solid #bbf7d0", borderRadius: 50,
              padding: "6px 16px", marginBottom: 24, fontSize: 13, fontWeight: 600, color: "#16a34a"
            }}>
              <span style={{ fontSize: 16 }}>🌿</span> Oke-Ogun's Job Platform
            </div>

            <h1 style={{
              fontSize: "clamp(32px, 5vw, 54px)",
              fontWeight: 900,
              lineHeight: 1.1,
              color: "#14532d",
              margin: "0 0 20px",
            }}>
              Real Jobs.<br />
              <span style={{ color: "#16a34a" }}>Real People.</span><br />
              Right Here.
            </h1>

            <p style={{ fontSize: 17, color: "#166534", lineHeight: 1.7, margin: "0 0 32px", maxWidth: 440 }}>
              OkeOgunJobs links skilled and unskilled indigenes across all 10 LGAs of Oke-Ogun to verified employment. Free for every job seeker.
            </p>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link to="/register" className="btn-primary">Register as Job Seeker</Link>
              <Link to="/post-job" className="btn-outline">Post a Job</Link>
            </div>

            {/* Trust signals */}
            <div style={{ display: "flex", gap: 20, marginTop: 32, flexWrap: "wrap" }}>
              {["Always free for seekers", "Admin-verified listings", "Covers 10 LGAs"].map(t => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#166534", fontWeight: 500 }}>
                  <CheckIcon /> {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right illustration */}
          <div className="hero-img" style={{ flex: "1 1 280px", display: "flex", justifyContent: "center" }}>
            <div style={{ position: "relative" }}>
              <HeroIllustration />
              {/* Floating tag */}
              <div className="badge-float" style={{
                position: "absolute", top: -10, right: -10,
                background: "#fff", borderRadius: 16, padding: "10px 16px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.1)", fontSize: 13, fontWeight: 700,
                color: "#15803d", border: "1.5px solid #dcfce7",
              }}>
                📍 Oke-Ogun, Oyo State
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section ref={statsRef} style={{
        background: "linear-gradient(135deg, #15803d, #16a34a, #22c55e)",
        padding: "48px 24px",
      }}>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 32,
        }}>
          <StatCard value={10}   suffix="+"  label="LGAs Covered"        start={statsInView} />
          <StatCard value={40}   suffix="+"  label="Skills Listed"       start={statsInView} />
          <StatCard value={0}    suffix=""   label="Cost for Job Seekers" start={statsInView} />
          <StatCard value={100}  suffix="%"  label="Listings Verified"   start={statsInView} />
        </div>
      </section>

      {/* ── WHO WE SERVE ─────────────────────────────────────────────────── */}
      <section style={{ padding: "72px 24px", background: "#f0fdf4" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{
              display: "inline-block", background: "#dcfce7", color: "#16a34a",
              borderRadius: 50, padding: "6px 18px", fontSize: 13, fontWeight: 700, marginBottom: 16
            }}>Who We Serve</div>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 900, color: "#14532d", margin: 0 }}>
              OkeOgunJobs is for everyone
            </h2>
            <p style={{ color: "#166534", fontSize: 16, marginTop: 12, maxWidth: 500, margin: "12px auto 0" }}>
              Whether you have a trade, just finished school, or need extra hands — there's a place for you here.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 24,
          }}>
            {WHO_WE_SERVE.map((card, i) => (
              <div key={card.title} className={`who-card fade-card`} style={{ animationDelay: `${i * 0.08}s` }}>
                <div style={{ marginBottom: 16 }}>{card.icon}</div>
                <h3 style={{ fontSize: 19, fontWeight: 800, color: "#14532d", margin: "0 0 10px" }}>{card.title}</h3>
                <p style={{ fontSize: 14, color: "#166534", lineHeight: 1.7, margin: 0 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section style={{ padding: "72px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{
              display: "inline-block", background: "#dcfce7", color: "#16a34a",
              borderRadius: 50, padding: "6px 18px", fontSize: 13, fontWeight: 700, marginBottom: 16
            }}>How It Works</div>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 900, color: "#14532d", margin: 0 }}>
              Four simple steps
            </h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 24,
          }}>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.num} className="step-card" style={{ animationDelay: `${i * 0.1}s` }}>
                {/* Top color bar */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: step.color, borderRadius: "20px 20px 0 0" }} />
                {/* Number badge */}
                <div style={{
                  width: 56, height: 56, borderRadius: "50%", background: step.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "16px auto 20px",
                  fontSize: 20, fontWeight: 900, color: step.color,
                }}>
                  {step.num}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#14532d", margin: "0 0 10px" }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: "#166634", lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LATEST JOBS ──────────────────────────────────────────────────── */}
      <section style={{ padding: "72px 24px", background: "#f0fdf4" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{
                display: "inline-block", background: "#dcfce7", color: "#16a34a",
                borderRadius: 50, padding: "6px 18px", fontSize: 13, fontWeight: 700, marginBottom: 12
              }}>Open Positions</div>
              <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 900, color: "#14532d", margin: 0 }}>Latest Job Listings</h2>
            </div>
            <Link to="/jobs" className="btn-outline" style={{ whiteSpace: "nowrap" }}>View All Jobs →</Link>
          </div>

          {/* Placeholder cards — replace with real Supabase data */}
          <LatestJobsPlaceholder />
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
      <section style={{
        background: "linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)",
        padding: "72px 24px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -60, left: -60, width: 200, height: 200, borderRadius: "50%", background: "#16a34a", opacity: 0.2 }} />
        <div style={{ position: "absolute", bottom: -80, right: -40, width: 240, height: 240, borderRadius: "50%", background: "#22c55e", opacity: 0.15 }} />

        <div style={{ position: "relative", maxWidth: 640, margin: "0 auto" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌿</div>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 900, color: "#fff", margin: "0 0 16px" }}>
            Ready to find work?
          </h2>
          <p style={{ fontSize: 17, color: "#bbf7d0", margin: "0 0 36px", lineHeight: 1.6 }}>
            Registration takes under three minutes. No fee. No middleman. Just real jobs from verified employers across Oke-Ogun.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/register" style={{
              background: "#fff", color: "#16a34a", fontWeight: 800, fontSize: 15,
              padding: "14px 32px", borderRadius: 50, textDecoration: "none",
              boxShadow: "0 4px 14px rgba(0,0,0,0.2)", transition: "transform 0.15s",
            }}>
              Register Free
            </Link>
            <Link to="/post-job" style={{
              background: "transparent", color: "#fff", fontWeight: 700, fontSize: 15,
              padding: "13px 30px", borderRadius: 50, textDecoration: "none",
              border: "2px solid rgba(255,255,255,0.6)", transition: "all 0.15s",
            }}>
              Post a Job
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Real Supabase job listings ───────────────────────────────────────────────
function LatestJobsPlaceholder() {
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const { data, error } = await supabase
          .from("job_listings")
          .select(`
            id,
            job_title,
            job_type,
            location,
            lga,
            labour_type,
            application_method,
            skills_required,
            employers ( organization_name, phone_number ),
            skills:skills_required ( name, category )
          `)
          .eq("status", "approved")
          .order("approved_at", { ascending: false })
          .limit(5);

        if (error) throw error;
        setJobs(data || []);
      } catch (err) {
        setError("Could not load jobs right now. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  // Labour type tag styling
  const tagStyle = {
    skilled:    { bg: "#dcfce7", text: "#166534" },
    unskilled:  { bg: "#fef9c3", text: "#854d0e" },
    internship: { bg: "#dbeafe", text: "#1e40af" },
  };

  // Job type display label
  const jobTypeLabel = {
    full_time:  "Full-time",
    part_time:  "Part-time",
    contract:   "Contract",
    internship: "Internship",
  };

  // Format WhatsApp number: 0XX → 234XX
  function toWhatsApp(phone) {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, "");
    return digits.startsWith("0") ? "234" + digits.slice(1) : digits;
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{
            background: "#fff", borderRadius: 16, padding: "22px 24px",
            borderLeft: "5px solid #dcfce7", height: 100,
            animation: "pulse 1.4s ease-in-out infinite",
          }}>
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
            <div style={{ height: 16, background: "#dcfce7", borderRadius: 8, width: "40%", marginBottom: 12 }} />
            <div style={{ height: 12, background: "#f0fdf4", borderRadius: 8, width: "60%" }} />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: "#fff", borderRadius: 16, padding: "32px 24px", textAlign: "center",
        border: "1.5px solid #dcfce7", color: "#166534", fontSize: 15,
      }}>
        {error}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div style={{
        background: "#fff", borderRadius: 16, padding: "48px 24px", textAlign: "center",
        border: "1.5px dashed #bbf7d0",
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
        <p style={{ color: "#15803d", fontWeight: 600, fontSize: 16, margin: 0 }}>No approved listings yet.</p>
        <p style={{ color: "#166534", fontSize: 14, marginTop: 6 }}>Check back soon — new jobs are reviewed daily.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {jobs.map((job, i) => {
        const employer   = job.employers;
        const labour     = (job.labour_type || "skilled").toLowerCase();
        const tag        = tagStyle[labour] || tagStyle.skilled;
        const typeLabel  = jobTypeLabel[job.job_type] || job.job_type;
        const waNumber   = toWhatsApp(employer?.phone_number);
        const waMessage  = `Hello, I'm interested in the ${job.job_title} role listed on OkeOgunJobs.`;

        // First skill category as the "label"
        const firstSkill = Array.isArray(job.skills) && job.skills.length > 0 ? job.skills[0] : null;
        const category   = firstSkill?.category || "General";

        const displayLocation = [job.location, job.lga].filter(Boolean).join(", ");

        return (
          <div key={job.id} className="job-card fade-card" style={{ animationDelay: `${i * 0.07}s` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#14532d", margin: "0 0 6px" }}>{job.job_title}</h3>
                <p style={{ fontSize: 13, color: "#15803d", margin: "0 0 10px", fontWeight: 500 }}>
                  🏢 {employer?.organization_name || "—"} &nbsp;·&nbsp; 📍 {displayLocation || "Oke-Ogun"}
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {/* Skill category */}
                  <span style={{ background: "#dcfce7", color: "#166534", borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600 }}>
                    {category}
                  </span>
                  {/* Job type */}
                  <span style={{ background: "#f0fdf4", color: "#166534", borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600, border: "1px solid #bbf7d0" }}>
                    {typeLabel}
                  </span>
                  {/* Labour type */}
                  <span style={{ background: tag.bg, color: tag.text, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600 }}>
                    {labour.charAt(0).toUpperCase() + labour.slice(1)}
                  </span>
                </div>
              </div>

              {/* Apply button — WhatsApp or phone fallback */}
              {waNumber ? (
                <a
                  href={`https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ fontSize: 13, padding: "10px 20px", whiteSpace: "nowrap" }}
                >
                  Apply via WhatsApp
                </a>
              ) : (
                <Link
                  to="/jobs"
                  className="btn-primary"
                  style={{ fontSize: 13, padding: "10px 20px", whiteSpace: "nowrap" }}
                >
                  View Job →
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
