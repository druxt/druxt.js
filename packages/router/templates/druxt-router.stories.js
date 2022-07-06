import DruxtRouter from 'druxt-router/dist/components/DruxtRouter.vue'

export default {
  title: 'Druxt/Router/DruxtRouter',
  component: DruxtRouter
}

// Default story.
export const Default = (args, { argTypes }) => ({
  components: { DruxtRouter },
  props: Object.keys(argTypes),
  template: `<DruxtRouter v-bind="$props" />`
})
Default.args = { path: '/' }

let code

// Wrapper story.
code = `<template>
  <DruxtDebug :json="route" />
</template>

<script>
import { DruxtRouterMixin } from 'druxt-router'
export default {
  mixins: [DruxtRouterMixin]
}
</script>`
export const Wrapper = (args, { argTypes }) => ({
  components: { DruxtRouter },
  props: Object.keys(argTypes),
  template: `<DruxtRouter v-bind="$props" ref="module">
  <template #default>
    Component options:
    <ul>
      <li v-for="option of $refs.module.getModuleComponents()" :key="option.name">{{ option.name }}</li>
    </ul>
  </template>
</DruxtRouter>`
})
Wrapper.parameters = {
  docs: {
    description: {
      story: 'The DruxtRouter component can be themed by using a Druxt Wrapper component.\n\nCreate an appropriately named component, using the relevant component option, with the following boilerplate:\n\n```jsx\n' + code + '\n```',
    },
    source: { code }
  }
}

// Template injection story.
code = `<DruxtRouter path="">
  <template #default="{ route }">
    <!-- Do whatever you want here -->
    <DruxtDebug :json="route" open />
  </template>
</DruxtRouter>`
export const TemplateInjection = (args, { argTypes }) => ({
  components: { DruxtRouter },
  props: Object.keys(argTypes),
  template: code.replace('path=""', 'v-bind="$props"')
})
TemplateInjection.parameters = {
  docs: {
    description: {
      story: 'The DruxtRouter component can be themed by injecting the default template into the compomnent.\n\n```jsx\n' + code + '\n```',
    },
    source: { code }
  }
}
