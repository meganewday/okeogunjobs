const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY

/**
 * Gets a reCAPTCHA v3 token for the given action.
 * Action names should be lowercase with no spaces e.g. 'register', 'post_job'
 */
export async function getRecaptchaToken(action) {
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
 * Verifies a reCAPTCHA token via the Supabase Edge Function.
 * Returns true if the score passes, false if it fails.
 */
export async function verifyRecaptcha(action) {
  try {
    const token = await getRecaptchaToken(action)

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-recaptcha`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }
    )

    const data = await res.json()
    return data.success === true
  } catch (err) {
    console.error('reCAPTCHA verification error:', err)
    // Fail open in case of network error — do not block legitimate users
    return true
  }
}
