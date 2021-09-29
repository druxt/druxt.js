import DruxtEntity from './DruxtEntity.vue'

export default {
  title: 'Druxt/Entity/DruxtEntity',
  component: DruxtEntity
}

const Template = (args, { argTypes }) => ({
  components: { DruxtEntity },
  props: Object.keys(argTypes),
  template: `<DruxtEntity v-bind="$props" />`
})

export const Default = Template.bind({})
Default.storyName = 'DruxtEntity'
