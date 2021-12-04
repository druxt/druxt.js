import AppSidebar from './Sidebar.vue'

export default {
  title: 'App/Sidebar',
  component: AppSidebar,
}

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { AppSidebar },
  template: '<AppSidebar v-bind="$props" />'
})

export const Default = Template.bind({})
