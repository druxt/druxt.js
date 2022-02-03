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

let code

// Wrapper story.
code = `<template>
  <DruxtDebug :json="blocks" />
</template>

<script>
import { DruxtBlocksRegionMixin } from 'druxt-blocks'
export default {
  mixins: [DruxtBlocksRegionMixin]
}
</script>`
export const Wrapper = (args, { argTypes }) => ({
  components: { DruxtBlockRegion },
  props: Object.keys(argTypes),
  template: `<DruxtBlockRegion v-bind="$props" ref="module">
  <template #default>
    Component options:
    <ul>
      <li v-for="option of $refs.module.getModuleComponents()" :key="option.name">{{ option.name }}</li>
    </ul>
  </template>
</DruxtBlock>`
})
Wrapper.parameters = {
  docs: {
    storyDescription: 'The DruxtBlockRegion component can be themed by using a Druxt Wrapper component.\n\nCreate an appropriately named component, using the relevant component option, with the following boilerplate:\n\n```jsx\n' + code + '\n```',
    source: { code }
  }
}

// Template injection story.
code = `<DruxtBlockRegion theme="">
  <template #default="{ blocks }">
    <!-- Do whatever you want here -->
    <DruxtDebug :json="blocks" open />
  </template>
</DruxtBlockRegion>`
export const TemplateInjection = (args, { argTypes }) => ({
  components: { DruxtBlockRegion },
  props: Object.keys(argTypes),
  template: code.replace('theme=""', 'v-bind="$props"')
})
TemplateInjection.parameters = {
  docs: {
    storyDescription: 'The DruxtBlockRegion component can be themed by injecting the default template into the compomnent.\n\n```jsx\n' + code + '\n```',
    source: { code }
  }
}
