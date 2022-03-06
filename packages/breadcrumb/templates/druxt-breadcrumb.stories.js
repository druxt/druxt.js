import DruxtBreadcrumb from './DruxtBreadcrumb.vue'

export default {
  title: 'Druxt/Breadcrumb/DruxtBreadcrumb',
  component: DruxtBreadcrumb
}

const Template = (args, { argTypes }) => ({
  components: { DruxtBreadcrumb },
  props: Object.keys(argTypes),
  template: `<DruxtBreadcrumb v-bind="$props" />`
})

export const Default = Template.bind({})
Default.storyName = 'DruxtBreadcrumb'

let code

// Wrapper story.
code = `<template>
  <DruxtDebug :json="crumbs" />
</template>

<script>
import { DruxtBreadcrumbMixin } from 'druxt-breadcrumb'
export default {
  mixins: [DruxtBreadcrumbMixin]
}
</script>`
export const Wrapper = (args, { argTypes }) => ({
  components: { DruxtBreadcrumb },
  props: Object.keys(argTypes),
  template: `<DruxtBreadcrumb v-bind="$props" ref="module">
  <template #default>
    Component options:
    <ul>
      <li v-for="option of $refs.module.getModuleComponents()" :key="option.name">{{ option.name }}</li>
    </ul>
  </template>
</DruxtBreadcrumb>`
})
Wrapper.parameters = {
  docs: {
    storyDescription: 'The DruxtBreadcrumb component can be themed by using a Druxt Wrapper component.\n\nCreate an appropriately named component, using the relevant component option, with the following boilerplate:\n\n```jsx\n' + code + '\n```',
    source: { code }
  }
}

// Template injection story.
code = `<DruxtBreadcrumb>
  <template #default="{ crumbs }">
    <!-- Do whatever you want here -->
    <DruxtDebug :json="crumbs" open />
  </template>
</DruxtBreadcrumb>`
export const TemplateInjection = (args, { argTypes }) => ({
  components: { DruxtBreadcrumb },
  props: Object.keys(argTypes),
  template: code.replace('<DruxtBreadcrumb>', '<DruxtBreadcrumb v-bind="$props">')
})
TemplateInjection.parameters = {
  docs: {
    storyDescription: 'The DruxtBreadcrumb component can be themed by injecting the default template into the compomnent.\n\n```jsx\n' + code + '\n```',
    source: { code }
  }
}
