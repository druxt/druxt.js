<template>
  <ul class="breadcrumb">
    <li v-for="(crumb, i) in crumbs" :key="i" class="breadcrumb__item">
      <NuxtLink v-if="crumb.to" :to="crumb.to">{{ crumb.text }}</NuxtLink>
      <span v-else>{{ crumb.text }}</span>
    </li>
  </ul>
</template>

<script>
import { DruxtBreadcrumbMixin } from 'druxt-breadcrumb'

export default {
  mixins: [DruxtBreadcrumbMixin],
}
</script>

<style scoped>
.breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
}
.breadcrumb__item:not(:last-child)::after {
  content: '/';
  margin-left: 6px;
  color: var(--rule);
}
.breadcrumb__item a {
  color: var(--muted);
}
.breadcrumb__item a:hover {
  color: var(--ink);
}
</style>
