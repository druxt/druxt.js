<template>
  <ul>
    <li v-for="item of $store.state.packages" :key="item">
      <h3 v-text="item" />

      <NuxtLink
        class="btn btn-secondary"
        tag="button"
        :to="`/api/packages/${item}/`"
      >
        Read the docs

        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          class="inline-block w-6 h-6 ml-2 stroke-current"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </NuxtLink>
    </li>
  </ul>
</template>
