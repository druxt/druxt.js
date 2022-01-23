import DruxtDebug from './DruxtDebug.vue'

export default {
  title: 'Druxt/DruxtDebug',
  component: DruxtDebug
}

const Template = (args) => ({
  components: { DruxtDebug },
  props: Object.keys(args),
  template: `<DruxtDebug v-bind="$props">Debug information.</DruxtDebug>`
})

export const Default = Template.bind({})
Default.storyName = 'Default slot'

export const Json = Template.bind({})
Json.args = {
  json: {
    type: '',
    id: '',
    links: {},
    attributes: {},
    relationships: {},
  }
}

export const Summary = Template.bind({})
Summary.args = {
  summary: 'A brief debug message'
}
