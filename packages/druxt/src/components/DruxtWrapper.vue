<template>
  <div>
    <slot v-bind="{ ...$parent.$attrs }" />
  </div>
</template>

<script>
/**
 * Placeholder component for the Druxt Wrapper themeing system.
 */
export default {
  name: 'DruxtWrapper'
}
</script>
