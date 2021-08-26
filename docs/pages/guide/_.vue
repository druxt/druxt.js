<template>
  <div>
    <!-- TODO: Add breadcrumb / path -->
    <NuxtContent
      v-if="document"
      class="
        prose prose-green prose-sm
        sm:prose sm:prose-green
        lg:prose-lg
        xl:prose-xl
      "
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
      response = await $content("guide/", params.pathMatch || "README").fetch();
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
