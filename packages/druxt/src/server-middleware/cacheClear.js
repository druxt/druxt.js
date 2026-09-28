import { resetProcessCache } from '../utils/processCache'

// Compares in time that depends on the caller's input alone: the loop runs its
// length, and the secret's content and length only feed the accumulator. Node's
// crypto is not used, as this file is part of the browser bundle too.
const safeEqual = (input, secret) => {
  let diff = input.length ^ secret.length
  for (let i = 0; i < input.length; i++) {
    diff |= input.charCodeAt(i) ^ secret.charCodeAt(i % secret.length)
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
