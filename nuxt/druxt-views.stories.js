import { DruxtView } from 'druxt-views'

export default {
  title: '<%= options.title %>',
  component: DruxtView,
  argTypes: {
    displayId: {
      control: {
        type: 'select',
        options: [<%= options.displays.map(({ id }) => `'${id}'`).join(', ') %>]
      },
      description: 'The View display ID.',
      table: {
        defaultValue: { summary: 'default' },
      },
    },
    uuid: {
      description: 'The View entity UUID.',
    },
    viewId: {
      description: 'The View ID.'
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
  uuid: '<%= options.uuid %>',
  viewId: '<%= options.viewId %>',
}
<%= display.id.charAt(0).toUpperCase() + display.id.slice(1) %>.storyName = '<%= display.display_title %>'
<%= display.id.charAt(0).toUpperCase() + display.id.slice(1) %>.parameters = {
  docs: {
    source: {
      code: '<DruxtView\n  display-id="<%= display.id %>"\n  uuid="<%= options.uuid %>"\n  view-id="<%= options.viewId %>"\n/>'
    }
  }
}
<% } %>
