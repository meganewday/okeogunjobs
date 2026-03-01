import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { APP_NAME } from '../config/constants'

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
  const isDesktop = useIsDesktop()

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/jobs', label: 'Browse Jobs' },
    { to: '/register', label: 'Register' },
    { to: '/post-job', label: 'Post a Job' },
  ]

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
            {navLinks.map(link => (
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
          {navLinks.map(link => (
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
}
