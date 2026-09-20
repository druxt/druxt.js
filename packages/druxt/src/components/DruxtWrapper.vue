<template>
  <div>
    <slot v-bind="{ ...$parent.$attrs }" />
  </div>
</template>

<script>
/**
 * Placeholder component for the Druxt Wrapper theming system.
 */
export default {
  name: 'DruxtWrapper',

  // A module hands its wrapper the module's own attributes and every propsData
  // key the wrapper does not declare, so the wrapper can read them. Rendering
  // them here as well would repeat the module's attributes on a second element
  // and write objects into the markup as [object Object]. They stay readable
  // in $attrs either way.
  inheritAttrs: false
}
</script>
