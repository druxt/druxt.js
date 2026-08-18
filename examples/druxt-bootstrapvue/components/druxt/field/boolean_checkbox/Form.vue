<template>
  <label class="coc-field-checkbox">
    <input v-model="model" type="checkbox" />
    <strong>{{ $parent.label.text }}</strong>
  </label>
</template>

<script>
import { DruxtFieldMixin } from 'druxt-entity'

// DruxtField's own default markup puts the checkbox on its own line below
// the label (<strong>Label:</strong><br><div><input></div>), styled here
// as an ordinary inline label + control instead - a dedicated component
// rather than a :has() CSS selector, which this toolchain's older
// vue-loader/postcss fails to parse inside a ::v-deep block.
export default {
  mixins: [DruxtFieldMixin],
}
</script>
