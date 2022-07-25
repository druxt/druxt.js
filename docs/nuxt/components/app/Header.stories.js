import AppHeader from './Header.vue'

export default {
  title: 'App/Header',
  component: AppHeader,
}

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { AppHeader },
  template: '<AppHeader v-bind="$props" />'
})

export const Default = Template.bind({})
Default.args = {
  title: 'DruxtJS'
}
