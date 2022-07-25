import AppLogo from './Logo.vue'

export default {
  title: 'App/Logo',
  component: AppLogo,
}

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { AppLogo },
  template: '<AppLogo v-bind="$props" />'
})

export const Default = Template.bind({})
