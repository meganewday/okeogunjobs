// Inactivity timeout durations in milliseconds
export const TIMEOUTS = {
  seeker: 24 * 60 * 60 * 1000,   // 24 hours
  employer: 8 * 60 * 60 * 1000,  // 8 hours
  admin: 1 * 60 * 60 * 1000,     // 1 hour
}

const KEYS = {
  seeker: 'okeogun_seeker_last_active',
  employer: 'okeogun_employer_last_active',
  admin: 'okeogun_admin_last_active',
}

/**
 * Records current timestamp as last activity for a role.
 */
export function recordActivity(role) {
  try {
    localStorage.setItem(KEYS[role], Date.now().toString())
  } catch (_) {}
}

/**
 * Checks if the session has timed out for a role.
 * Returns true if timed out, false if still active.
 */
export function isTimedOut(role) {
  try {
    const last = localStorage.getItem(KEYS[role])
    if (!last) return false // No record — let Supabase handle it
    return Date.now() - parseInt(last) > TIMEOUTS[role]
  } catch (_) {
    return false
  }
}

/**
 * Clears the activity record for a role (call on sign out).
 */
export function clearActivity(role) {
  try {
    localStorage.removeItem(KEYS[role])
  } catch (_) {}
}

/**
 * React hook — call inside any protected page.
 * Checks timeout on mount, then refreshes activity every 60 seconds.
 * Calls onTimeout() if the session has expired.
 *
 * Usage:
 *   useInactivityTimeout('employer', handleSignOut)
 */
import { useEffect } from 'react'

export function useInactivityTimeout(role, onTimeout) {
  useEffect(() => {
    // Check on mount
    if (isTimedOut(role)) {
      clearActivity(role)
      onTimeout()
      return
    }

    // Record activity now
    recordActivity(role)

    // Refresh activity timestamp on user interaction
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll']
    function handleActivity() {
      recordActivity(role)
    }
    events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }))

    // Periodic check every 60 seconds
    const interval = setInterval(() => {
      if (isTimedOut(role)) {
        clearActivity(role)
        onTimeout()
      }
    }, 60 * 1000)

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity))
      clearInterval(interval)
    }
  }, [role, onTimeout])
}
