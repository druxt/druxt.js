import DruxtBlockRegion from './DruxtBlockRegion.vue'

export default {
  title: 'Druxt/Blocks/DruxtBlockRegion',
  component: DruxtBlockRegion
}

const Template = (args, { argTypes }) => ({
  components: { DruxtBlockRegion },
  props: Object.keys(argTypes),
  template: `<DruxtBlockRegion v-bind="$props" />`
})

export const Default = Template.bind({})
Default.storyName = 'DruxtBlockRegion'
