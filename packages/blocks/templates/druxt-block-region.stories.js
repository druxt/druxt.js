import DruxtBlockRegion from 'druxt-blocks/dist/components/DruxtBlockRegion.vue'

export default {
  title: 'Druxt/Blocks/DruxtBlockRegion',
  component: DruxtBlockRegion,
  argTypes: {
    name: {
      options: [<%= (options.regions || []).map((s) => `'${s}'`).join(', ') %>],
      control: {
        type: 'select'
      }
    },
    theme: {
      options: [<%= (options.themes || []).map((s) => `'${s}'`).join(', ') %>],
      control: {
        type: 'select'
      }
    },
  }
}

const Template = (args, { argTypes }) => ({
  components: { DruxtBlockRegion },
  props: Object.keys(argTypes),
  template: `<DruxtBlockRegion v-bind="$props" />`
})

export const Default = Template.bind({})
Default.storyName = 'DruxtBlockRegion'
