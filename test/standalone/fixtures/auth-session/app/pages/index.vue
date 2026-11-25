<script setup lang="ts">
defineOptions({ name: 'SessionPage' })
// The auth routes turn pages on. The signed-in state, and a page only the editor may read, read by the server render
// with the session's cookies.
const route = useRoute()
const { loggedIn } = useDruxtAuth()
const druxt = useDruxtClient()
const { data: title } = await useAsyncData('draft', async () => {
  const uuid = route.query.uuid
  if (typeof uuid !== 'string') return null
  const response = await druxt.request<{ data?: { attributes?: { title?: string } } }>(`/jsonapi/node/page/${uuid}`, { validateStatus: () => true })
  return response.data?.data?.attributes?.title ?? null
})
</script>

<template>
  <main>
    <p id="signed-in">{{ loggedIn }}</p>
    <p id="title">{{ title }}</p>
  </main>
</template>
