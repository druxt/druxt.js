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
      control: false,
    },
    type: {
      control: false,
    },
    uuid: {
      control: {
        type: 'select',
        options: [<%= (options.entities || []).map((o) => `'${o.id}'`).join(', ') %>],
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
  args.type = '<%= options.resourceType %>'
  args.uuid = args.uuid || <%= devalue(((options.entities || [])[0] || {}).id || false) %>
  return {
    props: Object.keys(args),
    template: '<DruxtEntityForm v-bind="$props" v-on="$props" />',
  }
}

//<% for (mode of options.displays) { %>
export const <%= mode.charAt(0).toUpperCase() + mode.slice(1) %> = Template.bind({})
<%= mode.charAt(0).toUpperCase() + mode.slice(1) %>.storyName = '<%= mode %>'
<%= mode.charAt(0).toUpperCase() + mode.slice(1) %>.args = { mode: '<%= mode %>' }
<%= mode.charAt(0).toUpperCase() + mode.slice(1) %>.parameters = {
  docs: {
    source: {
      code: '<DruxtEntityForm\n  mode="<%= mode %>"\n  type="<%= options.resourceType %>"\n  uuid=""\n/>'
    }
  }
}
//<% } %>
