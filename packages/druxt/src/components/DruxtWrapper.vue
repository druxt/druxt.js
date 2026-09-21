<template>
  <div>
    <slot v-bind="slotAttrs" />
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
  inheritAttrs: false,

  computed: {
    /**
     * The module's attributes, for the default slot.
     *
     * A module renders its fields through this slot, and hands each one these
     * attributes, so whatever is here reaches every module below. `id` names
     * one element, so it is left out rather than repeated on each of them.
     * DruxtModule withholds `data-fetch-key` for the same reason.
     *
     * @type {object}
     */
    slotAttrs() {
      const attrs = { ...(this.$parent || {}).$attrs }
      delete attrs.id
      return attrs
    }
  }
}
</script>
