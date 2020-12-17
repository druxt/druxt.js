<script>
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { DruxtComponentMixin } from 'druxt'
import { mapActions } from 'vuex'

/**
 * @example @lang vue
 * <DruxtSite :theme="theme" />
 *
 * @example @lang vue
 * <Druxt module="site" :theme="theme" />
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
    // Fetch all available regions.
    const resourceType = 'block--block'
    const regions = await this.getResources({
      resource: resourceType,
      query: new DrupalJsonApiParams()
        .addFilter('theme', this.theme)
        .addFields(resourceType, ['region']),
    }).then((resources) => resources.map((resource) => resource.attributes.region).filter((v, i, s) => s.indexOf(v) === i))
    this.regions = regions

    // Invoke DruxtComponent mixin.
    await DruxtComponentMixin.fetch.call(this)
  },

  data: () => ({
    regions: []
  }),

  methods: {
    ...mapActions({ getResources: 'druxtRouter/getResources' }),
  },

  render(h) {
    const wrapperData = {
      class: this.wrapper.class || undefined,
      style: this.wrapper.style || undefined,
      props: this.wrapper.propsData,
    }

    // Return only wrapper if fetch state is still pending.
    if (this.$fetchState.pending) {
      return h(this.wrapper.component, wrapperData)
    }

    // Build scoped slots for each region.
    const scopedSlots = {}
    Object.entries(this.regions).map(([index, region]) => {
      scopedSlots[region] = attrs => h('DruxtBlockRegion', {
        attrs,
        props: {
          name: region,
          theme: this.theme
        }
      })
    })

    // Build default slot.
    scopedSlots.default = attrs => Object.entries(this.regions).map(([index, region]) => scopedSlots[region](attrs))

    // Return wrapped component.
    return h(this.wrapper.component, wrapperData, [
      h(this.component.is, {
        props: this.component.propsData,
        scopedSlots,
      })
    ])
  },

  druxt: ({ vm }) => ({
    componentOptions: [[vm.theme], ['default']],

    propsData: {
      theme: vm.theme,
      regions: vm.regions
    }
  })
}
</script>
