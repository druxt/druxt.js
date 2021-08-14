import { default as DruxtEntity } from 'druxt-entity/src/components/DruxtEntity'

export default {
  title: '<%= options.title %>',
  component: DruxtEntity,
  argTypes: {
    input: {
      action: 'input',
    },
    mode: {
      control: {
        type: 'select',
        options: [<%= (options.displays || []).map((s) => `'${s}'`).join(', ') %>],
      },
    },
    schemaType: {
      control: {
        type: 'select',
        options: ['view', 'form'],
      },
    },
    type: {},
    uuid: {
      control: {
        type: 'select',
        options: [<%= (options.entities || []).map((o) => `'${o.id}'`).join(', ') %>],
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

const Template = (args, { argTypes }) => {
  return {
    props: Object.keys(argTypes),
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
