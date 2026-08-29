/**
 * @nuxtjs/color-mode's `dataValue` option (writes the active mode straight to
 * a `data-*` attribute) only exists from v3 onward, which requires Nuxt 3/4
 * (`@nuxt/kit`). The last Nuxt-2-compatible release, 2.1.1, only toggles a
 * CSS class on `<html>`. daisyUI 1.x themes only activate via the
 * `data-theme` attribute, so this bridges `$colorMode.value` to it. The
 * no-flash inline script in `nuxt.config.js` (`head.script`) sets the
 * attribute before first paint; this keeps it in sync after that.
 */
export default ({ app }) => {
  window.onNuxtReady(() => {
    const apply = (value) => {
      document.documentElement.setAttribute('data-theme', value)
    }

    apply(app.$colorMode.value)
    app.$colorMode.$watch('value', apply)
  })
}
