import DruxtModule from './DruxtModule.vue'

export default {
  title: 'Druxt/DruxtModule',
  component: DruxtModule
}

const Template = (args, { argTypes }) => ({
  components: { DruxtModule },
  props: Object.keys(argTypes),
  template: `<DruxtModule v-bind="$props" />`
})

export const Default = Template.bind({})
Default.storyName = 'DruxtModule'
