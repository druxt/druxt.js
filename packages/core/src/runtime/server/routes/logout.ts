import { defineEventHandler, setResponseStatus } from 'h3'
import { clearSession, requireSameOrigin } from '../utils/session'

/**
 * POST /api/_druxt/auth/logout: clears the session's cookies, which the browser cannot, as they are httpOnly. Simple OAuth
 * has no revocation endpoint, so the tokens are forgotten, not revoked. A request from another site answers 403 and
 * clears nothing, so no other site signs a visitor out.
 */
export default defineEventHandler((event) => {
  requireSameOrigin(event)
  clearSession(event)
  setResponseStatus(event, 204)
  return null
})
