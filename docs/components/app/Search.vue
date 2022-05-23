<template>
  <ul class="mb-5 menu">
    <li slot="title" class="menu-title">
      <span>Search</span>
    </li>
    <li>
      <div class="form-control">
        <input
          v-model="model"
          type="text"
          placeholder=""
          class="input input-bordered"
        >
      </div>
    </li>

    <!-- Results -->
    <template v-if="isResults">
      <template v-for="type of Object.keys(results)">
        <template v-if="results[type].length">
          <li :key="type" />
          <li
            v-for="item of results[type]"
            :key="item.id"
          >
            <NuxtLink
              class="rounded-btn"
              :to="item.path"
            >
              <component
                :is="`app-icon-${type}`"
                class="inline-block w-5 h-5 mr-2 stroke-current text-gray-400"
              />
              {{ item.title }}
            </NuxtLink>
          </li>
        </template>
      </template>
    </template>

    <!-- No results -->
    <li v-else-if="model && !isResults">
      <span class="rounded-btn">No results</span>
    </li>
  </ul>
</template>

<script>
export default {
  data: () => ({
    model: '',
    results: {
      api: [],
      guide: [],
      modules: [],
    },
  }),

  computed: {
    isResults: ({ results }) => results.api.length || results.guide.length || results.modules.length
  },

  watch: {
    async model() {
      // Empty results if model is empty.
      if (!this.model) {
        this.results = {
          api: [],
          guide: [],
          modules: [],
        }
        return
      }

      // Search all available data.
      for (const type of ['api', 'guide', 'modules']) {
        const results = await this.$content(type, { deep: true })
          .search(this.model)
          .limit(3)
          .fetch()
        this.results[type] = results
      }
    }
  }
}
</script>
