import { default as DruxtEntityForm } from 'druxt-entity/src/components/DruxtEntityForm'

export default {
  title: '<%= options.title %>',
  component: DruxtEntityForm,
  argTypes: {
    error: {
      action: 'error',
    },
    input: {
      action: 'input',
    },
    submit: {
      action: 'submit',
    },
    reset: {
      action: 'reset',
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
        component: 'The DruxtEntityForm component renders Drupal content entities via the "Form" displays provided by Drupal.'
      }
    }
  }
}

const Template = (args, ctx) => {
  return {
    props: Object.keys(args),
    template: '<DruxtEntityForm v-bind="$props" v-on="$props" />',
  }
}

<% for (mode of options.displays) { %>
// Display: <%= mode %>.
export const <%= mode.charAt(0).toUpperCase() + mode.slice(1) %> = Template.bind({})
<%= mode.charAt(0).toUpperCase() + mode.slice(1) %>.storyName = '<%= mode %>'
<%= mode.charAt(0).toUpperCase() + mode.slice(1) %>.args = {
  mode: '<%= mode %>',
  schemaType: 'form',
  type: '<%= options.resourceType %>',
  uuid: <%= devalue(((options.entities || [])[0] || {}).id || false) %>,
}
<%= mode.charAt(0).toUpperCase() + mode.slice(1) %>.parameters = {
  docs: {
    source: {
      code: '<DruxtEntityForm\n  mode="<%= mode %>"\n  type="<%= options.resourceType %>"\n  uuid=""\n/>'
    }
  }
}

<% } %>
