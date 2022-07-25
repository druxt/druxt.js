<template>
  <div v-if="$fetchState.pending">Loading ...</div>
  <div v-else>
    <div v-for="field of schema.fields.filter((o) => data[o.id])" :key="field.id">
      <strong>{{ field.id }}:</strong>
      <pre><code>{{ JSON.stringify(data[field.id], null, '  ') }}</code></pre>
      <details>
        <summary><strong>Field schema</strong></summary>
        <pre><code>{{ JSON.stringify(field, null, '  ') }}</code></pre>
      </details>
      <br />
    </div>
  </div>
</template>

<script>
import { DruxtSchemaMixin } from 'druxt-schema'
export default {
  mixins: [DruxtSchemaMixin],
  props: {
    data: {
      type: Object,
      required: true
    }
  },
}
</script>
