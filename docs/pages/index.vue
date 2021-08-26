<template>
  <div>
    <!-- Hero -->
    <div class="hero min-h-screen bg-base-200">
      <div class="text-center hero-content">
        <div class="max-w-md">
          <AppLogo class="w-1/2 mb-5 mx-auto" />
          <h1 class="mb-5 text-5xl font-bold" v-text="title" />
          <p class="mb-5" v-text="slogan" />
          <NuxtLink
            class="btn btn-primary"
            tag="button"
            to="/guide/getting-started"
            >Get started</NuxtLink
          >
        </div>
      </div>
    </div>

    <!-- Quote -->
    <div class="bg-gray-200 p-10">
      <div class="container mx-auto text-center">
        <blockquote class="text-2xl" v-text="quote" />
      </div>
    </div>

    <!-- Features / blocks -->
    <div class="container flex flex-col lg:flex-row mx-auto my-20">
      <div
        v-for="(block, index) of blocks"
        :key="index"
        class="flex-1 card p-2"
      >
        <h4 class="text-2xl mb-3" v-text="block.title" />
        <p class="text-lg" v-text="block.content" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data: () => ({
    title: "DruxtJS",
    slogan:
      "A Bridge between frameworks, Nuxt.js in the front, Drupal in the back.",
    blocks: [
      {
        title: "Simplicity first",
        content:
          "The Druxt component connects Nuxt.js to your Drupal JSON:API.",
      },
      {
        title: "Community built",
        content: "Built by the community, for the community.",
      },
      {
        title: "Decoupled Drupal sites",
        content:
          "The Site module brings decoupled Vue.js theming system to Drupal.",
      },
    ],
    quote: "DruxtJS provides an easy connection between a Drupal JSON:API backend and Nuxt.js frontend application",
  }),
};
</script>
