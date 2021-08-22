<template>
  <div>
    <div class="bg-gray-100 border-b text-center">
      <div class="container mx-auto py-20">
        <AppLogo class="w-1/4 mx-auto" />
        <h1 class="text-6xl my-10" v-text="title" />
        <h2 class="text-3xl my-5" v-text="slogan" />
        <button class="btn btn-primary btn-lg">Get started</button>
      </div>
    </div>

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

    <div class="bg-gray-200 p-15 text-center">
      <blockquote class="container font-bold mx-auto text-2xl" v-text="quote" />
    </div>

    <div />
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
    quote:
      "Druxt makes an easy connection between a Drupal and Nuxt",
  }),
};
</script>
