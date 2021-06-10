<script>
import { DruxtModule } from 'druxt'

export default {
  name: 'DruxtCustomModule',

  extends: DruxtModule,

  methods: {
    getScopedSlots() {
      return {
        default: (attrs) => this.$createElement('div', { attrs }, [this.model]),
      }
    }
  },

  druxt: {
    componentOptions: () => ([['wrapper']]),
    propsData: ({ model }) => ({ value: model })
  },
}
</script>
