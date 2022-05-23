<template>
  <div v-if="!$fetchState.pending">
    <ul>
      <li
        v-for="language of languages.data.filter((o) => typeof o === 'object')"
        :key="language.attributes.drupal_internal__id"
      >
        <NuxtLink
          :to="`/${language.attributes.drupal_internal__id}`"
          v-text="language.attributes.label"
        />
      </li>
    </ul>
  </div>

  <div v-else />
</template>

<script>
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { DruxtBlocksBlockMixin } from 'druxt-blocks'

export default {
  mixins: [DruxtBlocksBlockMixin],

  data: () => ({
    languages: undefined
  }),

  async fetch() {
    const resourceType = 'configurable_language--configurable_language'
    const query = new DrupalJsonApiParams()
      .addFilter('drupal_internal__id', ['und', 'zxx'], 'NOT IN')
      .addFields(resourceType, ['drupal_internal__id', 'label'])
    this.languages = await this.$store.dispatch('druxt/getCollection', {
      type: resourceType,
      query
    })
  }
}
</script>
