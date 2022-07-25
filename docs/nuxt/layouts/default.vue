<template>
  <div class="flex flex-col h-screen">
    <AppHeader class="inset-x-0 top-0 z-50 w-full sticky" title="DruxtJS" />

    <div
      class="shadow bg-base-200 drawer flex-grow"
      :class="{ 'drawer-mobile': $route.path !== '/' }"
    >
      <input
        id="sidebar"
        type="checkbox"
        class="drawer-toggle"
        v-model="sidebar"
      />

      <main
        ref="main"
        class="
          flex-grow
          block
          overflow-x-hidden
          bg-base-100
          text-base-content
          drawer-content
        "
      >
        <Nuxt />
      </main>

      <div class="drawer-side">
        <label for="sidebar" class="drawer-overlay"></label>
        <AppSidebar />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data: () => ({
    sidebar: false,
  }),

  watch: {
    $route() {
      // Close the sidebar.
      this.sidebar = false

      // Scroll to the top of the main div.
      this.$refs.main.scrollTop = 0
    }
  }
}
</script>
