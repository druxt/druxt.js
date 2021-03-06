import { DruxtEntity } from 'druxt-entity'

export default {
  title: '<%= options.title %>',
  component: DruxtEntity,
  argTypes: {
    mode: {
      control: null,
      description: 'The Entity display mode.',
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
        options: [<%= options.uuids.map((s) => `'${s}'`).join(', ') %>],
      },
      description: 'The Entity UUID.',
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
<%= mode.charAt(0).toUpperCase() + mode.slice(1) %>.parameters = {
  docs: {
    source: {
      code: '<DruxtEntity\n  mode="<%= mode %>"\n  type="<%= options.type %>"\n  uuid="<%= options.uuids[0] %>"\n/>'
    }
  }
}

<% } %>
