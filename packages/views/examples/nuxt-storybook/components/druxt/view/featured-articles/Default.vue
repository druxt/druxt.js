<template>
  <div v-if="slot">
    <slot />
  </div>

  <div v-else-if="slots">
    <slot name="header" />
    <slot name="results" />
    <slot name="pager" />
  </div>

  <div v-else>
    <DruxtEntity v-for="result of $attrs.results" :key="result.id" v-bind="props(result)" />
  </div>
</template>

<script>
export default {
  data: () => ({
    slot: true,
    slots: true,
  }),
  methods: {
    props: (o) => ({ type: o.type, uuid: o.id })
  },
  druxt: {
    query: {
      bundleFilter: true,
      fields: ['title'],
    }
  }
}
</script>
