<template>
  <div class="container mx-auto my-20">
    <NuxtContent v-if="document" :document="document" />

    <div v-else>
      <div v-for="item of response" :key="item.path">
        <NuxtLink :to="item.path" v-text="item.slug" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  async asyncData({ $content, params, error }) {
    let response;
    try {
      response = await $content("api/", params.pathMatch || "index").fetch();
    } catch (e) {
      return error({ message: "Document not found" });
    }

    return { response };
  },

  computed: {
    document: ({ response }) =>
      !Array.isArray(response) ? response : undefined,
  },
};
</script>
