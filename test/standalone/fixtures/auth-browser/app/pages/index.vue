<script setup lang="ts">
defineOptions({ name: 'BrowserPage' })
// The sign-in form, as the server renders it for the browser's cookies.
const { loggedIn } = useDruxtAuth()
</script>

<template>
  <main>
    <p id="signed-in">{{ loggedIn }}</p>
    <DruxtAuthLogin />
  </main>
</template>
