import { mapState } from 'vuex'
import { DrupalEntity } from 'vue-drupal-entity'

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

  fetch ({ store, route }) {
    return store.dispatch('druxtRouter/set', route.fullPath)
  },

  computed: {
    schema () {
      return this.$druxtRouter().getEntitySchema(this.route.entity.type, this.route.entity.bundle)
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
