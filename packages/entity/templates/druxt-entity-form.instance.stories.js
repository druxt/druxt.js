import DruxtEntityForm from 'druxt-entity/dist/components/DruxtEntityForm.vue'

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
      options: [<%= (options.displays || []).map((s) => `'${s}'`).join(', ') %>],
      control: {
        type: 'select',
      },
    },
    schemaType: {
      table: {
        disable: true
      }
    },
    type: {
      table: {
        disable: true
      }
    },
    uuid: {
      options: [<%= (options.entities || []).map((o) => `'${o.id}'`).join(', ') %>],
      control: {
        type: 'select',
        labels: Object.fromEntries([<%= (options.entities || []).map((o) => `['${o.id}', '${o.title.replace(/\'/g, "\\'")} (${o.id})']`).join(', ') %>])
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
        component: 'Renders a **<%= options.resourceType %>** content entity via the "Form" displays provided by Drupal.'
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
    description: {
      story: 'Render the content entity form using the **<%= mode %>** display mode.',
    },
    source: {
      code: '<DruxtEntityForm\n  mode="<%= mode %>"\n  type="<%= options.resourceType %>"\n  uuid=<%= devalue(((options.entities || [])[0] || {}).id || false) %>\n/>'
    }
  }
}

<% } %>
