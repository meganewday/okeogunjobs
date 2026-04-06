import { Link } from 'react-router-dom'
import { APP_NAME, WHATSAPP_SUPPORT } from '../config/constants'

function formatWhatsappLink(number) {
  const cleaned = number.replace(/\D/g, '')
  if (cleaned.startsWith('0')) return `https://wa.me/234${cleaned.slice(1)}`
  if (cleaned.startsWith('234')) return `https://wa.me/${cleaned}`
  return `https://wa.me/${cleaned}`
}

export default function UpgradePlan() {
  const whatsappUrl = formatWhatsappLink(WHATSAPP_SUPPORT)

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Upgrade Plan</h1>
        <p style={styles.subtitle}>
          Unlock HR & Employee Management for your employer account on {APP_NAME}. This upgrade lets you manage team members, track employment status, and keep staff records in one place.
        </p>

        <div style={styles.grid}>
          <div style={styles.featureCard}>
            <h2 style={styles.featureTitle}>Manage Your Team</h2>
            <p style={styles.featureText}>Add and edit employee records, update roles, and track contract status without leaving your dashboard.</p>
          </div>
          <div style={styles.featureCard}>
            <h2 style={styles.featureTitle}>Track Employment Status</h2>
            <p style={styles.featureText}>Change employee status to active, on leave, suspended, or terminated with a single click.</p>
          </div>
          <div style={styles.featureCard}>
            <h2 style={styles.featureTitle}>Integrate Applications</h2>
            <p style={styles.featureText}>Convert job applicants into employees and keep your hiring workflow connected.</p>
          </div>
        </div>

        <div style={styles.pricingCard}>
          <h2 style={styles.pricingTitle}>Pay to unlock this feature</h2>
          <p style={styles.pricingText}>
            HR & Employee Management is available for paid employer accounts only. If you already have a plan, contact us to activate access on your organisation.
          </p>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" style={styles.whatsappBtn}>
            Contact support on WhatsApp
          </a>
        </div>

        <div style={styles.noteCard}>
          <p style={styles.noteText}><strong>Need help?</strong> Reach out to our support team and we will guide you through the upgrade process.</p>
          <p style={styles.contactLine}>WhatsApp: <a href={whatsappUrl} target="_blank" rel="noreferrer" style={styles.contactLink}>{WHATSAPP_SUPPORT}</a></p>
        </div>

        <div style={styles.actions}>
          <Link to="/employer/dashboard" style={styles.secondaryBtn}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#f0fdf4', padding: '40px 24px', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' },
  card: { maxWidth: '860px', width: '100%', background: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 18px 60px rgba(15, 23, 42, 0.08)', border: '1px solid #dcfce7' },
  title: { margin: 0, fontSize: 'clamp(32px, 4vw, 42px)', color: '#14532d', fontWeight: 900 },
  subtitle: { marginTop: '16px', color: '#334155', lineHeight: 1.75, fontSize: '16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginTop: '32px' },
  featureCard: { background: '#f8fafc', borderRadius: '18px', padding: '22px', border: '1px solid #d1fae5' },
  featureTitle: { margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f5132' },
  featureText: { marginTop: '10px', color: '#475569', fontSize: '14px', lineHeight: 1.7 },
  pricingCard: { background: '#ecfdf5', borderRadius: '18px', padding: '26px', marginTop: '30px', border: '1px solid #a7f3d0' },
  pricingTitle: { margin: 0, fontSize: '20px', fontWeight: 800, color: '#134e4a' },
  pricingText: { marginTop: '10px', color: '#164e63', fontSize: '15px', lineHeight: 1.75 },
  whatsappBtn: { display: 'inline-flex', marginTop: '18px', padding: '14px 24px', background: '#25d366', color: '#fff', borderRadius: '14px', textDecoration: 'none', fontWeight: 700, boxShadow: '0 10px 20px rgba(37, 211, 110, 0.2)' },
  noteCard: { background: '#fff7ed', borderRadius: '18px', border: '1px solid #fed7aa', padding: '20px 24px', marginTop: '26px' },
  noteText: { margin: 0, color: '#92400e', fontSize: '15px', lineHeight: 1.7 },
  contactLine: { marginTop: '10px', color: '#92400e', fontSize: '14px' },
  contactLink: { color: '#1d4ed8', textDecoration: 'underline' },
  actions: { display: 'flex', justifyContent: 'flex-start', gap: '12px', marginTop: '28px', flexWrap: 'wrap' },
  secondaryBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 22px', borderRadius: '14px', background: '#fff', color: '#065f46', border: '1px solid #d1fae5', textDecoration: 'none', fontWeight: 700 },
}
