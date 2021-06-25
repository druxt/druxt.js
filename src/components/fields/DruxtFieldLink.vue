<template>
  <component
    :is="wrapper.component"
    v-bind="wrapper.props"
  >
    <!-- Label: Above -->
    <div v-if="$scopedSlots['label-above']">
      <slot name="label-above" />
    </div>

    <!-- Label: Inline -->
    <slot
      v-if="$scopedSlots['label-inline']"
      name="label-inline"
    />

    <!-- Items -->
    <component
      :is="link.component"
      v-for="(link, key) of links"
      :key="key"
      v-bind="link.props"
    >
      {{ link.title }}
    </component>
  </component>
</template>

<script>
import { DruxtFieldMixin } from '../../mixins/field'

/**
 * Link field.
 *
 * - Uses `<nuxt-link :to />` for internal links.
 * - Uses `<a :href />` for external links.
 *
 * _This component is intended to be rendered by the `<DruxtField />` component._
 *
 * @see {@link DruxtField}
 *
 * @example
 * <DruxtField
 *   :data="{
 *     title: 'Find out more',
 *     uri: 'internal:/about-umami'
 *   }"
 *   :schema="{
 *     id: 'field_content_link',
 *     type: 'link'
 *   }"
 * />
 *
 * @todo Fix issue with `internal:` links.
 */
export default {
  name: 'DruxtFieldLink',

  /**
   * Vue.js Mixins.
   *
   * @see {@link ../mixins/field|DruxtFieldMixin}
   * @see {@link https://vuejs.org/v2/guide/mixins.html}
   */
  mixins: [DruxtFieldMixin],

  /**
   * Vue.js Computed properties.
   */
  computed: {
    /**
     * Array of Link components and properties.
     *
     * @type {object[]}
     *
     * @example @lang js
     * [
     *   // External URL.
     *   {
     *     component: 'a',
     *     props: {
     *       href: 'https://example.com'
     *     }
     *   },
     *   // Internal path.
     *   {
     *     component: 'nuxt-link',
     *     props: {
     *       to: '/'
     *     }
     *   }
     * ]
     */
    links() {
      const links = []

      for (const key in this.items) {
        const link = this.items[key]

        links[key] = {
          component: false,
          title: this.items[key].title,
          props: {}
        }

        // Use <a> for absolute URLs.
        if (/^(?:[a-z]+:)?\/\//i.test(link.uri)) {
          links[key].component = 'a'
          links[key].props.href = link.uri
        }

        // Use <nuxt-link> for relative links.
        else {
          links[key].component = 'nuxt-link'
          // Remove 'internal:' prefix.
          // @see - https://www.drupal.org/project/drupal/issues/3066751
          links[key].props.to = link.uri.replace(/^internal:/, '')
        }
      }

      return links
    }
  },
}
</script>
