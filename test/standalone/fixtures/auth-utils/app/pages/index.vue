<script setup lang="ts">
defineOptions({ name: 'AuthUtilsPage' })
// Each module's own signed-in state, read by the server render from the request's cookies.
const { loggedIn: druxt } = useDruxtAuth()
const { loggedIn: utils } = useUserSession()
</script>

<template>
  <main>
    <p id="druxt">{{ druxt }}</p>
    <p id="utils">{{ utils }}</p>
  </main>
</template>
