import { mapState } from 'vuex'
import DrupalEntity from '../../nuxt/components/DrupalEntity.vue'

export default {
  name: 'druxt-router',

  components: {
    DrupalEntity
  },

  head () {
    return {
      title: this.title,
      link: [
        {
          rel: 'canonical',
          // @TODO - Replace base URL.
          href: this.route.entity.canonical
        }
      ]
    }
  },

  render (createElement) {
    return createElement('drupal-entity', {
      props: {
        entity: this.entity,
        id: this.route.entity.uuid,
        schema: this.schema
      }
    }, JSON.stringify(this.route))
  },

  async fetch ({ store, route }) {
    const result = await store.dispatch('druxtRouter/set', route.fullPath)
    return result
  },

  computed: {
    schema () {
      if (
        typeof this.$drupalJSONAPIEntities()[this.route.entity.type][this.route.entity.bundle] === 'undefined' ||
        typeof this.$drupalJSONAPIEntities()[this.route.entity.type][this.route.entity.bundle].view.default === 'undefined') {
        throw new TypeError(`Drupal JSON:API Entities Schema data missing for ${this.route.entity.type}--${this.route.entity.bundle}--view--defaultbundleRenderer.renderToStream`)
      }
      return this.$drupalJSONAPIEntities()[this.route.entity.type][this.route.entity.bundle].view.default
    },

    title () {
      return this.route.label
    },

    ...mapState({
      entity: state => state.druxtRouter.entity,
      route: state => state.druxtRouter.route
    })
  }
}
