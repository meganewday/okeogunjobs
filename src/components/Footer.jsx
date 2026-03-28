import { Link } from 'react-router-dom'
import { APP_NAME, APP_TAGLINE } from '../config/constants'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
  .oj-footer-link {
    font-size: 13px;
    color: #86efac;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.15s;
    font-family: 'Outfit', sans-serif;
  }
  .oj-footer-link:hover { color: #fff; }
  .oj-wa-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    background: #25D366;
    color: #fff;
    border-radius: 50px;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    font-family: 'Outfit', sans-serif;
    transition: transform 0.15s, box-shadow 0.15s;
    box-shadow: 0 3px 10px rgba(37,211,102,0.3);
  }
  .oj-wa-btn:hover { transform: translateY(-1px); box-shadow: 0 5px 14px rgba(37,211,102,0.4); }
`

// WhatsApp SVG icon
const WaIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
)

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{
      background: 'linear-gradient(180deg, #14532d 0%, #0f3d21 100%)',
      padding: '56px 24px 28px',
      fontFamily: "'Outfit', sans-serif",
    }}>
      <style>{CSS}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* ── GRID ────────────────────────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 40,
          marginBottom: 48,
        }}>

          {/* Brand column */}
          <div>
            {/* Logo wordmark */}
            <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:10, textDecoration:'none', marginBottom:16 }}>
              <img src="/logo.png" alt="OkeOgunJobs" style={{ height:40, width:'auto', borderRadius:8 }} />
              <span style={{ fontFamily:"'Outfit',sans-serif", fontSize:17, fontWeight:900, letterSpacing:'-0.02em', lineHeight:1 }}>
                <span style={{ color:'#fff' }}>Oke-Ogun </span>
                <span style={{ color:'#4ade80' }}>Jobs</span>
              </span>
            </Link>
            {APP_TAGLINE && (
              <p style={{ fontSize:13, color:'#86efac', lineHeight:1.65, margin:'0 0 8px' }}>
                {APP_TAGLINE}
              </p>
            )}
            <p style={{ fontSize:12, color:'#4b8a5e', lineHeight:1.65, margin:0 }}>
              Serving the Oke-Ogun geopolitical zone, Oyo State, Nigeria.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:'#4ade80', marginBottom:14, textTransform:'uppercase', letterSpacing:'0.08em' }}>
              Quick Links
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <Link to="/"         className="oj-footer-link">Home</Link>
              <Link to="/jobs"     className="oj-footer-link">Browse Jobs</Link>
              <Link to="/signup"   className="oj-footer-link">Register as Job Seeker</Link>
              <Link to="/faq"      className="oj-footer-link">FAQ</Link>
              <Link to="/privacy"  className="oj-footer-link">Privacy Policy</Link>
            </div>
          </div>

          {/* For Employers */}
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:'#4ade80', marginBottom:14, textTransform:'uppercase', letterSpacing:'0.08em' }}>
              For Employers
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <Link to="/post-job"         className="oj-footer-link">Post a Job</Link>
              <Link to="/employer/signup"  className="oj-footer-link">Create Employer Account</Link>
              <Link to="/employer/login"   className="oj-footer-link">Employer Login</Link>
              <Link to="/faq"              className="oj-footer-link">Employer FAQ</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:'#4ade80', marginBottom:14, textTransform:'uppercase', letterSpacing:'0.08em' }}>
              Contact
            </p>
            <p style={{ fontSize:13, color:'#86efac', lineHeight:1.65, margin:'0 0 16px' }}>
              Have a question or need support? Reach us via WhatsApp.
            </p>
            <a
              href="https://wa.me/2348131626807"
              target="_blank"
              rel="noreferrer"
              className="oj-wa-btn"
            >
              <WaIcon /> Chat on WhatsApp
            </a>
          </div>
        </div>

        {/* ── DIVIDER ─────────────────────────────────────────────────────── */}
        <div style={{ height:1, background:'rgba(74,222,128,0.15)', marginBottom:24 }} />

        {/* ── BOTTOM BAR ──────────────────────────────────────────────────── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
          <p style={{ fontSize:12, color:'#4b8a5e', margin:0 }}>
            © {year} {APP_NAME}. Built for the Oke-Ogun community.
          </p>
          <p style={{ fontSize:12, color:'#4b8a5e', margin:0 }}>
            Built by{' '}
            <a
              href="https://vibestudio.ng"
              target="_blank"
              rel="noreferrer nofollow"
              style={{ color:'#86efac', textDecoration:'underline', fontWeight:600 }}
            >
              Vibe Studio NG
            </a>
          </p>
        </div>

      </div>
    </footer>
  )
}
