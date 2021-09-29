import DruxtMenu from './DruxtMenu.vue'

export default {
  title: 'Druxt/Menu/DruxtMenu',
  component: DruxtMenu
}

const Template = (args, { argTypes }) => ({
  components: { DruxtMenu },
  props: Object.keys(argTypes),
  template: `<DruxtMenu v-bind="$props" />`
})

export const Default = Template.bind({})
Default.storyName = 'DruxtMenu'
