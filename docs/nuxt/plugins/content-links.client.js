/**
 * Routes clicks on internal links inside rendered content through
 * vue-router, so markdown links navigate like NuxtLink instead of
 * triggering a full page load.
 * @param {object} context - The Nuxt context.
 * @param {object} context.app - The Nuxt app instance, providing the router.
 */
export default ({ app }) => {
  window.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const link = event.target.closest('a')
    if (!link || link.target || link.hasAttribute('download')) return
    const href = link.getAttribute('href')
    if (!href || !href.startsWith('/') || href.startsWith('//')) return
    if (!link.closest('.nuxt-content')) return
    event.preventDefault()
    app.router.push(href)
  })
}
