import DruxtBlock from 'druxt-blocks/dist/components/DruxtBlock.vue'

export default {
  title: '<%= options.title %>',
  component: DruxtBlock,
  parameters: {
    docs: {
      description: {
        component: ' '
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
    source: {
      code: '<DruxtBlock id="<%= options.block.attributes.drupal_internal__id %>" />'
    }
  }
}
