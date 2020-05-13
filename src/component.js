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
      entity: (state) => {
        if (!state.druxtRouter.route.data) {
          return undefined
        }

        return state.druxtRouter.entities[state.druxtRouter.route.data.entity.uuid]
      },
      redirect: state => state.druxtRouter.redirect,
      route: state => state.druxtRouter.route.data
    })
  },

  render (createElement) {
    if (typeof this.entity === 'undefined') {
      return
    }

    return createElement('div', {
      key: this.route.entity.uuid,
      props: {
        type: this.route.jsonapi.resourceName,
        uuid: this.route.entity.uuid
      }
    }, JSON.stringify(this.entity.data))
  },

  async fetch ({ store, redirect, route }) {
    const result = await store.dispatch('druxtRouter/get', route.fullPath)

    // Process redirect.
    if (result.redirect) {
      redirect(result.redirect)
    }
  }
}

export default DruxtRouterComponent
