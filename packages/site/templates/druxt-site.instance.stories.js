import DruxtSite from 'druxt-site/dist/components/DruxtSite.vue'

export default {
  title: '<%= options.title %>',
  component: DruxtSite,
  argTypes: {
    theme: {
      control: false,
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'Renders a Drupal block regions using the **<%= options.theme %>** theme configuration.\n\n```jsx\n\n<DruxtSite theme="<%= options.theme %>" />\n```'
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
