import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { DruxtClient } from 'druxt'
import { default as DruxtEntity } from 'druxt-entity/src/components/DruxtEntity'
import { default as DruxtEntityForm } from 'druxt-entity/src/components/DruxtEntityForm'

const druxt = new DruxtClient('<%= options.druxt.baseUrl %>', <%= devalue(options.druxt) %>)

export default {
  title: '<%= options.title %>',
  component: DruxtEntity,
  subcomponents: { DruxtEntityForm },
  argTypes: {
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
}

const ViewTemplate = (args, { argTypes }) => {
  args.type = '<%= options.resourceType %>'
  args.uuid = args.uuid || '<%= ((options.entities || [])[0] || {}).id %>'
  return {
    props: Object.keys(args),
    template: '<DruxtEntity v-bind="$props" v-on="$props" />',
  }
}

const FormTemplate = (args, ctx) => {
  args.type = '<%= options.resourceType %>'
  args.uuid = args.uuid || '<%= ((options.entities || [])[0] || {}).id %>'
  return {
    props: Object.keys(args),
    template: '<DruxtEntityForm v-bind="$props" v-on="$props" />',
  }
}

//<% for (mode of options.viewDisplays) { %>
export const View<%= mode.charAt(0).toUpperCase() + mode.slice(1) %> = ViewTemplate.bind({})
View<%= mode.charAt(0).toUpperCase() + mode.slice(1) %>.storyName = 'View: <%= mode %>'
View<%= mode.charAt(0).toUpperCase() + mode.slice(1) %>.args = { mode: '<%= mode %>' }
View<%= mode.charAt(0).toUpperCase() + mode.slice(1) %>.parameters = {
  docs: {
    source: {
      code: '<DruxtEntity\n  mode="<%= mode %>"\n  type="<%= options.resourceType %>"\n  uuid=""\n/>'
    }
  }
}
//<% } %>

//<% for (mode of options.formDisplays) { %>
export const Form<%= mode.charAt(0).toUpperCase() + mode.slice(1) %> = FormTemplate.bind({})
Form<%= mode.charAt(0).toUpperCase() + mode.slice(1) %>.storyName = 'Form: <%= mode %>'
Form<%= mode.charAt(0).toUpperCase() + mode.slice(1) %>.args = { mode: '<%= mode %>' }
Form<%= mode.charAt(0).toUpperCase() + mode.slice(1) %>.parameters = {
  docs: {
    source: {
      code: '<DruxtEntityForm\n  mode="<%= mode %>"\n  type="<%= options.resourceType %>"\n  uuid=""\n/>'
    }
  }
}
//<% } %>
