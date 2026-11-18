<script>
import { DruxtViewsPageMixin } from 'druxt-views'

/**
 * A Views page whose URL is its state.
 *
 * Registered by the Nuxt module for each pattern in `druxt.views.pages`. The
 * route gives the view its arguments, filter, page and sort through the
 * page's config, DruxtView fetches, and every change the view reports is
 * written back to the URL through the router, so back and forward replay as
 * model changes and nothing reloads.
 *
 * Inside a page the site routes itself, the `page` prop gives the same config
 * with the pattern that page's route matches.
 *
 * @example @lang js
 * // nuxt.config.js
 * export default {
 *   druxt: {
 *     views: {
 *       pages: {
 *         '/shop/:collection?': {
 *           viewId: 'products',
 *           displayId: 'page_1',
 *           arguments: ['collection'],
 *           filters: { brand: { query: 'brand' } },
 *           aliases: { collection: { women: '12' } },
 *         },
 *       },
 *     },
 *   },
 * }
 *
 * @example @lang vue
 * <DruxtViewsPage :page="{
 *   pattern: '/how-to/troubleshooting/:issue?',
 *   viewId: 'docs_issues',
 *   filters: { area: { query: 'area' } },
 * }" />
 */
export default {
  name: 'DruxtViewsPage',

  mixins: [DruxtViewsPageMixin],

  render(h) {
    if (!this.config) {
      return h('DruxtDebug', { props: { summary: 'No Views page for this route.' } }, [
        h('p', `Add the pattern ${this.pattern || this.$route.path} to druxt.views.pages.`),
      ])
    }
    return h('DruxtView', {
      props: this.viewProps,
      on: { input: this.onInput },
    })
  },
}
</script>
