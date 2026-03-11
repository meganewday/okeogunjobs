import { useState } from 'react'
import { Link } from 'react-router-dom'

const JOB_SEEKER_FAQS = [
  {
    q: 'Is it really free?',
    a: 'Yes. Creating your profile, browsing jobs, and applying are all completely free. There are no hidden charges now or in the future.',
  },
  {
    q: 'Do I need a smartphone to use the platform?',
    a: 'No. The platform works on any phone or computer with a browser. You do not need to install anything.',
  },
  {
    q: 'Why do I need to provide my NIN?',
    a: 'Your NIN (National Identification Number) prevents people from registering more than once. It is stored securely and is never shared with employers.',
  },
  {
    q: 'I do not have a CV. Can I still register?',
    a: 'Yes. The CV upload is optional. You can register and apply for jobs without one.',
  },
  {
    q: 'What is the difference between Skilled, Unskilled, and Student?',
    a: 'Skilled is for people with a specific trade, qualification, or professional background — such as an electrician, nurse, or teacher. Unskilled is for people available for general or physical labour. Student / IT / SIWES is for students looking for industrial attachment or placement.',
  },
  {
    q: 'A job says I am "Not eligible" to apply. Why?',
    a: 'This means the job type does not match your registered worker type. Students and unskilled workers cannot apply for skilled positions on the platform. You can still contact the employer directly via the WhatsApp button on the listing.',
  },
  {
    q: 'How do I apply for a job?',
    a: 'Log in, go to Job Listings, find a role you want, and click "Apply Now". You can add a short message to the employer before submitting. You can also contact any employer directly via the green WhatsApp button on the listing.',
  },
  {
    q: 'How do I track my applications?',
    a: 'Go to your profile page (/profile) after logging in. All your applications are listed there with their current status — Submitted, Shortlisted, Accepted, or Rejected.',
  },
  {
    q: 'I applied but never heard back. What should I do?',
    a: 'Check your application status in your profile. If it is still showing as Submitted, the employer may not have reviewed it yet. You can also reach out to them directly using the WhatsApp button on the job listing.',
  },
  {
    q: 'Can I change my worker type after registering?',
    a: 'Not directly on the platform right now. Contact us via WhatsApp and we can update it for you.',
  },
  {
    q: 'I registered but cannot log in or find my profile. What happened?',
    a: 'If you registered without creating an account (walk-in registration), your profile exists in the system but you cannot log in to view it. Create an account using the same email or phone number and contact us to link your profiles.',
  },
  {
    q: 'The confirmation email never arrived. What do I do?',
    a: 'Check your spam or junk folder first. If it is not there, go back to the signup page and try registering again, or contact us for help.',
  },
  {
    q: 'How do I reset my password?',
    a: 'Go to the login page and click "Forgot password". Enter your email and follow the link sent to your inbox.',
  },
]

const EMPLOYER_FAQS = [
  {
    q: 'How much does it cost to post a job?',
    a: 'Nothing. Posting a job is completely free. You will never be charged to list a vacancy or contact applicants.',
  },
  {
    q: 'How long does it take for my listing to go live?',
    a: 'Our team reviews every listing before it is published. This usually takes less than 24 hours, often much sooner.',
  },
  {
    q: 'How will I know when someone applies?',
    a: 'Log in to your Employer Dashboard to check your applications. You will see an application count next to each listing. WhatsApp notifications are planned for a future update.',
  },
  {
    q: 'Can I edit a job listing after posting it?',
    a: 'Contact us via WhatsApp if you need to make changes to a live listing. We can update or re-post it for you.',
  },
  {
    q: 'What if I have already filled the position?',
    a: 'Close the listing from your dashboard so it no longer appears in search results, and update the remaining applicants\' status to Rejected.',
  },
  {
    q: 'Can I register more than one account for the same business?',
    a: 'No. Each CAC number can only be registered once on the platform. If your business is not CAC-registered and you need a second account for a different location, contact us.',
  },
  {
    q: 'My listing was rejected. What should I do?',
    a: 'Contact us via WhatsApp and we will explain the reason. Common reasons include an incomplete description or a job title that does not match the description.',
  },
  {
    q: 'Do job seekers have to create an account to apply?',
    a: 'No — any visitor can contact you via WhatsApp directly from the listing. Creating an account lets them apply on-platform and makes it easier for you to track and manage applications in your dashboard.',
  },
  {
    q: 'What is the CAC section on the signup form?',
    a: 'CAC stands for Corporate Affairs Commission — the body that registers businesses in Nigeria. Entering your CAC number is optional, but it helps build trust with job seekers. Each CAC number can only be linked to one account.',
  },
  {
    q: 'What are Skilled, Unskilled, and Internship position types?',
    a: 'These help match your listing to the right job seekers. Skilled is for roles requiring a trade or qualification. Unskilled is for general or physical labour. Internship / IT / SIWES is for student placement positions.',
  },
  {
    q: 'How do I update my company profile or logo?',
    a: 'Log in to your Employer Dashboard and go to the Profile tab. You can update your description, logo, and contact details at any time.',
  },
  {
    q: 'How do I reset my password?',
    a: 'Go to the Employer Login page and click "Forgot password". Enter your email and follow the link sent to your inbox.',
  },
]

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      style={{
        ...styles.item,
        ...(open ? styles.itemOpen : {}),
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={styles.question}
        aria-expanded={open}
      >
        <span style={styles.questionText}>{q}</span>
        <span style={{ ...styles.chevron, ...(open ? styles.chevronOpen : {}) }}>
          ▼
        </span>
      </button>
      {open && (
        <div style={styles.answer}>
          <p style={styles.answerText}>{a}</p>
        </div>
      )}
    </div>
  )
}

