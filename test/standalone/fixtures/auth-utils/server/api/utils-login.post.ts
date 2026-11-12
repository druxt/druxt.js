// Signs in with nuxt-auth-utils, as a site's own sign-in would.
export default defineEventHandler(async (event) => {
  await setUserSession(event, { user: { name: 'utils' } })
  return { ok: true }
})
