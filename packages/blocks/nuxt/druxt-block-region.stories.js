import DruxtBlockRegion from 'druxt-blocks/dist/components/DruxtBlockRegion.vue'

export default {
  title: '<%= options.title %>',
  component: DruxtBlockRegion,

  parameters: {
    docs: {
      description: {
        component: 'The <strong><%= options.region %></strong> Block region for the <strong><%= options.theme %></strong> theme.'
      },
    },
  },
}

const Template = (args, { argTypes }) => {
  return {
    props: Object.keys(argTypes),
    template: '<DruxtBlockRegion v-bind="$props" v-on="$props" />',
  }
}

export const Default = Template.bind({})
Default.args = {
  name: '<%= options.region %>',
  theme: '<%= options.theme %>',
}
Default.storyName = 'DruxtBlockRegion'
Default.parameters = {
  docs: {
    source: {
      code: '<DruxtBlockRegion name="<%= options.region %>" theme="<%= options.theme %>" />'
    }
  }
}
