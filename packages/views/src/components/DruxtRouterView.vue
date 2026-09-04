<template>
  <DruxtView v-bind="route.props" />
</template>

<script>
import { DruxtRouterMixin } from 'druxt-router'

/**
 * Renders a Views route via the DruxtView component.
 *
 * The DruxtRouter component renders this component automatically for Views
 * routes; the route props are passed through to DruxtView.
 *
 * @see {@link ./DruxtView|DruxtView}
 * @see https://druxtjs.org/modules/views
 *
 * @example @lang vue
 * <DruxtRouterView :route="route" />
 */
export default {
  mixins: [DruxtRouterMixin],
}
</script>
