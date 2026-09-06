<template>
  <label>
    <strong>{{ $parent.label.text }}:</strong>
    <br />
    <div>
      <select v-model="model">
        <option value="">&mdash; not set &mdash;</option>
        <option v-for="(label, value) in allowedValues" :key="value" :value="value">
          {{ label }}
        </option>
      </select>
    </div>
  </label>
</template>

<script>
import { DruxtFieldMixin } from 'druxt-entity'

// DruxtField's own type checks (isBoolean/isDateTime/isText) never match
// options_select, so it fell through to a free-text textarea - the modal
// accepted values the table's own <select> would reject. Reads the real
// allowed values from schema.settings.storage rather than hardcoding
// them, so this covers any options_select field, not just one.
export default {
  mixins: [DruxtFieldMixin],

  computed: {
    allowedValues() {
      return ((this.schema.settings || {}).storage || {}).allowed_values || {}
    },
  },
}
</script>
