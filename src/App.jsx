import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Home from './pages/Home'
import JobSeekerRegister from './pages/JobSeekerRegister'
import PostJob from './pages/PostJob'
import JobListings from './pages/JobListings'
import JobDetail from './pages/JobDetail'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import Header from './components/Header'
import Footer from './components/Footer'
import Countdown from './components/Countdown'
import CookiesBanner from './components/CookiesBanner'
import { AuthProvider } from './contexts/AuthContext'
import { EmployerAuthProvider } from './contexts/EmployerAuthContext'
import JobSeekerSignup from './pages/JobSeekerSignup'
import JobSeekerLogin from './pages/JobSeekerLogin'
import JobSeekerProfile from './pages/JobSeekerProfile'
import ResetPassword from './pages/ResetPassword'
import UpdatePassword from './pages/UpdatePassword'
import EmailConfirmed from './pages/EmailConfirmed'
import EmployerSignup from './pages/EmployerSignup'
import EmployerLogin from './pages/EmployerLogin'
import EmployerEmailConfirmed from './pages/EmployerEmailConfirmed'
import EmployerResetPassword from './pages/EmployerResetPassword'
import EmployerUpdatePassword from './pages/EmployerUpdatePassword'
import EmployerDashboard from './pages/EmployerDashboard'
import EmployerApplications from './pages/EmployerApplications'
import EmployerEmployees from './pages/EmployerEmployees'
import PrivacyPolicy from './pages/PrivacyPolicy'
import FAQ from './pages/FAQ'
import Unsubscribe from './pages/Unsubscribe'

function Layout({ children, showCountdown, onCountdownEnd, onPreviewSkip }) {
  const location = useLocation()
  const hideLayout = location.pathname.startsWith('/admin')
  const previewMode = new URLSearchParams(location.search).get('preview') === '1'
  const shouldShowCountdown = showCountdown && !previewMode

  return (
    <>
      {shouldShowCountdown ? (
        <Countdown onCountdownEnd={onCountdownEnd} onPreview={onPreviewSkip} />
      ) : (
        <>
          {!hideLayout && <Header />}
          {children}
          {!hideLayout && <Footer />}
        </>
      )}
      <CookiesBanner />
    </>
  )
}

function App() {
  const [showCountdown, setShowCountdown] = useState(true)
  const [skipCountdown, setSkipCountdown] = useState(false)

  const handleCountdownEnd = () => {
    setShowCountdown(false)
  }

  const handlePreviewSkip = () => {
    setSkipCountdown(true)
  }

  return (
    <AuthProvider>
      <EmployerAuthProvider>
        <BrowserRouter>
          <Layout showCountdown={showCountdown && !skipCountdown} onCountdownEnd={handleCountdownEnd} onPreviewSkip={handlePreviewSkip}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Home />} />
              <Route path="/jobs" element={<JobListings />} />
              <Route path="/jobs/:jobId" element={<JobDetail />} />
              <Route path="/post-job" element={<PostJob />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />

              {/* Job Seeker Auth */}
              <Route path="/signup" element={<JobSeekerSignup />} />
              <Route path="/login" element={<JobSeekerLogin />} />
              <Route path="/register" element={<JobSeekerRegister />} />
              <Route path="/profile" element={<JobSeekerProfile />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/update-password" element={<UpdatePassword />} />
              <Route path="/email-confirmed" element={<EmailConfirmed />} />

              {/* Employer */}
              <Route path="/employer/signup" element={<EmployerSignup />} />
              <Route path="/employer/login" element={<EmployerLogin />} />
              <Route path="/employer/email-confirmed" element={<EmployerEmailConfirmed />} />
              <Route path="/employer/reset-password" element={<EmployerResetPassword />} />
              <Route path="/employer/update-password" element={<EmployerUpdatePassword />} />
              <Route path="/employer/dashboard" element={<EmployerDashboard />} />
              <Route path="/employer/applications/:jobId" element={<EmployerApplications />} />
              <Route path="/employer/employees" element={<EmployerEmployees />} />

              {/* Admin */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </EmployerAuthProvider>
    </AuthProvider>
  )
}

export default App
