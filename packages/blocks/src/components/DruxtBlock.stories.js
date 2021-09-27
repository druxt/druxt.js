import DruxtBlock from './DruxtBlock.vue'

export default {
  title: 'Druxt/Blocks/DruxtBlock',
  component: DruxtBlock
}

const Template = (args, { argTypes }) => ({
  components: { DruxtBlock },
  props: Object.keys(argTypes),
  template: `<DruxtBlock v-bind="$props" />`
})

export const Default = Template.bind({})
Default.storyName = 'DruxtBlock'
