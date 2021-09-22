<template>
  <div>
    <!-- TODO: Add link to GitHub -->
    <div class="text-sm breadcrumbs">
      <ul>
        <li v-for="({ text, path }, index) of dirs" :key="index">
          <NuxtLink v-if="path" :to="path" v-text="text" />
          <span v-else v-text="text" />
        </li>
      </ul>
    </div>
    <!-- <h2 class="mb-5 text-3xl">{{ title }}</h2> -->

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

    dirs: ({ document }) => {
      const dirs = document.dir.replace("/api/", "src/").split("/");
      return dirs.map((dir, index) => {
        let path;
        if (index === 1) path = "/api";
        if (index > 1)
          path = dirs
            .slice(0, index + 1)
            .join("/")
            .replace("src/", "/api/");
        return {
          path,
          text: dir,
        };
      });
    },

    title: ({ document }) => document.title,
  },
};
</script>
