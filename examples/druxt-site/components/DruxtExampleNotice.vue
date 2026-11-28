<script>
import DruxtModule from 'druxt/dist/components/DruxtModule.vue'

/**
 * A Druxt module with nothing to render it: no default slot and no theme
 * component. It is here for the DruxtDevelTemplate example, which needs a
 * component that Druxt can only show its development panel for, so don't add
 * a theme component for it under `components/druxt/example/notice`.
 */
export default {
  name: 'DruxtExampleNotice',

  extends: DruxtModule,

  props: {
    kind: {
      type: String,
      default: 'info',
    },
  },

  druxt: {
    // DruxtExampleNoticeWarning, then DruxtExampleNoticeDefault.
    componentOptions: ({ kind }) => [[kind], ['default']],
    propsData: ({ kind }) => ({ kind }),
  },
}
</script>
