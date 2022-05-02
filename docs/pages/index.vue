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
            to="/guide"
          >
            <AppIconGuide class="inline-block h-5 w-5 mr-1" /> Get started
          </NuxtLink>
          <NuxtLink
            class="block btn btn-accent mb-3 w-full"
            tag="button"
            to="/modules"
          >
            <AppIconModules class="inline-block h-5 w-5 mr-1" /> Druxt modules
          </NuxtLink>
          <NuxtLink
            class="block btn btn-primary mb-3 w-full"
            tag="button"
            to="/api"
          >
            <AppIconApi class="inline-block h-5 w-5 mr-1" /> API documentation
          </NuxtLink>
        </div>
      </div>
    </div>

    <div class="hero">
      <div class="flex-col hero-content lg:flex-row-reverse my-20">
        <img
          src="/images/umami.png"
          class="max-w-full lg:max-w-xl rounded-lg shadow-2xl"
        />
        <div>
          <h2 class="mb-5 text-5xl font-bold">Fully decoupled sites</h2>
          <p class="mb-5">
            The Druxt Site module provides an out-of-the-box Drupal Site
            experience, using Drupal's content and configuration to drive the
            frontend.
          </p>
          <NuxtLink
            class="btn btn-secondary"
            tag="button"
            to="/modules/site/getting-started"
            >Get Started</NuxtLink
          >
          <a
            class="btn btn-accent"
            href="https://demo.druxtjs.org"
            target="_blank"
            >See a demo</a
          >
          <a
            class="btn"
            href="https://gitpod.io#github.com/druxt/quickstart-druxt-site"
            target="_blank"
            >Try on GitPod</a
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  head: {
    titleTemplate: "DruxtJS",
  },

  data: () => ({
    title: "DruxtJS",
    slogan: "The Fully Decoupled Drupal Framework",
  }),
};
</script>
