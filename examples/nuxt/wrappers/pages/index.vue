<template>
  <div v-if="!$fetchState.pending">
    <details>
      <summary><strong>Wrapper: default</strong></summary>
      <DruxtEntity :type="type" :uuid="uuid" />
    </details>

    <details>
      <summary><strong>Wrapper: false</strong></summary>
      <DruxtEntity :type="type" :uuid="uuid" :wrapper="false" />
    </details>

    <details>
      <summary><strong>Template injection / Wrapper: default</strong></summary>
      <DruxtEntity :type="type" :uuid="uuid">
        <template #default="{ entity }">
          <pre><code>{{ JSON.stringify(entity, null, '  ') }}</code></pre>
        </template>
      </DruxtEntity>
    </details>

    <details>
      <summary><strong>Template injection / Wrapper: true</strong></summary>
      <DruxtEntity :type="type" :uuid="uuid" :wrapper="true">
        <template #default="{ entity }">
          <pre><code>{{ JSON.stringify(entity, null, '  ') }}</code></pre>
        </template>
      </DruxtEntity>
    </details>
  </div>

  <div v-else>Loading...</div>
</template>

<script>
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'

export default {
  async fetch() {
    const query = new DrupalJsonApiParams().addPageLimit(1).addFields(this.type, ['id'])
    this.uuid = (await this.$store.dispatch('druxt/getCollection', { type: this.type, query })).data[0].id
  },

  data: () => ({
    uuid: null,
    type: 'node--page'
  })
}
</script>
