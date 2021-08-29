<template>
  <div>
    <div class="hero min-h-screen bg-base-200">
      <div class="text-center hero-content">
        <div class="max-w-md">
          <AppLogo class="w-1/2 mb-5 mx-auto" />
          <h1 class="mb-5 text-5xl font-bold" v-text="title" />
          <h2 class="mb-10 text-2xl text-gray-400" v-text="slogan" />
          <NuxtLink
            class="block btn btn-secondary mb-3 w-full"
            tag="button"
            to="/guide/getting-started"
            >Get started</NuxtLink
          >
          <NuxtLink
            class="block btn btn-primary mb-3 w-full"
            tag="button"
            to="/api"
            >API documentation</NuxtLink
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data: () => ({
    title: "DruxtJS",
    slogan: "The Fully Decoupled Drupal Framework",
  }),
};
</script>
