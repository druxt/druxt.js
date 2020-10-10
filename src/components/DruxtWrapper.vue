<template>
  <div>
    <slot />
  </div>
</template>

<script>
/**
 * The default Druxt module wrapper Vue.js component.
 *
 * This component is used by the Druxt component if an appropriate component can not be found
 * for the specified module.
 *
 * @private
 */
export default {
  name: 'DruxtWrapper'
}
</script>
