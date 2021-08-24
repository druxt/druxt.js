<template>
  <div>
    <h2 class="text-2xl border-b mb-10">Modules</h2>

    <ul class="menu">
      <li
        v-for="module of $store.state.modules"
        :key="module"
      >
        <NuxtLink :to="`/api/packages/${module}/`" v-text="module" />
      </li>
    </ul>
  </div>
</template>
