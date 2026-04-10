import { useEffect, useState } from 'react'

const PHRASES = [
  "THE GRAND UNVEILING IS IMMINENT",
  "THE UNVEILING OF OKE OGUN'S DIGITAL FUTURE",
  "PREPARING THE STAGE FOR THE UNVEILING",
  "THE WAIT IS ALMOST OVER. THE UNVEILING STARTS IN..."
]

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
  
  .countdown-container {
    font-family: 'Outfit', 'Segoe UI', sans-serif;
    background: radial-gradient(circle at 20% 18%, rgba(22, 163, 74, 0.16), transparent 16%),
      radial-gradient(circle at 80% 12%, rgba(5, 150, 105, 0.14), transparent 14%),
      linear-gradient(180deg, #081b0f 0%, #0c2512 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    position: relative;
    overflow: hidden;
  }

  .countdown-content {
    text-align: center;
    z-index: 2;
    max-width: 700px;
    padding: 38px;
    border-radius: 32px;
    background: rgba(8, 20, 12, 0.92);
    border: 1px solid rgba(34, 197, 94, 0.16);
    box-shadow: 0 40px 90px rgba(3, 20, 11, 0.45);
    backdrop-filter: blur(16px);
    animation: fadeInScale 0.8s ease-out;
  }

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .countdown-brand {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 28px;
    justify-content: center;
  }

  .countdown-logo {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.05);
    display: grid;
    place-items: center;
    box-shadow: inset 0 0 0 1px rgba(34, 197, 74, 0.16), 0 10px 30px rgba(22, 163, 74, 0.14);
  }

  .countdown-logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 12px;
  }

  .countdown-brand-name {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .countdown-brand-title {
    font-size: 14px;
    font-weight: 700;
    color: #bbf7d0;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    margin: 0;
  }

  .countdown-brand-subtitle {
    font-size: 12px;
    color: rgba(226, 232, 240, 0.7);
    margin: 0;
    letter-spacing: 0.04em;
  }

  .countdown-phrase {
    font-size: clamp(24px, 6vw, 48px);
    font-weight: 800;
    color: #f8fff0;
    margin-bottom: 12px;
    letter-spacing: -0.02em;
    line-height: 1.05;
    animation: phraseRotate 0.6s ease-out;
  }

  @keyframes phraseRotate {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .countdown-subtext {
    font-size: clamp(14px, 2.4vw, 16px);
    color: rgba(226, 232, 240, 0.78);
    margin-bottom: 36px;
    font-weight: 500;
    line-height: 1.7;
  }

  .countdown-timer {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 36px;
  }

  .countdown-unit {
    width: 120px;
    min-width: 100px;
    padding: 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 999px;
    backdrop-filter: blur(10px);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
  }

  .countdown-number {
    font-size: clamp(32px, 8vw, 64px);
    font-weight: 900;
    color: #f8fafc;
    margin-bottom: 8px;
    text-shadow: 0 0 18px rgba(255, 255, 255, 0.14);
    animation: pulse 2.5s ease-in-out infinite alternate;
    font-variant-numeric: tabular-nums;
  }

  @keyframes pulse {
    from {
      transform: scale(1);
      text-shadow: 0 0 18px rgba(255, 255, 255, 0.14);
    }
    to {
      transform: scale(1.03);
      text-shadow: 0 0 30px rgba(255, 255, 255, 0.22);
    }
  }

  .countdown-label {
    font-size: 12px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .progress-bar-container {
    width: min(100%, 520px);
    height: 8px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 999px;
    overflow: hidden;
    margin: 0 auto 28px;
    border: 1px solid rgba(34, 197, 74, 0.16);
  }

  .progress-bar-fill {
    height: 100%;
    width: 0%;
    border-radius: 999px;
    background: repeating-linear-gradient(
      45deg,
      rgba(34, 197, 74, 0.88) 0,
      rgba(34, 197, 74, 0.88) 8px,
      rgba(22, 163, 74, 0.6) 8px,
      rgba(22, 163, 74, 0.6) 16px
    );
    box-shadow: inset 0 0 6px rgba(22, 163, 74, 0.12);
    animation: stripes 4.5s linear infinite;
    background-size: 24px 24px;
    transform-origin: left center;
  }

  @keyframes fillProgress {
    from {
      width: 0%;
    }
  }

  @keyframes stripes {
    from {
      background-position: 0 0;
    }
    to {
      background-position: 40px 0;
    }
  }

  .countdown-cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 14px 32px;
    background: linear-gradient(135deg, #16a34a, #22c55e);
    color: #07151d;
    border: none;
    border-radius: 50px;
    font-weight: 700;
    font-size: 15px;
    font-family: 'Outfit', sans-serif;
    cursor: pointer;
    transition: all 0.25s ease;
    box-shadow: 0 12px 30px rgba(22, 163, 74, 0.28);
  }

  .countdown-skip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: 14px;
    padding: 8px 18px;
    background: rgba(255, 255, 255, 0.04);
    color: rgba(226, 232, 240, 0.88);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 120px;
  }

  .countdown-skip:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.25);
  }

  .countdown-cta:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 26px rgba(22, 163, 74, 0.36);
    background: linear-gradient(135deg, #16a34a, #4ade80);
  }

  .countdown-decorator {
    position: absolute;
    border-radius: 50%;
    opacity: 0.05;
    pointer-events: none;
  }

  .decorator-1 {
    width: 400px;
    height: 400px;
    background: #86efac;
    top: -100px;
    right: -100px;
    animation: float 20s ease-in-out infinite;
  }

  .decorator-2 {
    width: 300px;
    height: 300px;
    background: #bbf7d0;
    bottom: -80px;
    left: -80px;
    animation: float 25s ease-in-out infinite reverse;
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(40px);
    }
  }
