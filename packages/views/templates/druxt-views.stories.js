import DruxtView from 'druxt-views/dist/components/DruxtView.vue'

export default {
  title: <%= devalue(options.title) %>,
  component: DruxtView,
  argTypes: {
    displayId: {
      options: [<%= options.displays.map(({ id }) => `'${id}'`).join(', ') %>],
      control: {
        type: 'select',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        component: <%= options.description ? devalue(options.description) : '" "' %>
      }
    }
  }
}

const Template = (args, { argTypes }) => ({
  props: Object.keys(args),
  template: '<DruxtView v-bind="$props" v-on="$props" />',
})

<% for (display of options.displays) { %>
export const <%= display.id.charAt(0).toUpperCase() + display.id.slice(1) %> = Template.bind({})
<%= display.id.charAt(0).toUpperCase() + display.id.slice(1) %>.args = {
  displayId: '<%= display.id %>',
  viewId: '<%= options.viewId %>',
}
<%= display.id.charAt(0).toUpperCase() + display.id.slice(1) %>.storyName = '<%= display.display_title %>'
<%= display.id.charAt(0).toUpperCase() + display.id.slice(1) %>.parameters = {
  docs: {
    source: {
      code: '<DruxtView display-id="<%= display.id %>" view-id="<%= options.viewId %>" />'
    }
  }
}
<% } %>
