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
      v-for="module of modules"
      :key="module.title"
      class="card mb-5 shadow-lg hover:shadow-2xl"
    >
      <div class="card-body">
        <h2 class="card-title" v-text="module.title" />
        <p v-text="module.description" />
        <div class="card-actions">
          <NuxtLink class="btn btn-secondary" tag="button" :to="module.path">
            <AppIconModules class="h-5 w-5 mr-1" /> Get Started
          </NuxtLink>
          <NuxtLink
            class="btn btn-ghost"
            tag="button"
            :to="`/api/packages/${module.slug}`"
          >
            <AppIconApi class="h-5 w-5 mr-1" /> API documentation
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

  async asyncData(ctx) {
    const { $content, error } = ctx;
    let response;
    try {
      response = await $content("modules")
        .where({ slug: { $ne: "README" } })
        .only(["description", "path", "slug", "title"])
        .sortBy("title")
        .fetch();
    } catch (e) {
      return error({ message: "Document not found" });
    }

    return {
      ...(await Default.asyncData(ctx)),
      modules: response,
    };
  },
};
</script>
