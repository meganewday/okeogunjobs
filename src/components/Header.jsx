import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { APP_NAME } from '../config/constants'
import { useAuth } from '../contexts/AuthContext'
import { useEmployerAuth } from '../contexts/EmployerAuthContext'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768)
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isDesktop
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()
  const { user, profile, signOut } = useAuth()
  const { employer, employerProfile, employerLoading, employerSignOut } = useEmployerAuth()

  const baseLinks = [
    { to: '/', label: 'Home' },
    { to: '/jobs', label: 'Browse Jobs' },
  ]

  async function handleSignOut() {
    setMenuOpen(false)
    await signOut()
    navigate('/')
  }

  async function handleEmployerSignOut() {
    setMenuOpen(false)
    await employerSignOut()
    navigate('/')
  }

  function isActive(path) {
    return location.pathname === path
  }

  return (
    <header style={styles.header}>
      <div style={styles.inner}>

        {/* Logo */}
        <Link to="/" style={styles.logo} onClick={() => setMenuOpen(false)}>
          {APP_NAME}
        </Link>

        {/* Desktop Nav */}
        {isDesktop && (
          <nav style={styles.desktopNav}>
            {baseLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  ...styles.navLink,
                  ...(isActive(link.to) ? styles.navLinkActive : {})
                }}
              >
                {link.label}
              </Link>
            ))}

            {/* Employer is logged in */}
            {!employerLoading && employer && (
              <>
                <Link
                  to="/post-job"
                  style={{
                    ...styles.navLink,
                    ...(isActive('/post-job') ? styles.navLinkActive : {})
                  }}
                >
                  Post a Job
                </Link>
                <Link
                  to="/employer/dashboard"
                  style={{
                    ...styles.navLink,
                    ...(isActive('/employer/dashboard') ? styles.navLinkActive : {})
                  }}
                >
                  {employerProfile?.organization_name
                    ? employerProfile.organization_name.split(' ')[0]
                    : 'Dashboard'}
                </Link>
                <button onClick={handleEmployerSignOut} style={styles.signOutBtn}>
                  Sign Out
                </button>
              </>
            )}

            {/* Job seeker is logged in */}
            {!employerLoading && !employer && user && (
              <>
                <Link
                  to="/profile"
                  style={{
                    ...styles.navLink,
                    ...(isActive('/profile') ? styles.navLinkActive : {})
                  }}
                >
                  {profile?.full_name
                    ? profile.full_name.split(' ')[0]
                    : 'My Profile'}
                </Link>
                <button onClick={handleSignOut} style={styles.signOutBtn}>
                  Sign Out
                </button>
              </>
            )}

            {/* Logged out */}
            {!employerLoading && !employer && !user && (
              <>
                <Link
                  to="/post-job"
                  style={{
                    ...styles.navLink,
                    ...(isActive('/post-job') ? styles.navLinkActive : {})
                  }}
                >
                  Post a Job
                </Link>
                <Link
                  to="/login"
                  style={{
                    ...styles.navLink,
                    ...(isActive('/login') ? styles.navLinkActive : {})
                  }}
                >
                  Log In
                </Link>
                <Link to="/signup" style={styles.signUpBtn}>
                  Sign Up
                </Link>
                <Link
                  to="/employer/login"
                  style={{
                    ...styles.employerLoginLink,
                    ...(isActive('/employer/login') ? { color: '#1a6b3c' } : {})
                  }}
                >
                  Employer Login
                </Link>
              </>
            )}
          </nav>
        )}

        {/* Hamburger — mobile only */}
        {!isDesktop && (
          <button
            style={styles.hamburger}
            onClick={() => setMenuOpen(prev => !prev)}
            aria-label="Toggle menu"
          >
            <span style={{
              ...styles.hamburgerLine,
              transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none'
            }} />
            <span style={{
              ...styles.hamburgerLine,
              opacity: menuOpen ? 0 : 1,
            }} />
            <span style={{
              ...styles.hamburgerLine,
              transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none'
            }} />
          </button>
        )}

      </div>

      {/* Mobile Menu */}
      {!isDesktop && menuOpen && (
        <div style={styles.mobileMenu}>
          {baseLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                ...styles.mobileLink,
                ...(isActive(link.to) ? styles.mobileLinkActive : {})
              }}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {/* Employer logged in */}
          {!employerLoading && employer && (
            <>
              <Link
                to="/post-job"
                style={{
                  ...styles.mobileLink,
                  ...(isActive('/post-job') ? styles.mobileLinkActive : {})
                }}
                onClick={() => setMenuOpen(false)}
              >
                Post a Job
              </Link>
              <Link
                to="/employer/dashboard"
                style={{
                  ...styles.mobileLink,
                  ...(isActive('/employer/dashboard') ? styles.mobileLinkActive : {})
                }}
                onClick={() => setMenuOpen(false)}
              >
                {employerProfile?.organization_name
                  ? `${employerProfile.organization_name.split(' ')[0]} — Dashboard`
                  : 'Employer Dashboard'}
              </Link>
              <button onClick={handleEmployerSignOut} style={styles.mobileSignOutBtn}>
                Sign Out
              </button>
            </>
          )}

          {/* Job seeker logged in */}
          {!employerLoading && !employer && user && (
            <>
              <Link
                to="/profile"
                style={{
                  ...styles.mobileLink,
                  ...(isActive('/profile') ? styles.mobileLinkActive : {})
                }}
                onClick={() => setMenuOpen(false)}
              >
                {profile?.full_name
                  ? `${profile.full_name.split(' ')[0]}'s Profile`
                  : 'My Profile'}
              </Link>
              <button onClick={handleSignOut} style={styles.mobileSignOutBtn}>
                Sign Out
              </button>
            </>
          )}

          {/* Logged out */}
          {!employerLoading && !employer && !user && (
            <>
              <Link
                to="/post-job"
                style={{
                  ...styles.mobileLink,
                  ...(isActive('/post-job') ? styles.mobileLinkActive : {})
                }}
                onClick={() => setMenuOpen(false)}
              >
                Post a Job
              </Link>
              <Link
                to="/login"
                style={{
                  ...styles.mobileLink,
                  ...(isActive('/login') ? styles.mobileLinkActive : {})
                }}
                onClick={() => setMenuOpen(false)}
              >
                Log In
              </Link>
              <Link
                to="/signup"
                style={styles.mobileSignUpBtn}
                onClick={() => setMenuOpen(false)}
              >
                Sign Up
              </Link>
              <Link
                to="/employer/login"
                style={{
                  ...styles.mobileLink,
                  ...(isActive('/employer/login') ? styles.mobileLinkActive : {}),
                  color: '#888',
                  fontSize: '14px',
                }}
                onClick={() => setMenuOpen(false)}
              >
                Employer Login
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}

const styles = {
  header: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #eee',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  inner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    height: '64px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#1a6b3c',
    textDecoration: 'none',
  },
  desktopNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  navLink: {
    fontSize: '14px',
    color: '#555',
    textDecoration: 'none',
    padding: '8px 14px',
    borderRadius: '8px',
    fontWeight: '500',
  },
  navLinkActive: {
    backgroundColor: '#e8f5ee',
    color: '#1a6b3c',
    fontWeight: '700',
  },
  signUpBtn: {
    padding: '8px 18px',
    backgroundColor: '#1a6b3c',
    color: '#fff',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '14px',
    textDecoration: 'none',
    marginLeft: '4px',
  },
  signOutBtn: {
    padding: '8px 14px',
    backgroundColor: 'transparent',
    color: '#e53e3e',
    border: '1px solid #e53e3e',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    marginLeft: '4px',
  },
  employerLoginLink: {
    fontSize: '13px',
    color: '#aaa',
    textDecoration: 'none',
    fontWeight: '500',
    marginLeft: '4px',
    padding: '8px 10px',
  },
  hamburger: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '5px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
  },
  hamburgerLine: {
    display: 'block',
    width: '24px',
    height: '2px',
    backgroundColor: '#333',
    borderRadius: '2px',
    transition: 'transform 0.2s ease, opacity 0.2s ease',
  },
  mobileMenu: {
    backgroundColor: '#fff',
    borderTop: '1px solid #eee',
    padding: '12px 24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  mobileLink: {
    fontSize: '15px',
    color: '#333',
    textDecoration: 'none',
    padding: '12px 16px',
    borderRadius: '8px',
    fontWeight: '500',
  },
  mobileLinkActive: {
    backgroundColor: '#e8f5ee',
    color: '#1a6b3c',
    fontWeight: '700',
  },
  mobileSignUpBtn: {
    display: 'block',
    margin: '8px 0 0',
    padding: '12px 16px',
    backgroundColor: '#1a6b3c',
    color: '#fff',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '15px',
    textDecoration: 'none',
    textAlign: 'center',
  },
  mobileSignOutBtn: {
    display: 'block',
    margin: '8px 0 0',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    color: '#e53e3e',
    border: '1px solid #e53e3e',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '15px',
    cursor: 'pointer',
    textAlign: 'center',
    width: '100%',
  },
}
