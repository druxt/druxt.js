import { defineEventHandler, setResponseStatus } from 'h3'
import { clearSession } from '../utils/session'

/**
 * POST /api/_druxt/auth/logout: clears the session's cookies, which the browser cannot, as they are httpOnly. Simple OAuth
 * has no revocation endpoint, so the tokens are forgotten, not revoked.
 */
export default defineEventHandler((event) => {
  clearSession(event)
  setResponseStatus(event, 204)
  return null
})
