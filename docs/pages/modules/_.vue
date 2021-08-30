<template>
  <div>
    <!-- TODO: Add breadcrumb / path -->
    <h2 class="mb-5 text-3xl">{{ document.title }}</h2>

    <NuxtContent
      v-if="document"
      class="prose prose-sm sm:prose lg:prose-lg xl:prose-xl"
      :document="document"
    />
  </div>
</template>

<script>
export default {
  name: "AppGuideDocument",

  async asyncData({ $content, error, params, store, route }) {
    const path = params.pathMatch || "README";
    let response;
    try {
      response = await $content("modules/", params.pathMatch || "README").fetch();
    } catch (e) {
      return error({ message: "Document not found" });
    }

    store.commit("addRecent", { text: response.title, to: route.path });

    return { document: response, path };
  },

  head() {
    return {
      title: this.document.title,
    };
  },
};
</script>
