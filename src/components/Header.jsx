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

// ─── Wordmark Logo ────────────────────────────────────────────────────────────
function Wordmark() {
  return (
    <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
      <img
        src="/logo.png"
        alt="OkeOgunJobs — Oke-Ogun Job Bank"
        style={{ height: 42, width: 'auto', display: 'block' }}
      />
    </Link>
  )
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');

  .oj-header {
    position: sticky;
    top: 0;
    z-index: 200;
    background: rgba(255, 255, 255, 0.78);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(187, 247, 208, 0.6);
    box-shadow: 0 2px 16px rgba(22, 163, 74, 0.06);
    font-family: 'Outfit', sans-serif;
  }

  .oj-header-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
    height: 64px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .oj-nav-link {
    font-size: 14px;
    color: #4b6358;
    text-decoration: none;
    padding: 7px 14px;
    border-radius: 50px;
    font-weight: 600;
    transition: background 0.15s, color 0.15s;
    font-family: 'Outfit', sans-serif;
  }
  .oj-nav-link:hover { background: #dcfce7; color: #16a34a; }
  .oj-nav-link-active { background: #dcfce7 !important; color: #16a34a !important; font-weight: 700 !important; }

  .oj-signup-btn {
    padding: 8px 20px;
    background: #16a34a;
    color: #fff;
    border-radius: 50px;
    font-weight: 700;
    font-size: 14px;
    text-decoration: none;
    font-family: 'Outfit', sans-serif;
    box-shadow: 0 3px 10px rgba(22, 163, 74, 0.28);
    transition: transform 0.15s, box-shadow 0.15s;
    display: inline-block;
  }
  .oj-signup-btn:hover { transform: translateY(-1px); box-shadow: 0 5px 14px rgba(22, 163, 74, 0.38); }

  .oj-signout-btn {
    padding: 7px 16px;
    background: transparent;
    color: #dc2626;
    border: 1.5px solid #dc2626;
    border-radius: 50px;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    font-family: 'Outfit', sans-serif;
    transition: all 0.15s;
  }
  .oj-signout-btn:hover { background: #fee2e2; }

  .oj-employer-link {
    font-size: 13px;
    color: #9ca3af;
    text-decoration: none;
    font-weight: 500;
    padding: 7px 12px;
    border-radius: 50px;
    font-family: 'Outfit', sans-serif;
    transition: color 0.15s;
  }
  .oj-employer-link:hover { color: #16a34a; }

  .oj-hamburger {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    border-radius: 10px;
    transition: background 0.15s;
  }
  .oj-hamburger:hover { background: #dcfce7; }

  .oj-hamburger-line {
    display: block;
    width: 22px;
    height: 2px;
    background: #14532d;
    border-radius: 2px;
    transition: transform 0.22s ease, opacity 0.22s ease;
  }

  .oj-mobile-menu {
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid rgba(187, 247, 208, 0.5);
    padding: 12px 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    animation: slideDown 0.2s ease;
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .oj-mobile-link {
    font-size: 15px;
    color: #14532d;
    text-decoration: none;
    padding: 12px 16px;
    border-radius: 12px;
    font-weight: 600;
    font-family: 'Outfit', sans-serif;
    transition: background 0.15s;
    display: block;
  }
  .oj-mobile-link:hover { background: #f0fdf4; }
  .oj-mobile-link-active { background: #dcfce7 !important; color: #16a34a !important; }

  .oj-mobile-signup {
    display: block;
    margin: 10px 0 0;
    padding: 13px 16px;
    background: #16a34a;
    color: #fff;
    border-radius: 12px;
    font-weight: 700;
    font-size: 15px;
    text-decoration: none;
    text-align: center;
    font-family: 'Outfit', sans-serif;
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);
  }

  .oj-mobile-signout {
    display: block;
    margin: 8px 0 0;
    padding: 12px 16px;
    background: transparent;
    color: #dc2626;
    border: 1.5px solid #dc2626;
    border-radius: 12px;
    font-weight: 700;
    font-size: 15px;
    cursor: pointer;
    text-align: center;
    width: 100%;
    font-family: 'Outfit', sans-serif;
    transition: background 0.15s;
  }
  .oj-mobile-signout:hover { background: #fee2e2; }

  .oj-mobile-divider {
    height: 1px;
    background: #dcfce7;
    margin: 8px 0;
    border: none;
  }

  .oj-nav-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #dcfce7;
    flex-shrink: 0;
  }
  .oj-nav-avatar-initial {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, #16a34a, #22c55e);
    color: #fff;
    font-size: 12px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-family: 'Outfit', sans-serif;
  }
`

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled]  = useState(false)
  const location   = useLocation()
  const navigate   = useNavigate()
  const isDesktop  = useIsDesktop()
  const { user, profile, signOut } = useAuth()
  const { employer, employerProfile, employerLoading, employerSignOut } = useEmployerAuth()

  // Deepen the blur/shadow a little when page is scrolled
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const baseLinks = [
    { to: '/',     label: 'Home' },
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
    <header
      className="oj-header"
      style={{ boxShadow: scrolled ? '0 4px 24px rgba(22,163,74,0.1)' : '0 2px 16px rgba(22,163,74,0.06)' }}
    >
      <style>{CSS}</style>

      <div className="oj-header-inner">

        {/* Wordmark */}
        <Wordmark />

        {/* ── DESKTOP NAV ───────────────────────────────────────────────── */}
        {isDesktop && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {baseLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`oj-nav-link${isActive(link.to) ? ' oj-nav-link-active' : ''}`}
              >
                {link.label}
              </Link>
            ))}

            {/* Employer logged in */}
            {!employerLoading && employer && (
              <>
                <Link to="/post-job" className={`oj-nav-link${isActive('/post-job') ? ' oj-nav-link-active' : ''}`}>
                  Post a Job
                </Link>
                <Link to="/employer/dashboard" className={`oj-nav-link${isActive('/employer/dashboard') ? ' oj-nav-link-active' : ''}`}>
                  {employerProfile?.organization_name
                    ? employerProfile.organization_name.split(' ')[0]
                    : 'Dashboard'}
                </Link>
                <button onClick={handleEmployerSignOut} className="oj-signout-btn">Sign Out</button>
              </>
            )}

            {/* Job seeker logged in */}
            {!employerLoading && !employer && user && (
              <>
                <Link
                  to="/profile"
                  className={`oj-nav-link${isActive('/profile') ? ' oj-nav-link-active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {profile?.photo_url ? (
                    <img src={profile.photo_url} alt="" className="oj-nav-avatar" />
                  ) : (
                    <div className="oj-nav-avatar-initial">
                      {profile?.full_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                  {profile?.full_name ? profile.full_name.split(' ')[0] : 'My Profile'}
                </Link>
                <button onClick={handleSignOut} className="oj-signout-btn">Sign Out</button>
              </>
            )}

            {/* Logged out */}
            {!employerLoading && !employer && !user && (
              <>
                <Link to="/post-job" className={`oj-nav-link${isActive('/post-job') ? ' oj-nav-link-active' : ''}`}>
                  Post a Job
                </Link>
                <Link to="/login" className={`oj-nav-link${isActive('/login') ? ' oj-nav-link-active' : ''}`}>
                  Log In
                </Link>
                <Link to="/signup" className="oj-signup-btn">Sign Up</Link>
                <Link
                  to="/employer/login"
                  className="oj-employer-link"
                  style={isActive('/employer/login') ? { color: '#16a34a' } : {}}
                >
                  Employer Login
                </Link>
              </>
            )}
          </nav>
        )}

        {/* ── HAMBURGER — mobile ────────────────────────────────────────── */}
        {!isDesktop && (
          <button
            className="oj-hamburger"
            onClick={() => setMenuOpen(prev => !prev)}
            aria-label="Toggle menu"
          >
            <span className="oj-hamburger-line" style={{ transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span className="oj-hamburger-line" style={{ opacity: menuOpen ? 0 : 1 }} />
            <span className="oj-hamburger-line" style={{ transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>
        )}
      </div>

      {/* ── MOBILE MENU ───────────────────────────────────────────────────── */}
      {!isDesktop && menuOpen && (
        <div className="oj-mobile-menu">
          {baseLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`oj-mobile-link${isActive(link.to) ? ' oj-mobile-link-active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <hr className="oj-mobile-divider" />

          {/* Employer logged in */}
          {!employerLoading && employer && (
            <>
              <Link to="/post-job" className={`oj-mobile-link${isActive('/post-job') ? ' oj-mobile-link-active' : ''}`} onClick={() => setMenuOpen(false)}>
                Post a Job
              </Link>
              <Link to="/employer/dashboard" className={`oj-mobile-link${isActive('/employer/dashboard') ? ' oj-mobile-link-active' : ''}`} onClick={() => setMenuOpen(false)}>
                {employerProfile?.organization_name
                  ? `${employerProfile.organization_name.split(' ')[0]} — Dashboard`
                  : 'Employer Dashboard'}
              </Link>
              <button onClick={handleEmployerSignOut} className="oj-mobile-signout">Sign Out</button>
            </>
          )}

          {/* Job seeker logged in */}
          {!employerLoading && !employer && user && (
            <>
              <Link
                to="/profile"
                className={`oj-mobile-link${isActive('/profile') ? ' oj-mobile-link-active' : ''}`}
                onClick={() => setMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 10 }}
              >
                {profile?.photo_url ? (
                  <img src={profile.photo_url} alt="" className="oj-nav-avatar" />
                ) : (
                  <div className="oj-nav-avatar-initial">
                    {profile?.full_name?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                {profile?.full_name ? `${profile.full_name.split(' ')[0]}'s Profile` : 'My Profile'}
              </Link>
              <button onClick={handleSignOut} className="oj-mobile-signout">Sign Out</button>
            </>
          )}

          {/* Logged out */}
          {!employerLoading && !employer && !user && (
            <>
              <Link to="/post-job" className={`oj-mobile-link${isActive('/post-job') ? ' oj-mobile-link-active' : ''}`} onClick={() => setMenuOpen(false)}>
                Post a Job
              </Link>
              <Link to="/login" className={`oj-mobile-link${isActive('/login') ? ' oj-mobile-link-active' : ''}`} onClick={() => setMenuOpen(false)}>
                Log In
              </Link>
              <Link to="/signup" className="oj-mobile-signup" onClick={() => setMenuOpen(false)}>
                Sign Up
              </Link>
              <Link
                to="/employer/login"
                className={`oj-mobile-link${isActive('/employer/login') ? ' oj-mobile-link-active' : ''}`}
                onClick={() => setMenuOpen(false)}
                style={{ color: '#9ca3af', fontSize: 14 }}
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
