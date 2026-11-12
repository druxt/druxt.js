import { defineComponent } from 'vue'

/**
 * DruxtDevelTemplate in a production build. The tool writes files in development only, so this renders nothing, and
 * keeps the tool's markup out of the build.
 */
export default defineComponent({
  name: 'DruxtDevelTemplate',
  inheritAttrs: false,
  render: () => null,
})
