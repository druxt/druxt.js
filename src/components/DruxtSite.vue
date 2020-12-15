<template>
  <component
    :is="component.is"
    v-bind="component.propsData"
  >
    <template
      v-for="region of regions"
      #[region]
    >
      <DruxtBlockRegion
        :key="region"
        :name="region"
        :theme="theme"
      />
    </template>
  </component>
</template>

<script>
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { DruxtComponentMixin } from 'druxt'
import { mapActions } from 'vuex'

/**
 * @example @lang vue
 * <DruxtSite />
 *
 * @example @lang vue
 * <Druxt module="site" />
 */
export default {
  name: 'DruxtSite',

  mixins: [DruxtComponentMixin],

  props: {
    theme: {
      type: String,
      required: true
    }
  },

  async fetch() {
    const resourceType = 'block--block'
    const regions = await this.getResources({
      resource: resourceType,
      query: new DrupalJsonApiParams()
        .addFilter('theme', this.theme)
        .addFields(resourceType, ['region']),
    }).then((resources) => resources.map((resource) => resource.attributes.region).filter((v, i, s) => s.indexOf(v) === i))
    this.regions = regions

    await DruxtComponentMixin.fetch.call(this)
  },

  data: () => ({
    regions: []
  }),

  methods: {
    ...mapActions({ getResources: 'druxtRouter/getResources' }),
  },

  druxt: ({ vm }) => ({
    componentOptions: [[vm.theme], ['default']],

    propsData: {
      theme: vm.theme
    }
  })
}
</script>
