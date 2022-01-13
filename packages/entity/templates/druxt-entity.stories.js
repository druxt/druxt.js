import DruxtEntity from 'druxt-entity/dist/components/DruxtEntity.vue'

export default {
  title: '<%= options.title %>',
  component: DruxtEntity,
  argTypes: {
    input: {
      action: 'input',
    },
    mode: {
      options: [<%= (options.displays || []).map((s) => `'${s}'`).join(', ') %>],
      control: {
        type: 'select',
      },
    },
    settings: {
      control: {
        type: 'object',
      },
    },
    schemaType: {
      options: ['view', 'form'],
      control: {
        type: 'select',
      },
    },
    type: {},
    uuid: {
      options: [<%= (options.entities || []).map((o) => `'${o.id}'`).join(', ') %>],
      control: {
        type: 'select',
      },
    },
    value: {
      control: {
        type: 'object',
      },
      table: {
        category: 'props',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'The DruxtEntity component renders Drupal content entities via the "View" displays provided by Drupal.'
      },
    },
  },
}

const Template = (args) => {
  return {
    props: Object.keys(args),
    template: '<DruxtEntity v-bind="$props" v-on="$props" />',
  }
}

<% for (mode of options.displays) { %>
// Display: <%= mode %>.
export const <%= mode.charAt(0).toUpperCase() + mode.slice(1) %> = Template.bind({})
<%= mode.charAt(0).toUpperCase() + mode.slice(1) %>.storyName = '<%= mode %>'
<%= mode.charAt(0).toUpperCase() + mode.slice(1) %>.args = {
  mode: '<%= mode %>',
  schemaType: 'view',
  type: '<%= options.resourceType %>',
  uuid: <%= devalue(((options.entities || [])[0] || {}).id || false) %>,
}
<%= mode.charAt(0).toUpperCase() + mode.slice(1) %>.parameters = {
  docs: {
    source: {
      code: '<DruxtEntity\n  mode="<%= mode %>"\n  type="<%= options.resourceType %>"\n  uuid=<%= devalue(((options.entities || [])[0] || {}).id || false) %>\n/>'
    }
  }
}

<% } %>
