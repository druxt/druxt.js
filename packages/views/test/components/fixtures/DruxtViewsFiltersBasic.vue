<template>
  <form @submit.prevent>
    <slot name="difficulty" />
    <button data-test="apply" type="button" @click="$emit('input', value)">
      {{ options.submit_button }}
    </button>
  </form>
</template>

<script>
import { DruxtViewsFiltersMixin } from '../../../src/mixins/filters'

// A site's own wrapper for the `basic` exposed form, which applies the filters
// when its button is pressed rather than as they change.
export default {
  name: 'DruxtViewsFiltersBasic',

  mixins: [DruxtViewsFiltersMixin],
}
</script>
