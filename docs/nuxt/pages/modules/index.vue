<template>
  <div>
    <!-- TODO: Add breadcrumb / path -->
    <h2 class="mb-5 text-3xl">{{ document.title }}</h2>

    <NuxtContent
      v-if="document"
      class="mb-10 prose prose-sm sm:prose lg:prose-lg xl:prose-xl"
      :document="document"
    />

    <div
      v-for="module of $store.state.modules"
      :key="module.title"
      class="card mb-5 shadow-lg hover:shadow-2xl"
    >
      <div class="card-body">
        <h2 class="card-title" v-text="module.title" />
        <p v-text="module.description" />
        <div class="card-actions">
          <NuxtLink class="btn btn-secondary" tag="button" :to="module.dir">
            <AppIconModules class="h-5 w-5 mr-1" /> Get Started
          </NuxtLink>
          <NuxtLink
            class="btn btn-primary"
            tag="button"
            :to="`/api/packages/${module.dir.split('/')[2]}`"
          >
            <AppIconApi class="h-5 w-5 mr-1" /> API documentation
          </NuxtLink>
          <NuxtLink
            class="btn btn-ghost"
            tag="button"
            :to="`/api/packages/${module.dir.split('/')[2]}/CHANGELOG`"
          >
            <AppIconApi class="h-5 w-5 mr-1" /> Release notes
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Default from "./_.vue";

export default {
  extends: Default,
};
</script>