export default function FAQ() {
  const [tab, setTab] = useState('seeker')

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <div style={styles.pageHeader}>
          <h1 style={styles.title}>Frequently Asked Questions</h1>
          <p style={styles.subtitle}>
            Find answers to common questions from job seekers and employers.
            Can't find what you're looking for?{' '}
            <a href="https://wa.me/" style={styles.contactLink}>Contact us on WhatsApp.</a>
          </p>
        </div>

        {/* Tab switcher */}
        <div style={styles.tabRow}>
          <button
            onClick={() => setTab('seeker')}
            style={{ ...styles.tab, ...(tab === 'seeker' ? styles.tabActive : {}) }}
          >
            🙋 Job Seekers
          </button>
          <button
            onClick={() => setTab('employer')}
            style={{ ...styles.tab, ...(tab === 'employer' ? styles.tabActive : {}) }}
          >
            🏢 Employers
          </button>
        </div>

        {/* FAQ list */}
        <div style={styles.faqList}>
          {tab === 'seeker' && (
            <>
              <div style={styles.sectionIntro}>
                <p style={styles.sectionIntroText}>
                  Questions about registering, browsing jobs, applying, and managing your profile.
                  New to the platform?{' '}
                  <Link to="/signup" style={styles.inlineLink}>Create an account</Link>
                  {' '}or{' '}
                  <Link to="/register" style={styles.inlineLink}>register as a job seeker</Link>.
                </p>
              </div>
              {JOB_SEEKER_FAQS.map((faq, i) => (
                <FaqItem key={i} q={faq.q} a={faq.a} />
              ))}
            </>
          )}

          {tab === 'employer' && (
            <>
              <div style={styles.sectionIntro}>
                <p style={styles.sectionIntroText}>
                  Questions about posting jobs, managing applications, and your employer account.
                  Ready to find staff?{' '}
                  <Link to="/employer/signup" style={styles.inlineLink}>Create an employer account</Link>
                  {' '}or{' '}
                  <Link to="/post-job" style={styles.inlineLink}>post a job</Link>.
                </p>
              </div>
              {EMPLOYER_FAQS.map((faq, i) => (
                <FaqItem key={i} q={faq.q} a={faq.a} />
              ))}
            </>
          )}
        </div>

        {/* Bottom CTA */}
        <div style={styles.cta}>
          <p style={styles.ctaText}>Still have a question?</p>
          <p style={styles.ctaSubText}>
            Reach us on WhatsApp via the link in the footer and we will get back to you the same day.
          </p>
        </div>

      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f5f7f5',
    padding: '40px 24px 60px',
  },
  container: {
    maxWidth: '760px',
    margin: '0 auto',
  },
  pageHeader: {
    marginBottom: '32px',
  },
  title: {
    fontSize: 'clamp(22px, 3vw, 32px)',
    fontWeight: 'bold',
    color: '#1a6b3c',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '15px',
    color: '#555',
    lineHeight: '1.6',
  },
  contactLink: {
    color: '#1a6b3c',
    fontWeight: '600',
    textDecoration: 'none',
  },

  // Tabs
  tabRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '28px',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '0',
  },
  tab: {
    padding: '10px 22px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: '#888',
    borderBottom: '3px solid transparent',
    marginBottom: '-2px',
    borderRadius: '0',
    transition: 'color 0.15s, border-color 0.15s',
  },
  tabActive: {
    color: '#1a6b3c',
    borderBottomColor: '#1a6b3c',
  },

  // Section intro
  sectionIntro: {
    backgroundColor: '#e8f5ee',
    borderRadius: '10px',
    padding: '14px 18px',
    marginBottom: '16px',
  },
  sectionIntroText: {
    fontSize: '14px',
    color: '#1a6b3c',
    lineHeight: '1.6',
    margin: 0,
  },
  inlineLink: {
    color: '#1a6b3c',
    fontWeight: '700',
    textDecoration: 'none',
  },

  // FAQ list
  faqList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  item: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    border: '1px solid #e8e8e8',
    overflow: 'hidden',
    transition: 'box-shadow 0.15s',
  },
  itemOpen: {
    boxShadow: '0 2px 8px rgba(26,107,60,0.10)',
    border: '1px solid #c8e6d4',
  },
  question: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    gap: '12px',
  },
  questionText: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#222',
    lineHeight: '1.4',
    flex: 1,
  },
  chevron: {
    fontSize: '11px',
    color: '#1a6b3c',
    flexShrink: 0,
    transition: 'transform 0.2s ease',
    display: 'inline-block',
  },
  chevronOpen: {
    transform: 'rotate(180deg)',
  },
  answer: {
    borderTop: '1px solid #f0f0f0',
    padding: '14px 20px 18px',
    backgroundColor: '#fafffe',
  },
  answerText: {
    fontSize: '14px',
    color: '#444',
    lineHeight: '1.7',
    margin: 0,
  },

  // Bottom CTA
  cta: {
    marginTop: '48px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '28px 32px',
    textAlign: 'center',
    border: '1px solid #e8f5ee',
  },
  ctaText: {
    fontSize: '17px',
    fontWeight: '700',
    color: '#1a6b3c',
    marginBottom: '6px',
  },
  ctaSubText: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.6',
    margin: 0,
  },
}
