import DruxtBlock from 'druxt-blocks/dist/components/DruxtBlock.vue'

const code = '<DruxtBlock id="<%= options.block.attributes.drupal_internal__id %>" />'

export default {
  title: '<%= options.title %>',
  component: DruxtBlock,
  argTypes: {
    id: {
      control: false,
    },
    uuid: {
      control: false,
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'Renders the **<%= options.block.attributes.settings.label || options.block.attributes.drupal_internal__id %>** block.\n\n```jsx\n\n' + code + '\n```'
      },
    },
  },
}

const Template = (args, { argTypes }) => {
  return {
    props: Object.keys(argTypes),
    template: '<DruxtBlock v-bind="$props" v-on="$props" />',
  }
}

export const Default = Template.bind({})
Default.args = {
  id: '<%= options.block.attributes.drupal_internal__id %>',
  uuid: '<%= options.block.id %>',
}
Default.storyName = 'DruxtBlock'
Default.parameters = {
  docs: {
    source: { code }
  }
}
