const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

/**
 * Waits for grecaptcha to be ready with a timeout.
 * Resolves with the token or null if it times out.
 */
function getRecaptchaToken(action) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn('reCAPTCHA timed out — failing open')
      resolve(null)
    }, 5000)

    function execute() {
      window.grecaptcha.execute(SITE_KEY, { action })
        .then(token => {
          clearTimeout(timeout)
          resolve(token)
        })
        .catch(() => {
          clearTimeout(timeout)
          resolve(null)
        })
    }

    if (window.grecaptcha && window.grecaptcha.execute) {
      window.grecaptcha.ready(execute)
    } else {
      // Poll until loaded
      const interval = setInterval(() => {
        if (window.grecaptcha && window.grecaptcha.execute) {
          clearInterval(interval)
          window.grecaptcha.ready(execute)
        }
      }, 200)
      // Stop polling after timeout
      setTimeout(() => clearInterval(interval), 5000)
    }
  })
}

/**
 * Runs reCAPTCHA and rate limit check.
 * Returns { allowed: true } or { allowed: false, error: string }.
 * Fails open on any network or timeout error.
 */
export async function verifyRecaptcha(action) {
  try {
    const token = await getRecaptchaToken(action)

    // Run both checks in parallel — use Promise.allSettled so one failure doesn't kill both
    const [recaptchaResult, rateLimitResult] = await Promise.allSettled([
      token
        ? fetch(`${SUPABASE_URL}/functions/v1/verify-recaptcha`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          }).then(r => r.json())
        : Promise.resolve({ success: true }), // skip if token unavailable

      fetch(`${SUPABASE_URL}/functions/v1/check-rate-limit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      }).then(r => r.json()),
    ])

    // Rate limit check
    if (
      rateLimitResult.status === 'fulfilled' &&
      rateLimitResult.value.allowed === false
    ) {
      return {
        allowed: false,
        error: rateLimitResult.value.error || 'Too many submissions. Please try again in an hour.',
      }
    }

    // reCAPTCHA check
    if (
      recaptchaResult.status === 'fulfilled' &&
      recaptchaResult.value.success === false
    ) {
      return {
        allowed: false,
        error: 'We could not verify your submission. Please try again.',
      }
    }

    // All good — or failed open on network errors
    return { allowed: true }

  } catch (err) {
    console.error('verifyRecaptcha error:', err)
    return { allowed: true }
  }
}
