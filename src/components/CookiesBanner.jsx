import { useState, useEffect } from 'react'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');

  .cookies-banner {
    position: fixed;
    bottom: 24px;
    left: 24px;
    right: 24px;
    max-width: 420px;
    background: rgba(20, 83, 45, 0.75);
    backdrop-filter: blur(12px);
    border: 1.5px solid rgba(187, 247, 208, 0.3);
    border-radius: 16px;
    padding: 20px 24px;
    z-index: 9999;
    font-family: 'Outfit', 'Segoe UI', sans-serif;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    animation: slideUp 0.4s ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .cookies-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
  }

  .cookies-text {
    flex: 1;
  }

  .cookies-title {
    font-size: 14px;
    font-weight: 700;
    color: #bbf7d0;
    margin: 0 0 6px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .cookies-description {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.75);
    line-height: 1.5;
    margin: 0;
  }

  .cookies-actions {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-shrink: 0;
  }

  .cookies-accept {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 16px;
    background: #bbf7d0;
    color: #14532d;
    border: none;
    border-radius: 50px;
    font-weight: 700;
    font-size: 12px;
    font-family: 'Outfit', sans-serif;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .cookies-accept:hover {
    background: #dcfce7;
    transform: translateY(-1px);
  }

  .cookies-decline {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 16px;
    background: transparent;
    color: rgba(255, 255, 255, 0.7);
    border: 1.5px solid rgba(255, 255, 255, 0.3);
    border-radius: 50px;
    font-weight: 600;
    font-size: 12px;
    font-family: 'Outfit', sans-serif;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .cookies-decline:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
    border-color: rgba(255, 255, 255, 0.5);
  }

  @media (max-width: 480px) {
    .cookies-banner {
      left: 16px;
      right: 16px;
      bottom: 16px;
    }

    .cookies-content {
      flex-direction: column;
    }

    .cookies-actions {
      width: 100%;
      justify-content: space-between;
    }

    .cookies-accept {
      flex: 1;
    }
  }
`

export default function CookiesBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const cookiesAccepted = localStorage.getItem('cookies_accepted')
    if (!cookiesAccepted) {
      setIsVisible(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookies_accepted', 'true')
    localStorage.setItem('cookies_accepted_at', new Date().toISOString())
    setIsVisible(false)
  }

  const handleDecline = () => {
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <>
      <style>{CSS}</style>
      <div className="cookies-banner">
        <div className="cookies-content">
          <div className="cookies-text">
            <p className="cookies-title">Cookies & Privacy</p>
            <p className="cookies-description">
              We use cookies to improve your experience and analyze site usage. By continuing, you agree to our cookie policy.
            </p>
          </div>
          <div className="cookies-actions">
            <button className="cookies-accept" onClick={handleAccept}>
              Accept
            </button>
            <button className="cookies-decline" onClick={handleDecline}>
              Decline
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
