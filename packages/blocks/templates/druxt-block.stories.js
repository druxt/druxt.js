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

// Default story.
export const Default = (args, { argTypes }) => ({
  components: { DruxtBlock },
  props: Object.keys(argTypes),
  template: `<DruxtBlock v-bind="$props" />`
})

let code

// Wrapper story.
code = `<template>
  <DruxtDebug :json="block" />
</template>

<script>
import { DruxtBlocksBlockMixin } from 'druxt-blocks'
export default {
  mixins: [DruxtBlocksBlockMixin]
}
</script>`
export const Wrapper = (args, { argTypes }) => ({
  components: { DruxtBlock },
  props: Object.keys(argTypes),
  template: `<DruxtBlock v-bind="$props" ref="module">
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
    storyDescription: 'The DruxtBlock component can be themed by using a Druxt Wrapper component.\n\nCreate an appropriately named component, using the relevant component option, with the following boilerplate:\n\n```jsx\n' + code + '\n```',
    source: { code }
  }
}

// Template injection story.
code = `<DruxtBlock id="">
  <template #default="{ block }">
    <!-- Do whatever you want here -->
    <DruxtDebug :json="block" open />
  </template>
</DruxtBlock>`
export const TemplateInjection = (args, { argTypes }) => ({
  components: { DruxtBlock },
  props: Object.keys(argTypes),
  template: code.replace('id=""', 'v-bind="$props"')
})
TemplateInjection.parameters = {
  docs: {
    storyDescription: 'The DruxtBlock component can be themed by injecting the default template into the compomnent.\n\n```jsx\n' + code + '\n```',
    source: { code }
  }
}

