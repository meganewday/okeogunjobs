import { Link } from 'react-router-dom'
import { APP_NAME, APP_TAGLINE } from '../config/constants'

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.inner}>
        <div style={styles.grid}>
          <div>
            <p style={styles.logo}>{APP_NAME}</p>
            <p style={styles.tagline}>{APP_TAGLINE}</p>
            <p style={styles.region}>Serving the Oke-Ogun geopolitical zone, Oyo State, Nigeria.</p>
          </div>
          <div>
            <p style={styles.heading}>Quick Links</p>
            <div style={styles.linkCol}>
              <Link to="/" style={styles.link}>Home</Link>
              <Link to="/jobs" style={styles.link}>Browse Jobs</Link>
              <Link to="/register" style={styles.link}>Register as Job Seeker</Link>
              <Link to="/faq" style={styles.link}>FAQ</Link>
              <Link to="/privacy" style={styles.link}>Privacy Policy</Link>
            </div>
          </div>
          <div>
            <p style={styles.heading}>For Employers</p>
            <div style={styles.linkCol}>
              <Link to="/post-job" style={styles.link}>Post a Job</Link>
              <Link to="/employer/signup" style={styles.link}>Create Employer Account</Link>
              <Link to="/employer/login" style={styles.link}>Employer Login</Link>
              <Link to="/faq" style={styles.link}>Employer FAQ</Link>
            </div>
          </div>
          <div>
            <p style={styles.heading}>Contact</p>
            <p style={styles.infoText}>Have a question or need support? Reach us via WhatsApp.</p>
            <a
              href="https://wa.me/2348131626807"
              target="_blank"
              rel="noreferrer"
              style={styles.whatsappBtn}
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
        <div style={styles.bottom}>
          <p style={styles.copy}>
            {String.fromCharCode(169)} {new Date().getFullYear()} {APP_NAME}. Built for the Oke-Ogun community.
          </p>
          <p style={styles.copy}>
            Designed by{' '}
            <a
              href="https://vibestudio.ng"
              target="_blank"
              rel="noreferrer nofollow"
              style={{ color: '#aaa', textDecoration: 'underline' }}
            >
              Vibe Studio NG
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

const styles = {
  footer: { backgroundColor: '#111', padding: '48px 24px 24px' },
  inner: { maxWidth: '1200px', margin: '0 auto' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '32px',
    marginBottom: '40px',
  },
  logo: { fontSize: '20px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' },
  tagline: { fontSize: '13px', color: '#888', lineHeight: '1.6', marginBottom: '8px' },
  region: { fontSize: '12px', color: '#666', lineHeight: '1.6' },
  heading: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  linkCol: { display: 'flex', flexDirection: 'column', gap: '8px' },
  link: { fontSize: '13px', color: '#aaa', textDecoration: 'none' },
  infoText: { fontSize: '13px', color: '#888', lineHeight: '1.6', marginBottom: '12px' },
  whatsappBtn: {
    display: 'inline-block',
    padding: '8px 16px',
    backgroundColor: '#25D366',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    textDecoration: 'none',
  },
  bottom: {
    borderTop: '1px solid #222',
    paddingTop: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '8px',
  },
  copy: { fontSize: '12px', color: '#555' },
}
