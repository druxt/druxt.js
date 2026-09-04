<template>
  <DruxtEntity
    v-bind="route.props"
    mode="full"
  />
</template>

<script>
import { DruxtRouterMixin } from 'druxt-router'

/**
 * Renders the resolved DruxtRouter route as a DruxtEntity component, using the
 * 'full' display mode.
 *
 * Used by the DruxtRouter to render decoupled Drupal entity routes; it is not
 * intended to be used directly.
 *
 * @see https://druxtjs.org/modules/router
 */
export default {
  mixins: [DruxtRouterMixin],
}
</script>
