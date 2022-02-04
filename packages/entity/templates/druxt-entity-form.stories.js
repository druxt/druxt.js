import DruxtEntityForm from 'druxt-entity/dist/components/DruxtEntityForm.vue'

export default {
  title: 'Druxt/Entity/DruxtEntityForm',
  component: DruxtEntityForm,
  argTypes: {
    type: {
      options: [<%= (options.entityTypes || []).map(({ entity, bundles }) => bundles.map((bundle) => `'${entity}--${bundle}'`)).join(', ') %>],
      control: {
        type: 'select'
      }
    },
    schemaType: {
      table: {
        disable: true
      }
    }
  }
}

export const Default = (args, { argTypes }) => ({
  components: { DruxtEntityForm },
  props: Object.keys(argTypes),
  template: `<DruxtEntityForm v-bind="$props" />`
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
  components: { DruxtEntityForm },
  props: Object.keys(argTypes),
  template: `<DruxtEntityForm v-bind="$props" ref="module">
  <template #default>
    Component options:
    <ul>
      <li v-for="option of $refs.module.getModuleComponents()" :key="option.name">{{ option.name }}</li>
    </ul>
  </template>
</DruxtEntityForm>`
})
Wrapper.parameters = {
  docs: {
    storyDescription: 'The DruxtEntityForm component can be themed by using a Druxt Wrapper component.\n\nCreate an appropriately named component, using the relevant component option, with the following boilerplate:\n\n```jsx\n' + code + '\n```',
    source: { code }
  }
}

// Template injection story.
code = `<DruxtEntityForm type="" uuid="">
  <template #default="{ entity }">
    <!-- Do whatever you want here -->
    <DruxtDebug :json="entity" open />
  </template>
</DruxtEntityForm>`
export const TemplateInjection = (args, { argTypes }) => ({
  components: { DruxtEntityForm },
  props: Object.keys(argTypes),
  template: code.replace('type="" uuid=""', 'v-bind="$props"')
})
TemplateInjection.parameters = {
  docs: {
    storyDescription: 'The DruxtEntityForm component can be themed by injecting the default template into the compomnent.\n\n```jsx\n' + code + '\n```',
    source: { code }
  }
}
