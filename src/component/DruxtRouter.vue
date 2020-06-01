<template>
  <component :is="component" v-if="route" v-bind="props" />
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
      return this.$druxtRouter().options.render
    },

    props () {
      if (!this.route) {
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
