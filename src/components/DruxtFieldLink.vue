<template>
  <div>
    <component
      :is="link.component"
      v-for="(link, key) of links"
      :key="key"
      v-bind="link.props"
    >
      {{ link.title }}
    </component>
  </div>
</template>

<script>
import { DruxtFieldMixin } from '../mixins/field'

export default {
  name: 'DruxtFieldLink',

  mixins: [DruxtFieldMixin],

  computed: {
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
          links[key].component = 'nuixt-link'
          links[key].props.to = link.uri
        }
      }

      return links
    }
  },

}
</script>
