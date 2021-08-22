<template>
  <div class="container mx-auto my-20">
    <h1 class="text-4xl border-b-3 mb-10">API Documentation</h1>

    <h2 class="text-2xl">Modules</h2>
    <ul class="menu">
      <li
        v-for="module of $store.state.modules"
        :key="module"
      >
        <NuxtLink :to="`/api/packages/${module}`" v-text="module" />
      </li>
    </ul>
  </div>
</template>
