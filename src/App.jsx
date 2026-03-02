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
            </Routes>
          </Layout>
        </BrowserRouter>
      </EmployerAuthProvider>
    </AuthProvider>
  )
}

export default App
