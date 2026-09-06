<template>
  <div v-if="!$fetchState.pending">
    <h1>DruxtJS Entity explorer</h1>
    <blockquote>Select a resource type and entity to see the DruxtEntity component in action.</blockquote>

    <hr />

    <div style="margin-bottom: 1rem;">
      <label>Resource type: </label>
      <select v-model="resourceType" @change="$fetch">
        <option value="node--article">Articles</option>
        <option value="node--recipe">Recipes</option>
        <option value="node--page">Pages</option>
      </select>
    </div>

    <div style="margin-bottom: 1rem;">
      <label>Entity: </label>
      <select v-model="selectedUuid">
        <option
          v-for="item of resources.data"
          :key="item.id"
          :value="item.id"
        >{{ item.attributes.title }}</option>
      </select>
    </div>

    <div style="margin-bottom: 1rem;">
      <label>View mode: </label>
      <select v-model="display">
        <option
          v-for="item of displays.data"
          :key="item.attributes.mode"
          :value="item.attributes.mode"
        >{{ item.attributes.mode }}</option>
      </select>
    </div>

    <hr />

    <h2>Generated code</h2>
    <pre><code>{{ code }}</code></pre>

    <hr />

    <h2>Live preview</h2>
    <fieldset style="border: 1px solid #ccc; padding: 1rem;">
      <legend>DruxtEntity output</legend>
      <DruxtEntity
        v-if="selectedUuid"
        :mode="display"
        :type="resourceType"
        :uuid="selectedUuid"
      />
    </fieldset>
  </div>
  <div v-else>Loading...</div>
</template>

<script>
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'

export default {
  data: () => ({
    display: 'default',
    displays: { data: [] },
    resources: { data: [] },
    resourceType: 'node--recipe',
    selectedUuid: null,
  }),

  async fetch() {
    this.resources = await this.$store.dispatch('druxt/getCollection', {
      type: this.resourceType,
      query: new DrupalJsonApiParams()
        .addFilter('status', '1')
        .addFields(this.resourceType, ['id', 'title'])
    })
    this.selectedUuid = this.resources.data[0]?.id

    const parts = this.resourceType.split('--')
    this.displays = await this.$store.dispatch('druxt/getCollection', {
      type: 'entity_view_display--entity_view_display',
      query: new DrupalJsonApiParams()
        .addFilter('targetEntityType', parts[0])
        .addFilter('bundle', parts[1])
        .addFields('entity_view_display--entity_view_display', ['mode'])
    })
  },

  computed: {
    code() {
      return `<DruxtEntity
  mode="${this.display}"
  type="${this.resourceType}"
  uuid="${this.selectedUuid || '...'}"
/>`
    },
  },
}
</script>
