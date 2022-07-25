import AppMenu from './Menu.vue'

export default {
  title: 'App/Menu',
  component: AppMenu,
}

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { AppMenu },
  template: '<AppMenu v-bind="$props" />'
})

export const Default = Template.bind({})
