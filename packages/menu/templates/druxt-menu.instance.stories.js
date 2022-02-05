import DruxtMenu from 'druxt-menu/dist/components/DruxtMenu.vue'

export default {
  title: '<%= options.title %>',
  component: DruxtMenu,
  argTypes: {
    name: { table: { disable: true } },
  },
  parameters: {
    docs: {
      description: {
        component: '<%= options.description || " " %>'
      }
    }
  }
}

export const Default = (args, { argTypes }) => {
  return {
    props: Object.keys(args),
    template: '<DruxtMenu v-bind="$props" v-on="$props" />',
  }
}
Default.storyName = '<%= options.label %>'
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
