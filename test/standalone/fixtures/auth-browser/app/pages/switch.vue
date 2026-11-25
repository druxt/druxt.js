<script setup lang="ts">
defineOptions({ name: 'SwitchPage' })
// A site's own sign-in as someone else, called from the composable while the browser is signed in.
const { loggedIn, user, loginWithPassword } = useDruxtAuth()
const outcome = await loginWithPassword({ username: 'other', password: 'unused' }).then(
  () => 'signed in',
  (error: Error) => error.name === DRUXT_AUTH_SIGNED_IN ? 'refused' : error.name,
)
</script>

<template>
  <main>
    <p id="outcome">{{ outcome }}</p>
    <p id="signed-in">{{ loggedIn }}</p>
    <p id="user">{{ user?.name }}</p>
  </main>
</template>
