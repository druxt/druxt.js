<template>
  <div class="w-full navbar bg-neutral text-neutral-content">
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
    <div class="flex-1 px-2 mx-2">
      <span class="text-lg font-bold">{{ title }}</span>
    </div>
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
