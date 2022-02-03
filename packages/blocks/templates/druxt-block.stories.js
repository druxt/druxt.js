import DruxtBlock from 'druxt-blocks/dist/components/DruxtBlock.vue'

export default {
  title: 'Druxt/Blocks/DruxtBlock',
  component: DruxtBlock,
  argTypes: {
    id: {
      options: [<%= (options.blocks || []).map((o) => `'${o.attributes.drupal_internal__id}'`).join(', ') %>],
      control: {
        type: 'select'
      }
    },
    uuid: {
      options: [<%= (options.blocks || []).map((o) => `'${o.id}'`).join(', ') %>],
      control: {
        type: 'select'
      }
    }
  }
}

const Template = (args, { argTypes }) => ({
  components: { DruxtBlock },
  props: Object.keys(argTypes),
  template: `<DruxtBlock v-bind="$props" />`
})

export const Default = Template.bind({})
Default.storyName = 'DruxtBlock'
