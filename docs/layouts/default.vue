<template>
  <div class="flex flex-col h-screen">
    <AppHeader
      class="inset-x-0 top-0 z-50 w-full sticky"
      title="DruxtJS"
    />
    <FullTextSearch />

    <div>
      <input
        v-model="searchQuery"
        type="search"
        autocomplete="off"
      >

      <ul v-if="results.length">
        <li
          v-for="result of results"
          :key="result.key"
        >
          <router-link :to="result.path">
            {{ result.title }}
          </router-link>
        </li>
      </ul>
    </div>

    <div
      class="shadow bg-basr aw- grow"
      :class="{ 'drawer-mobile': $route.path !== '/' }"
    >
      <input
        id="sidebar"
        v-model="sidebar"
        type="checkbox"
        class="drawer-toggle"
      >

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
        <label
          for="sidebar"
          class="drawer-overlay"
        />
        <AppSidebar />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data: () => ({
    sidebar: false,
    searchQuery: "",
    results: [],
  }),

  watch: {
    $route() {
      // Close the sidebar.
      this.sidebar = false;

      // Scroll to the top of the main div.
      this.$refs.main.scrollTop = 0;
    },
    async searchQuery(searchQuery) {
      if (!searchQuery) {
        this.results = [];
        return;
      }
      var newResults = [];
      newResults = await this.$content("guide")
        .sortBy("createdAt", "asc")
        .limit(100)
        .search(searchQuery)
        .fetch();

      newResults.forEach(function (result, index) {
        //result.path += result.extension
        //console.log(item, index);
      })

      console.log(newResults[1]);
      // newResults.push( await this.$content('guide')
      //   .sortBy('createdAt', 'asc')
      //   .limit(100)
      //   .search(searchQuery)
      //   .fetch())

      // newResults.push( await this.$content('module')
      //   .sortBy('createdAt', 'asc')
      //   .limit(100)
      //   .search(searchQuery)
      //   .fetch())
      this.results = newResults;
      console.log(newResults[1]);
    },
  },
};
</script>
