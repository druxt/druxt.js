import DruxtMenu from 'druxt-menu/dist/components/DruxtMenu.vue'

export default {
  title: 'Druxt/Menu/DruxtMenu',
  component: DruxtMenu,
  argTypes: {
    name: {
      options: [<%= (options.menus || []).map((menu) => `'${menu.attributes.drupal_internal__id}'`).join(', ') %>],
      control: {
        type: 'select',
        labels: Object.fromEntries([<%= (options.menus || []).map((o) => `['${o.attributes.drupal_internal__id}', "${o.attributes.label}"]`).join(', ') %>])
      }
    },
  }
}

export const Default = (args, { argTypes }) => ({
  components: { DruxtMenu },
  props: Object.keys(argTypes),
  template: `<DruxtMenu v-bind="$props" />`
})

let code

// Wrapper story.
code = `<template>
  <DruxtDebug :json="items" />
</template>

<script>
import { DruxtMenuMixin } from 'druxt-menu'
export default {
  mixins: [DruxtMenuMixin]
}
</script>`
export const Wrapper = (args, { argTypes }) => ({
  components: { DruxtMenu },
  props: Object.keys(argTypes),
  template: `<DruxtMenu v-bind="$props" ref="module">
  <template #default>
    Component options:
    <ul>
      <li v-for="option of $refs.module.getModuleComponents()" :key="option.name">{{ option.name }}</li>
    </ul>
  </template>
</DruxtMenu>`
})
Wrapper.parameters = {
  docs: {
    description: {
      story: 'The DruxtMenu component can be themed by using a Druxt Wrapper component.\n\nCreate an appropriately named component, using the relevant component option, with the following boilerplate:\n\n```jsx\n' + code + '\n```',
    },
    source: { code }
  }
}

// Template injection story.
code = `<DruxtMenu name="">
  <template #default="{ items }">
    <!-- Do whatever you want here -->
    <DruxtDebug :json="items" open />
  </template>
</DruxtMenu>`
export const TemplateInjection = (args, { argTypes }) => ({
  components: { DruxtMenu },
  props: Object.keys(argTypes),
  template: code.replace('name=""', 'v-bind="$props"')
})
TemplateInjection.parameters = {
  docs: {
    description: {
      story: 'The DruxtMenu component can be themed by injecting the default template into the compomnent.\n\n```jsx\n' + code + '\n```',
    },
    source: { code }
  }
}
