import { mapState } from 'vuex'
import { DrupalEntity } from 'vue-drupal-entity'

import DruxtRouterEntityMixin from './mixin'

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
      key: this.route.entity.uuid,
      props: {
        entity: this.entity,
        id: this.route.entity.uuid,
      }
    }, JSON.stringify(this.route))
  },

  mixins: [
    DruxtRouterEntityMixin
  ],

  fetch ({ store, route }) {
    return store.dispatch('druxtRouter/getEntityByRouter', route.fullPath)
  }
}
