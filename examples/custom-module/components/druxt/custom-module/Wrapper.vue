<template>
  <strong>
    <slot />
  </strong>
</template>

<script>
export default {
  props: {
    value: {
      type: String,
      default: '',
    },
  },

  data: ({ value }) => ({ model: value }),

  druxt: {
    foo: 'bar'
  },
}
</script>
