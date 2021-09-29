import DruxtEntityForm from './DruxtEntityForm.vue'

export default {
  title: 'Druxt/Entity/DruxtEntityForm',
  component: DruxtEntityForm
}

const Template = (args, { argTypes }) => ({
  components: { DruxtEntityForm },
  props: Object.keys(argTypes),
  template: `<DruxtEntityForm v-bind="$props" />`
})

export const Default = Template.bind({})
Default.storyName = 'DruxtEntityForm'
