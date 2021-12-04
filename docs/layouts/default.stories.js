import DefaultLayout from './default.vue'

export default {
  title: 'Site/Layouts/Default',
  component: DefaultLayout,
}

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { DefaultLayout },
  template: '<DefaultLayout />'
})

export const Default = Template.bind({})
