import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import JobSeekerRegister from './pages/JobSeekerRegister'
import PostJob from './pages/PostJob'
import JobListings from './pages/JobListings'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<JobSeekerRegister />} />
        <Route path="/post-job" element={<PostJob />} />
        <Route path="/jobs" element={<JobListings />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App