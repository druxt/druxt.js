import DruxtSite from 'druxt-site/dist/components/DruxtSite.vue'

export default {
  title: 'Druxt/Site/DruxtSite',
  component: DruxtSite,
  argTypes: {
    theme: {
      options: [<%= (options.themes || []).map((s) => `'${s}'`).join(', ') %>],
      control: {
        type: 'select'
      }
    }
  }
}

// Default story.
export const Default = (args, { argTypes }) => ({
  components: { DruxtSite },
  props: Object.keys(argTypes),
  template: `<DruxtSite v-bind="$props" />`
})

let code

// Wrapper story.
code = `<template>
  <div>
    <slot name="header" />
    <slot name="content" />
    <slot name="footer" />
  </div>
</template>

<script>
import { DruxtSiteMixin } from 'druxt-site'
export default {
  mixins: [DruxtSiteMixin]
}`
export const Wrapper = (args, { argTypes }) => ({
  components: { DruxtSite },
  props: Object.keys(argTypes),
  template: `<DruxtSite v-bind="$props" ref="module">
  <template #default>
    Component options:
    <ul>
      <li v-for="option of $refs.module.getModuleComponents()" :key="option.name">{{ option.name }}</li>
    </ul>
  </template>
</DruxtSite>`
})
Wrapper.parameters = {
  docs: {
    description: {
      story: 'The DruxtSite component can be themed by using a Druxt Wrapper component.\n\nCreate an appropriately named component, using the relevant component option, with the following boilerplate:\n\n```jsx\n' + code + '\n```',
    },
    source: { code }
  }
}

// Template injection story.
code = `<DruxtSite theme="">
  <template #default="{ regions }">
    <!-- Do whatever you want here -->
    <DruxtDebug :json="{ regions }" />
  </template>
</DruxtSite>`
export const TemplateInjection = (args, { argTypes }) => ({
  components: { DruxtSite },
  props: Object.keys(argTypes),
  template: code.replace('theme=""', 'v-bind="$props"')
})
TemplateInjection.parameters = {
  docs: {
    description: {
      story: 'The DruxtSite component can be themed by injecting the default template into the compomnent.\n\n```jsx\n' + code + '\n```',
    },
    source: { code }
  }
}
