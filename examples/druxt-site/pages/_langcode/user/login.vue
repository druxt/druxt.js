<template>
  <ClientOnly placeholder="Loading...">
    {{ redirect() }}
  </ClientOnly>
</template>

<script>
export default {
  methods: {
    redirect() {
      this.$nuxt.$auth.loginWith('drupal-authorization_code')
    }
  }
}
</script>
