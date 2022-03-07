import DruxtEntity from 'druxt-entity/dist/components/DruxtEntity.vue'

export default {
  title: 'Druxt/Entity/DruxtEntity',
  component: DruxtEntity,
  argTypes: {
    type: {
      options: [<%= (options.entityTypes || []).map(({ entity, bundles }) => bundles.map((bundle) => `'${entity}--${bundle}'`)).join(', ') %>],
      control: {
        type: 'select'
      }
    },
    schemaType: {
      options: ['view', 'form'],
      control: {
        type: 'select'
      }
    }
  }
}

export const Default = (args, { argTypes }) => ({
  components: { DruxtEntity },
  props: Object.keys(argTypes),
  template: `<DruxtEntity v-bind="$props" />`
})

let code

// Wrapper story.
code = `<template>
  <DruxtDebug :json="entity" />
</template>

<script>
import { DruxtEntityMixin } from 'druxt-entity'
export default {
  mixins: [DruxtEntityMixin]
}
</script>`
export const Wrapper = (args, { argTypes }) => ({
  components: { DruxtEntity },
  props: Object.keys(argTypes),
  template: `<DruxtEntity v-bind="$props" ref="module">
  <template #default>
    Component options:
    <ul>
      <li v-for="option of $refs.module.getModuleComponents()" :key="option.name">{{ option.name }}</li>
    </ul>
  </template>
</DruxtEntity>`
})
Wrapper.parameters = {
  docs: {
    description: {
      story: 'The DruxtEntity component can be themed by using a Druxt Wrapper component.\n\nCreate an appropriately named component, using the relevant component option, with the following boilerplate:\n\n```jsx\n' + code + '\n```',
    },
    source: { code }
  }
}

// Template injection story.
code = `<DruxtEntity type="" uuid="">
  <template #default="{ entity }">
    <!-- Do whatever you want here -->
    <DruxtDebug :json="entity" open />
  </template>
</DruxtEntity>`
export const TemplateInjection = (args, { argTypes }) => ({
  components: { DruxtEntity },
  props: Object.keys(argTypes),
  template: code.replace('type="" uuid=""', 'v-bind="$props"')
})
TemplateInjection.parameters = {
  docs: {
    description: {
      story: 'The DruxtEntity component can be themed by injecting the default template into the compomnent.\n\n```jsx\n' + code + '\n```',
    },
    source: { code }
  }
}
