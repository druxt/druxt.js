<template>
  <ul class="mb-5 menu">
    <li slot="title" class="menu-title">
      <span>Search</span>
    </li>
    <li>
      <div class="form-control">
        <input
          type="text"
          placeholder=""
          class="input input-bordered"
          v-model="model"
        />
      </div>
    </li>
    <template v-if="isResults">
      <!-- Guide pages -->
      <template v-if="results.guide.length">
        <li v-for="item of results.guide" :key="item.id">
          <NuxtLink class="rounded-btn" :to="item.path">
            <AppIconGuide class="inline-block w-5 h-5 mr-2 stroke-current text-gray-400" />
            {{ item.title }}
          </NuxtLink>
        </li>
      </template>

      <!-- Module pages -->
      <template v-if="results.modules.length">
        <li v-for="item of results.modules" :key="item.id">
          <NuxtLink class="rounded-btn" :to="item.path">
            <AppIconModules class="inline-block w-5 h-5 mr-2 stroke-current text-gray-400" />
            {{ item.title }}
          </NuxtLink>
        </li>
      </template>

      <!-- API pages -->
      <template v-if="results.api.length">
        <li v-for="item of results.api" :key="item.id">
          <NuxtLink class="rounded-btn" :to="item.path">
            <AppIconApi class="inline-block w-5 h-5 mr-2 stroke-current text-gray-400" />
            {{ item.title }}
          </NuxtLink>
        </li>
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
