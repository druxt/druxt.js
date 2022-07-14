import DruxtView from 'druxt-views/dist/components/DruxtView.vue'
import DruxtModule from 'druxt/dist/components/DruxtModule.vue'

DruxtView.__docgenInfo.props = [
  ...DruxtModule.__docgenInfo.props,
  ...DruxtView.__docgenInfo.props,
].sort((a, b) => a.name < b.name ? -1 : 1).filter((o) => o.name !== 'v-model')

export default {
  title: 'Druxt/Views/DruxtView',
  component: DruxtView,
  argTypes: {
    uuid: {
      options: [<%= (Object.values(options.views) || []).map((o) => `'${o.uuid}'`).join(', ') %>],
      control: {
        type: 'select',
        labels: Object.fromEntries([<%= (Object.values(options.views) || []).map((o) => `['${o.uuid}', "${o.label} (${o.uuid})"]`).join(', ') %>])
      },
    },
    viewId: {
      options: [<%= (Object.keys(options.views) || []).map((s) => `'${s}'`).join(', ') %>],
      control: {
        type: 'select',
        labels: Object.fromEntries([<%= (Object.values(options.views) || []).map((o) => `['${o.viewId}', "${o.label} (${o.viewId})"]`).join(', ') %>])
      },
    }
  }
}

const Template = (args, { argTypes }) => ({
  components: { DruxtView },
  props: Object.keys(argTypes),
  template: `<DruxtView v-bind="$props" />`
})

export const Default = Template.bind({})
Default.storyName = 'DruxtView'

let code

// Wrapper story.
code = `<template>
  <DruxtDebug :json="results" />
</template>

<script>
import { DruxtViewsViewMixin } from 'druxt-views'
export default {
  mixins: [DruxtViewsViewMixin]
}
</script>`
export const Wrapper = (args, { argTypes }) => ({
  components: { DruxtView },
  props: Object.keys(argTypes),
  template: `<DruxtView v-bind="$props" ref="module">
  <template #default>
    Component options:
    <ul>
      <li v-for="option of $refs.module.getModuleComponents()" :key="option.name">{{ option.name }}</li>
    </ul>
  </template>
</DruxtView>`
})
Wrapper.parameters = {
  docs: {
    description: {
      story: 'The DruxtView component can be themed by using a Druxt Wrapper component.\n\nCreate an appropriately named component, using the relevant component option, with the following boilerplate:\n\n```jsx\n' + code + '\n```',
    },
    source: { code }
  }
}

// Template injection story.
code = `<DruxtView viewId="">
  <template #default="{ results }">
    <!-- Do whatever you want here -->
    <DruxtDebug :json="results" open />
  </template>
</DruxtView>`
export const TemplateInjection = (args, { argTypes }) => ({
  components: { DruxtView },
  props: Object.keys(argTypes),
  template: code.replace('viewId=""', 'v-bind="$props"')
})
TemplateInjection.parameters = {
  docs: {
    description: {
      story: 'The DruxtView component can be themed by injecting the default template into the compomnent.\n\n```jsx\n' + code + '\n```',
    },
    source: { code }
  }
}
