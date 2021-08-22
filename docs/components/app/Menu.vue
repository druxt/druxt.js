<template>
  <ul class="menu">
    <slot name="title" />
    <li v-for="item of $store.state.menu" :key="item.path">
      <NuxtLink class="rounded-btn" :to="item.path" v-text="item.title" />
    </li>
  </ul>
</template>
