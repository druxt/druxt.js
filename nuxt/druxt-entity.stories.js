import { DruxtEntity } from 'druxt-entity'

export default {
  title: '<%= options.title %>',
  component: DruxtEntity,
  argTypes: {
    mode: {
      control: null,
      description: 'The Drupal display mode.',
      table: {
        defaultValue: { summary: 'default' },
      },
    },
    type: {
      control: null,
      description: 'The JSON:API resource type.',
    },
    uuid: {
      control: {
        type: 'select',
        options: <%= JSON.stringify(options.uuids) %>,
      },
      description: 'The Drupal entity UUID.',
      type: { required: true },
    }
  },
}

const Template = (args, { argTypes }) => {
  return {
    props: Object.keys(args),
    template: '<DruxtEntity v-bind="$props" v-on="$props" />',
  }
}

<% for (mode of options.modes) { %>
export const <%= mode.charAt(0).toUpperCase() + mode.slice(1) %> = Template.bind({})
<%= mode.charAt(0).toUpperCase() + mode.slice(1) %>.args = {
  mode: '<%= mode %>',
  type: '<%= options.type %>',
  uuid: '<%= options.uuids[0] %>',
}
<%= mode.charAt(0).toUpperCase() + mode.slice(1) %>.storyName = '<%= mode %>'
<% } %>
