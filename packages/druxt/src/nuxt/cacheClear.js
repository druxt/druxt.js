import { createHash, timingSafeEqual } from 'crypto'
import { resetProcessCache } from '../utils/processCache'

// Compares fixed-size digests, so neither the secret's content nor its length shows in the time taken.
const digest = (value) => createHash('sha256').update(String(value)).digest()
const safeEqual = (a, b) => timingSafeEqual(digest(a), digest(b))

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
