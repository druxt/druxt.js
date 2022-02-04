import DruxtBlockRegion from 'druxt-blocks/dist/components/DruxtBlockRegion.vue'

export default {
  title: '<%= options.title %>',
  component: DruxtBlockRegion,
  argTypes: {
    name: {
      control: false
    },
    theme: {
      control: false
    }
  },
  parameters: {
    docs: {
      description: {
        component: 'Renders all visible blocks assigned to the **<%= options.region %>** region for the **<%= options.theme %>** theme.\n\n```jsx\n\n<DruxtBlockRegion name="<%= options.region %>" theme="<%= options.theme %>" />\n```'
      },
    },
  },
}

const Template = (args, { argTypes }) => {
  return {
    props: Object.keys(argTypes),
    template: '<DruxtBlockRegion v-bind="$props" v-on="$props" />',
  }
}

export const Default = Template.bind({})
Default.args = {
  name: '<%= options.region %>',
  theme: '<%= options.theme %>',
}
Default.storyName = 'DruxtBlockRegion'
Default.parameters = {
  docs: {
    source: {
      code: '<DruxtBlockRegion name="<%= options.region %>" theme="<%= options.theme %>" />'
    }
  }
}
