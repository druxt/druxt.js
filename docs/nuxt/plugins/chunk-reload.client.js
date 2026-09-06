/**
 * Hard-reloads to the destination when a route's chunk fails to load.
 *
 * A tab left open across a redeploy holds a router whose hashed chunk URLs
 * no longer exist on the server; without this, clicking a link fails the
 * chunk fetch and the navigation silently dies, leaving a page where links
 * do nothing. A full load of the destination gets the current build.
 *
 * @param {object} context - The Nuxt context.
 * @param {object} context.app - The root Vue app options, carrying the router.
 */
export default ({ app }) => {
  let destination = null

  app.router.beforeEach((to, from, next) => {
    destination = to.fullPath
    next()
  })

  app.router.onError((error) => {
    if (/loading chunk|chunkloaderror/i.test(String(error && error.message)) && destination) {
      window.location.assign(destination)
    }
  })
}
