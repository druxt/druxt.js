<template>
  <div>
    <div v-for="item of $store.state.packages" :key="item">
      <h3 v-text="item" />

      <!-- TODO: Add details about package -->

      <NuxtLink class="link" :to="`/api/packages/${item}/`">
        Read the docs
      </NuxtLink>
    </div>
  </div>
</template>
