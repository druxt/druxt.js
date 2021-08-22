<template>
  <div class="p-4 overflow-y-auto w-80 bg-base-100">
    <AppMenu class="mb-5">
      <li slot="title" class="menu-title">
        <span>Navigation</span>
      </li>
    </AppMenu>

    <ul class="menu">
      <li slot="title" class="menu-title">
        <span>Modules</span>
      </li>
      <li v-for="module of $store.state.modules" :key="module">
        <NuxtLink class="rounded-btn" :to="`/api/packages/${module}`" v-text="module" />
      </li>
    </ul>
  </div>
</template>
