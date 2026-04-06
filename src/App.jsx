import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

// Pages
import Home from './pages/Home';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import EmployerLogin from './pages/EmployerLogin';
import EmployerSignup from './pages/EmployerSignup';
import EmployerDashboard from './pages/EmployerDashboard';
import PostJob from './pages/PostJob';
import CandidateSearch from './pages/CandidateSearch';
import Profile from './pages/Profile';

// Components - Matched to your exact path: components/Header.jsx
import Header from './components/Header';
// import Footer from './components/Footer'; // Commented out to prevent build failure if file differs

// Protected Route Component
const ProtectedRoute = ({ children, user, loading }) => {
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (!user) return <Navigate to="/employer/login" replace />;
  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Header component now pointing to components/Header.jsx */}
        <Header user={user} />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetails />} />
            
            {/* Auth Routes */}
            <Route path="/employer/login" element={!user ? <EmployerLogin /> : <Navigate to="/employer/dashboard" />} />
            <Route path="/employer/signup" element={!user ? <EmployerSignup /> : <Navigate to="/employer/dashboard" />} />
            
            {/* Protected Employer Routes */}
            <Route path="/employer/dashboard" element={
              <ProtectedRoute user={user} loading={loading}>
                <EmployerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/employer/post-job" element={
              <ProtectedRoute user={user} loading={loading}>
                <PostJob />
              </ProtectedRoute>
            } />
            <Route path="/employer/candidates" element={
              <ProtectedRoute user={user} loading={loading}>
                <CandidateSearch />
              </ProtectedRoute>
            } />
            
            {/* Profile */}
            <Route path="/profile" element={
              <ProtectedRoute user={user} loading={loading}>
                <Profile />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        {/* <Footer /> */}
      </div>
    </Router>
  );
}

export default App;
              
