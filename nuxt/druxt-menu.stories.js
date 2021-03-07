import { DruxtMenu } from 'druxt-menu'

export default {
  title: '<%= options.title %>',
  component: DruxtMenu,
  argTypes: {
    name: {
      control: null,
      description: 'The Menu name.',
      table: {
        defaultValue: { summary: 'main' },
      },
    },
  }
}

const Template = (args, { argTypes }) => {
  return {
    props: Object.keys(args),
    template: '<DruxtMenu v-bind="$props" v-on="$props" />',
  }
}

export const Default = Template.bind({})
Default.args = {
  name: '<%= options.name %>',
}
Default.parameters = {
  docs: {
    description: {
      component: '<%= options.description %>'
    },
    source: {
      code: '<DruxtMenu name="<%= options.name %>" />'
    }
  }
}
