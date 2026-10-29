import DruxtMenu from 'druxt-menu/dist/components/DruxtMenu.vue'

export default {
  title: <%= JSON.stringify(options.title) %>,
  component: DruxtMenu,
  argTypes: {
    name: { table: { disable: true } },
  },
  parameters: {
    docs: {
      description: {
        component: <%= JSON.stringify(options.description || ' ') %>
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
Default.storyName = <%= JSON.stringify(options.label) %>
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
