import DruxtBreadcrumb from './DruxtBreadcrumb.vue'

export default {
  title: 'Druxt/Breadcrumb/DruxtBreadcrumb',
  component: DruxtBreadcrumb
}

const Template = (args, { argTypes }) => ({
  components: { DruxtBreadcrumb },
  props: Object.keys(argTypes),
  template: `<DruxtBreadcrumb v-bind="$props" />`
})

export const Default = Template.bind({})
Default.storyName = 'DruxtBreadcrumb'
