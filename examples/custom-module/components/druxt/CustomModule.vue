<script>
import DruxtModule from 'druxt/dist/components/DruxtModule.vue'

export default {
  name: 'DruxtCustomModule',

  extends: DruxtModule,

  druxt: {
    componentOptions: () => ([['Default']]),
    propsData: ({ model }) => ({ value: model }),
    slots(h) {
      return {
        default: (attrs) => h('div', { attrs }, [this.model])
      }
    },
  },
}
</script>
