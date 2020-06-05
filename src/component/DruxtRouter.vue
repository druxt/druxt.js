<template>
  <div>
    <component :is="component" v-if="route" v-bind="props" />
  </div>
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
      return this.route.component || false
    },

    title () {
      return this.route.label || false
    },

    props () {
      return this.route.props || false
    },

    ...mapState({
      redirect: state => state.druxtRouter.redirect,
      route: state => state.druxtRouter.route
    })
  },

  head () {
    return {
      title: this.title,
      link: [
        {
          rel: 'canonical',
          href: this.canonical || this.route.canonical
        }
      ],
      meta: this.metatags || false
    }
  }
}
</script>
