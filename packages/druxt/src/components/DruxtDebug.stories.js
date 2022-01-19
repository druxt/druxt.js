import DruxtDebug from './DruxtDebug.vue'

export default {
  title: 'Druxt/DruxtDebug',
  component: DruxtDebug
}

const Template = (args, { argTypes }) => ({
  components: { DruxtDebug },
  props: Object.keys(argTypes),
  template: `<DruxtDebug v-bind="$props">Debug information.</DruxtDebug>`
})

export const Default = Template.bind({})
Default.storyName = 'DruxtDebug'
