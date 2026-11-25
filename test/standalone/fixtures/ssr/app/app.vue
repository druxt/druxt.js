<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'DruxtSsr',
  props: druxtModuleProps,
  emits: druxtModuleEmits,
  setup: (p) => useDruxtModule(p, {
    componentOptions: () => [['default']],
    propsData: () => ({ title: 'Rendered on the server' }),
  }),
})
</script>
