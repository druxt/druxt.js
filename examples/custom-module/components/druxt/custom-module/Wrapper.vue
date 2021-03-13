<template>
  <strong>
    <slot />
  </strong>
</template>

<script>
export default {
  props: ['text'],

  druxt: {
    foo: 'bar'
  },
}
</script>
