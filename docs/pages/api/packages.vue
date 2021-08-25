<template>
  <div>
    <h2 class="text-2xl border-b mb-10">Packages</h2>

    <ul class="menu">
      <li
        v-for="item of $store.state.packages"
        :key="item"
      >
        <NuxtLink :to="`/api/packages/${item}/`" v-text="item" />
      </li>
    </ul>
  </div>
</template>
