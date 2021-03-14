<script>
import { DruxtModule } from 'druxt'

export default {
  name: 'DruxtCustomModule',

  extends: DruxtModule,

  props: {
    text: {
      type: String,
      default: ''
    }
  },

  druxt: {
    componentOptions: () => ([['wrapper']]),
    propsData: ({ text }) => ({ text })
  },
}
</script>
