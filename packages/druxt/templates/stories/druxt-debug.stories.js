import DruxtDebug from 'druxt/dist/components/DruxtDebug.vue'

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
  },
  open: true,
}
Json.parameters = {
  docs: {
    storyDescription: 'The **json** prop takes any data and runs it through a basic JSON formatter for improved readability.',
    source: {
      code: '<DruxtDebug :json="entity" open>Debug information</DruxtDebug>'
    },
  },
}

export const Summary = Template.bind({})
Summary.args = {
  summary: 'A brief debug message'
}
Summary.parameters = {
  docs: {
    storyDescription: 'The **summary** prop can be used to provide a quick explanation of the debug component.',
    source: {
      code: `<DruxtDebug summary="${Summary.args.sumary}">Debug information</DruxtDebug>`
    },
  },
}
