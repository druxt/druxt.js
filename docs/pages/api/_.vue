<template>
  <div>
    <!-- TODO: Add link to GitHub -->
    <div class="text-sm breadcrumbs">
      <ul>
        <li v-for="dir of dirs" :key="dir" v-text="dir" />
      </ul>
    </div>
    <h2 class="mb-5 text-3xl">{{ title }}</h2>

    <div>
      <!-- TODO: Link to module page? -->
      <div v-if="module" class="badge badge-primary">{{ module }}</div>
      <!-- TODO: Add file type badge; Component, Mixin, etc -->
    </div>

    <NuxtContent
      v-if="document"
      class="prose prose-sm sm:prose lg:prose-lg xl:prose-xl"
      :document="document"
    />
  </div>
</template>

<script>
export default {
  name: "AppApiDocument",

  async asyncData({ $content, error, params, store, route }) {
    let response;
    try {
      let path = params.pathMatch || "README";
      if (path.endsWith("/")) path += "index";
      response = await $content("api/", path).fetch();
      if (Array.isArray(response)) {
        response = await $content("api/", params.pathMatch + "/index").fetch();
      }
    } catch (e) {
      return error({ message: "Document not found" });
    }

    store.commit("addRecent", { text: response.title, to: route.path });

    return { document: response };
  },

  head() {
    return {
      title: this.document.title,
    };
  },

  computed: {
    module: ({ document }) => document.dir.split("/")[3],

    dirs: ({ document }) => document.dir.replace("/api/", "src/").split("/"),

    title: ({ document }) => document.title,
  },
};
</script>
