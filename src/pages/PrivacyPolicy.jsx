import { APP_NAME } from '../config/constants'

const SECTIONS = [
  {
    title: 'Who We Are',
    content: `${APP_NAME} is a free community job board serving the Oke-Ogun geopolitical zone of Oyo State, Nigeria. This platform connects job seekers — skilled workers, unskilled workers, and students — with employers and organisations across 9 LGAs in the region.`,
  },
  {
    title: 'What Information We Collect',
    content: `We collect information you provide directly when you register or post a job on the platform.

For job seekers, this includes your full name, phone number, WhatsApp number, gender, age range, location, ward, LGA, skills, education level, years of experience, and optionally a CV file. Students and IT/SIWES applicants also provide institution name, course of study, academic level, and availability period.

For employers, this includes your organisation name, contact person name, phone number, and optionally an email address.

When you create an account, we also collect your email address and store it securely via Supabase Authentication.`,
  },
  {
    title: 'How We Use Your Information',
    content: `We use the information you provide to operate the platform. Specifically:

— Job seeker profiles are made visible to employers searching for candidates on the platform.
— Job listings posted by employers are made visible to job seekers browsing the platform.
— Your contact details (phone and WhatsApp number) are used to facilitate direct communication between job seekers and employers.
— Your email address is used to send account confirmation and password reset emails only. We do not send marketing emails.`,
  },
  {
    title: 'Who Can See Your Information',
    content: `Approved job seeker profiles are visible to anyone using the platform, including employers and visitors who have not registered. This includes your name, location, skills, education level, and experience. Your phone number is not shown publicly on your profile but is shared with employers when you apply for a job directly on the platform.

Approved job listings are visible to all visitors. The employer's organisation name and phone number are shown on each listing.`,
  },
  {
    title: 'CV Uploads',
    content: `If you upload a CV, it is stored in a secure file storage bucket provided by Supabase. The file is accessible via a direct link. Do not upload documents containing sensitive information such as your bank account details, NIN, or BVN.`,
  },
  {
    title: 'Data Retention',
    content: `Your profile or job listing remains on the platform until you request its removal. If you would like your data deleted, contact us at the email address below and we will remove it within 7 working days.`,
  },
  {
    title: 'Cookies and Tracking',
    content: `${APP_NAME} does not use advertising cookies or third-party tracking tools. We use only the technical cookies required to keep you logged in to your account during a session.`,
  },
  {
    title: 'Third-Party Services',
    content: `We use the following third-party services to operate the platform:

— Supabase (supabase.com) — database, authentication, and file storage. Your data is stored on Supabase servers in West EU (Ireland).
— Vercel (vercel.com) — website hosting and delivery.

We do not sell your data to any third party.`,
  },
  {
    title: 'Your Rights',
    content: `You have the right to request access to the personal information we hold about you, to request corrections, or to request deletion. To exercise any of these rights, contact us at the email address below.`,
  },
  {
    title: 'Changes to This Policy',
    content: `We may update this policy from time to time. When we do, the date at the bottom of this page will be updated. Continued use of the platform after changes are posted means you accept the updated policy.`,
  },
  {
    title: 'Contact',
    content: `If you have any questions about this privacy policy or how your data is handled, contact us at:

privacy@okeogunjobs.com (placeholder — update before launch)`,
  },
]

export default function PrivacyPolicy() {
  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <div style={styles.pageHeader}>
          <h1 style={styles.title}>Privacy Policy</h1>
          <p style={styles.meta}>
            {APP_NAME} &mdash; Last updated: March 2026
          </p>
        </div>

        <div style={styles.intro}>
          <p style={styles.introText}>
            This page explains what information {APP_NAME} collects from people who
            use the platform, how that information is used, and what rights you have
            over your data. Please read it before registering or posting a job.
          </p>
        </div>

        <div style={styles.sections}>
          {SECTIONS.map((section, index) => (
            <div key={index} style={styles.section}>
              <h2 style={styles.sectionTitle}>{section.title}</h2>
              {section.content.split('\n').map((para, i) => (
                para.trim() ? (
                  <p key={i} style={styles.sectionText}>{para.trim()}</p>
                ) : null
              ))}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f5f7f5', padding: '48px 24px' },
  container: { maxWidth: '760px', margin: '0 auto' },
  pageHeader: { marginBottom: '32px' },
  title: { fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 'bold', color: '#1a6b3c', marginBottom: '8px' },
  meta: { fontSize: '13px', color: '#aaa' },
  intro: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px 28px', marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderLeft: '4px solid #1a6b3c' },
  introText: { fontSize: '15px', color: '#444', lineHeight: '1.8', margin: 0 },
  sections: { display: 'flex', flexDirection: 'column', gap: '4px' },
  section: { backgroundColor: '#fff', borderRadius: '12px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  sectionTitle: { fontSize: '17px', fontWeight: '700', color: '#1a6b3c', marginBottom: '12px', paddingBottom: '8px', borderBottom: '2px solid #e8f5ee' },
  sectionText: { fontSize: '14px', color: '#444', lineHeight: '1.8', marginBottom: '10px' },
}
