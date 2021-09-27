import DruxtView from './DruxtView.vue'

export default {
  title: 'Druxt/Views/DruxtView',
  component: DruxtView
}

const Template = (args, { argTypes }) => ({
  components: { DruxtView },
  props: Object.keys(argTypes),
  template: `<DruxtView v-bind="$props" />`
})

export const Default = Template.bind({})
Default.storyName = 'DruxtView'
