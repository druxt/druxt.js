<template>
  <component :is="component" v-if="entity" v-bind="props" />
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'DruxtRouter',

  async fetch ({ store, redirect, route }) {
    const result = await store.dispatch('druxtRouter/get', route.fullPath)

    // Process redirect.
    if (result.redirect) {
      redirect(result.redirect)
    }
  },

  computed: {
    component () {
      return 'div'
    },

    props () {
      if (!this.entity) {
        return false
      }

      return {
        type: this.route.jsonapi.resourceName,
        uuid: this.route.entity.uuid
      }
    },

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
  }
}
</script>
