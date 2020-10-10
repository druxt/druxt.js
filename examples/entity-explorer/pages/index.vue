<template>
  <v-app>
    <v-app-bar app>
      <v-container>
        <h4>DruxtJS Entity explorer</h4>
      </v-container>
    </v-app-bar>

    <v-main>
      <v-container>
        <vue-live-preview :code="code" />
      </v-container>
    </v-main>

    <v-footer app>
      <v-container>
        <v-row>
          <v-col>
            <vue-live-editor :code="code" />
          </v-col>

          <v-col cols="12" md="6">
            <v-select
              v-model="resourceType"
              :hint="`Type: ${resourceType}`"
              :items="[
                { type: 'node--article', label: 'Articles' },
                { type: 'node--recipe', label: 'Recipes' },
                { type: 'node--page', label: 'Pages' }
              ]"
              item-text="label"
              item-value="type"
              persistent-hint
              @change="$fetch"
            />

            <v-select
              v-model="resource"
              :hint="`UUID: ${resource.id}`"
              :items="resources"
              item-text="attributes.title"
              persistent-hint
              return-object
            />

            <v-select
              v-model="display"
              :items="displays"
              item-text="attributes.mode"
              item-value="attributes.mode"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-footer>
  </v-app>
</template>

<script>
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { VueLiveEditor, VueLivePreview } from 'vue-live'
import { mapActions, mapState } from 'vuex'

import 'prismjs/themes/prism-tomorrow.css'
import 'vue-prism-editor/dist/prismeditor.min.css'

export default {
  components: { VueLiveEditor, VueLivePreview },

  data: () => ({
    display: 'default',
    displays: undefined,
    resource: undefined,
    resources: undefined,
    resourceType: 'node--recipe'
  }),

  async fetch() {
    const resourcesQuery = new DrupalJsonApiParams()
    resourcesQuery
      .addFilter('status', '1')
      .addFields(this.resourceType, ['id', 'title'])

    this.resources = await this.getResources({
      resource: this.resourceType,
      query: resourcesQuery
    })
    this.resource = this.resources[0]

    const parts = this.resourceType.split('--')
    const displaysQuery = new DrupalJsonApiParams()
    displaysQuery
      .addFilter('targetEntityType', parts[0])
      .addFilter('bundle', parts[1])
      .addFields('entity_view_display--entity_view_display', ['mode'])
    this.displays = await this.getResources({
      resource: 'entity_view_display--entity_view_display',
      query: displaysQuery
    })
  },

  computed: {
    code() {
      return `<druxt
  module="entity"
  :props-data="{
    mode: '${this.display}',
    type: '${this.resource.type}',
    uuid: '${this.resource.id}'
  }"
/>`
    },
  },

  methods: {
    ...mapActions({ getResources: 'druxtRouter/getResources' })
  }
}
</script>
