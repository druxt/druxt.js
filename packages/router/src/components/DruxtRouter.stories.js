import DruxtRouter from './DruxtRouter.vue'

export default {
  title: 'Druxt/Router/DruxtRouter',
  component: DruxtRouter
}

const Template = (args, { argTypes }) => ({
  components: { DruxtRouter },
  props: Object.keys(argTypes),
  template: `<DruxtRouter v-bind="$props" />`
})

export const Default = Template.bind({})
Default.storyName = 'DruxtRouter'
Default.args = { path: '/' }
