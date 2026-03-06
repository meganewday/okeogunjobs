const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

/**
 * Gets a reCAPTCHA v3 token for the given action.
 */
async function getRecaptchaToken(action) {
  return new Promise((resolve, reject) => {
    if (!window.grecaptcha) {
      reject(new Error('reCAPTCHA not loaded'))
      return
    }
    window.grecaptcha.ready(() => {
      window.grecaptcha
        .execute(SITE_KEY, { action })
        .then(resolve)
        .catch(reject)
    })
  })
}

/**
 * Runs both reCAPTCHA verification and rate limit check.
 * Returns { allowed: true } if both pass.
 * Returns { allowed: false, error: string } if either fails.
 */
export async function verifyRecaptcha(action) {
  try {
    // Run both checks in parallel
    const [recaptchaResult, rateLimitResult] = await Promise.all([
      // reCAPTCHA check
      getRecaptchaToken(action).then(token =>
        fetch(`${SUPABASE_URL}/functions/v1/verify-recaptcha`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        }).then(r => r.json())
      ),
      // Rate limit check
      fetch(`${SUPABASE_URL}/functions/v1/check-rate-limit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      }).then(r => r.json()),
    ])

    if (!rateLimitResult.allowed) {
      return { allowed: false, error: rateLimitResult.error || 'Too many submissions. Please try again in an hour.' }
    }

    if (!recaptchaResult.success) {
      return { allowed: false, error: 'We could not verify your submission. Please try again.' }
    }

    return { allowed: true }

  } catch (err) {
    console.error('Verification error:', err)
    // Fail open on network errors — do not block legitimate users
    return { allowed: true }
  }
}