`

export default function Countdown({ onCountdownEnd = null, onPreview = null }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
    targetSeconds: 0
  })
  const [phrase, setPhrase] = useState(PHRASES[0])
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setPhrase(PHRASES[Math.floor(Math.random() * PHRASES.length)])

    const calculateTime = () => {
      const targetDate = new Date('2026-04-18T10:00:00').getTime()
      const now = new Date().getTime()
      const difference = targetDate - now

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, targetSeconds: 0 })
        if (onCountdownEnd) onCountdownEnd()
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((difference / 1000 / 60) % 60)
      const seconds = Math.floor((difference / 1000) % 60)
      const totalSeconds = Math.floor(difference / 1000)
      const targetSeconds = Math.floor((new Date('2026-04-18T10:00:00').getTime() - new Date('2026-04-01T00:00:00').getTime()) / 1000)
      const progressPercent = Math.min(100, ((targetSeconds - totalSeconds) / targetSeconds) * 100)

      setTimeLeft({ days, hours, minutes, seconds, totalSeconds, targetSeconds })
      setProgress(progressPercent)
    }

    calculateTime()
    const interval = setInterval(calculateTime, 1000)

    return () => clearInterval(interval)
  }, [onCountdownEnd])

  return (
    <div style={{ position: 'relative' }}>
      <style>{CSS}</style>
      <div className="countdown-decorator decorator-1" />
      <div className="countdown-decorator decorator-2" />
      
      <div className="countdown-container">
        <div className="countdown-content">
          <div className="countdown-brand">
            <div className="countdown-logo">
              <img src="/logo.png" alt="OkeOgunJobs logo" />
            </div>
            <div className="countdown-brand-name">
              <p className="countdown-brand-title">OkeOgunJobs</p>
              <p className="countdown-brand-subtitle">Oke-Ogun Job Bank</p>
            </div>
          </div>

          <h1 className="countdown-phrase">{phrase}</h1>
          <p className="countdown-subtext">
            Join the Oke Ogun digital revolution as it goes live with a bold new hiring experience.
          </p>

          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>

          <div className="countdown-timer">
            <div className="countdown-unit">
              <div className="countdown-number">{String(timeLeft.days).padStart(2, '0')}</div>
              <div className="countdown-label">Days</div>
            </div>
            <div className="countdown-unit">
              <div className="countdown-number">{String(timeLeft.hours).padStart(2, '0')}</div>
              <div className="countdown-label">Hours</div>
            </div>
            <div className="countdown-unit">
              <div className="countdown-number">{String(timeLeft.minutes).padStart(2, '0')}</div>
              <div className="countdown-label">Mins</div>
            </div>
            <div className="countdown-unit">
              <div className="countdown-number">{String(timeLeft.seconds).padStart(2, '0')}</div>
              <div className="countdown-label">Secs</div>
            </div>
          </div>

          {timeLeft.totalSeconds > 0 && (
            <>
              <button className="countdown-cta">
                Get Early Access
              </button>
              {onPreview && (
                <button className="countdown-skip" onClick={onPreview}>
                  Preview Site
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
