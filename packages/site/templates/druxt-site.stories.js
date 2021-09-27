import DruxtSite from 'druxt-site/dist/components/DruxtSite.vue'

export default {
  title: '<%= options.title %>',
  component: DruxtSite,
  parameters: {
    docs: {
      description: {
        component: ' '
      },
    },
  },
}

const Template = (args, { argTypes }) => {
  return {
    props: Object.keys(argTypes),
    template: '<DruxtSite v-bind="$props" />',
  }
}

export const Default = Template.bind({})
Default.args = {
  theme: '<%= options.theme %>',
}
Default.storyName = '<%= options.theme.charAt(0).toUpperCase() + options.theme.slice(1) %>'
Default.parameters = {
  docs: {
    source: {
      code: '<DruxtSite theme="<%= options.theme %>" />'
    }
  }
}
