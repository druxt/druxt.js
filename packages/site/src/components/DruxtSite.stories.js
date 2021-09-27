import DruxtSite from './DruxtSite.vue'

export default {
  title: 'Druxt/Site/DruxtSite',
  component: DruxtSite
}

const Template = (args, { argTypes }) => ({
  components: { DruxtSite },
  props: Object.keys(argTypes),
  template: `<DruxtSite v-bind="$props" />`
})

export const Default = Template.bind({})
Default.storyName = 'DruxtSite'
