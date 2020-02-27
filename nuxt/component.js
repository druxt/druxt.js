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

  computed: {
    title () {
      return this.route.label
    },

    ...mapState({
      route: state => state.druxtRouter.route
    })
  },

  render (createElement) {
    return createElement('drupal-entity', {
      key: this.route.entity.uuid,
      props: {
        uuid: this.route.entity.uuid
      }
    }, JSON.stringify(this.route))
  },

  fetch ({ store, route }) {
    return store.dispatch('druxtRouter/getEntityByRouter', route.fullPath)
  }
}
