import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import JobSeekerRegister from './pages/JobSeekerRegister'
import PostJob from './pages/PostJob'
import JobListings from './pages/JobListings'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import Header from './components/Header'
import Footer from './components/Footer'
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

function Layout({ children }) {
  const location = useLocation()
  const hideLayout = location.pathname.startsWith('/admin')

  return (
    <>
      {!hideLayout && <Header />}
      {children}
      {!hideLayout && <Footer />}
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <EmployerAuthProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<JobSeekerRegister />} />
              <Route path="/post-job" element={<PostJob />} />
              <Route path="/jobs" element={<JobListings />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/signup" element={<JobSeekerSignup />} />
              <Route path="/login" element={<JobSeekerLogin />} />
              <Route path="/profile" element={<JobSeekerProfile />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/update-password" element={<UpdatePassword />} />
              <Route path="/email-confirmed" element={<EmailConfirmed />} />
              <Route path="/employer/signup" element={<EmployerSignup />} />
              <Route path="/employer/login" element={<EmployerLogin />} />
              <Route path="/employer/email-confirmed" element={<EmployerEmailConfirmed />} />
              <Route path="/employer/reset-password" element={<EmployerResetPassword />} />
              <Route path="/employer/update-password" element={<EmployerUpdatePassword />} />
              <Route path="/employer/dashboard" element={<EmployerDashboard />} />
              <Route path="/employer/applications/:jobId" element={<EmployerApplications />} />
           
            </Routes>
          </Layout>
        </BrowserRouter>
      </EmployerAuthProvider>
    </AuthProvider>
  )
}

export default App
