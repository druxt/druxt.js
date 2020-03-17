import { mapState } from 'vuex'

const DruxtRouterComponent = {
  name: 'druxt-router',

  head () {
    return {
      title: this.title,
      link: [
        {
          rel: 'canonical',
          href: this.canonical || this.route.entity.canonical
        }
      ],
      meta: this.metatags || false
    }
  },

  computed: {
    title () {
      return this.route.label
    },

    ...mapState({
      entity: state => state.druxtRouter.entities[state.druxtRouter.route.entity.uuid],
      redirect: state => state.druxtRouter.redirect,
      route: state => state.druxtRouter.route
    })
  },

  render (createElement) {
    return createElement('div', {
      key: this.route.entity.uuid,
      props: {
        type: `${this.route.entity.type}--${this.route.entity.bundle}`,
        uuid: this.route.entity.uuid
      }
    }, JSON.stringify(this.route))
  },

  fetch ({ store, route }) {
    return store.dispatch('druxtRouter/get', route.fullPath)
  }
}

export default DruxtRouterComponent
