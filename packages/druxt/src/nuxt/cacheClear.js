import { resetProcessCache } from '../utils/processCache'

// Compares in time that does not depend on where the strings first differ.
const safeEqual = (a, b) => {
  let diff = a.length ^ b.length
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
  }
  return diff === 0
}

/**
 * Server middleware that empties the process cache when Drupal asks.
 *
 * Accepts `POST` with the secret in the `X-Druxt-Secret` header, never in the URL,
 * so it stays out of access logs.
 *
 * @param {string} secret - The shared secret, from `druxt.cache.secret`.
 *
 * @returns {Function} A Connect handler.
 */
export const cacheClearHandler = (secret) => (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    return res.end()
  }

  if (!safeEqual(String(req.headers['x-druxt-secret'] || ''), String(secret))) {
    res.statusCode = 401
    return res.end()
  }

  resetProcessCache()
  res.statusCode = 204
  res.end()
}
