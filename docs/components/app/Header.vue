<template>
  <div class="w-full navbar">
    <div class="flex-none" :class="{ 'lg:hidden': $route.path !== '/' }">
      <label for="sidebar" class="btn btn-square btn-ghost">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          class="inline-block w-6 h-6 stroke-current"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          ></path>
        </svg>
      </label>
    </div>
    <NuxtLink class="flex-1 px-2 mx-2 flex" tag="div" to="/">
      <AppLogo class="mr-1 w-10" />
      <span class="block text-2xl mt-2.5">{{ title }}</span>
    </NuxtLink>
    <div class="flex-none hidden lg:block">
      <AppMenu class="horizontal" />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      required: true,
    },
  },
};
</script>
