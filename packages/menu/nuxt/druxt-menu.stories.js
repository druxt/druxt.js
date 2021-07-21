import { default as DruxtMenu } from 'druxt-menu/src/components/DruxtMenu.vue'

export default {
  title: '<%= options.title %>',
  component: DruxtMenu,
  argTypes: {
    name: { control: null },
    depth: {
      control: {
        type: 'number',
        min: 0
      }
    }
  },
  parameters: {
    docs: {
      description: {
        component: '<%= options.description || " " %>'
      }
    }
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
    source: {
      code: '<DruxtMenu name="<%= options.name %>" />'
    }
  }
}
