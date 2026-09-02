<template>
  <div>
    <h1>DruxtMenu - Frontend editing</h1>
    <blockquote>
      This example shows a Drupal menu rendered by DruxtMenu with frontend
      editing via drag-and-drop reordering. The edit toggle switches between
      view mode and edit mode. In edit mode, items can be reordered and the
      resulting JSON:API payload is shown.
    </blockquote>

    <hr />

    <button
      style="margin-bottom: 1rem; padding: 0.5rem 1rem; cursor: pointer;"
      @click="edit = !edit"
    >
      {{ edit ? '🔒 Lock editing' : '🔓 Enable editing' }}
    </button>

    <DruxtMenu ref="menu" :name="menu">
      <template #default="{ component, propsData }">
        <component :is="component" v-bind="propsData">
          <li
            v-for="(item, index) in model"
            :key="item.entity.id"
            :class="{ edit }"
            style="list-style: none; padding: 0.5rem; margin: 0.25rem 0; border: 1px solid #ddd; display: flex; align-items: center; gap: 0.5rem;"
          >
            <span v-if="edit" style="display: flex; gap: 0.25rem;">
              <button @click="moveUp(index)" :disabled="index === 0" style="cursor: pointer;">↑</button>
              <button @click="moveDown(index)" :disabled="index === model.length - 1" style="cursor: pointer;">↓</button>
            </span>
            <NuxtLink :to="item.entity.attributes.url || '#'">
              {{ item.entity.attributes.title }}
            </NuxtLink>
          </li>
        </component>
      </template>
    </DruxtMenu>

    <div v-if="edit && model.length" style="margin-top: 2rem;">
      <h2>JSON:API payload preview</h2>
      <p>After reordering, this is the payload that would be sent to update the menu via JSON:API:</p>
      <pre><code>{{ JSON.stringify(model.map((item, index) => ({
        id: item.entity.id,
        type: item.entity.type,
        attributes: {
          title: item.entity.attributes.title,
          weight: index,
          parent: item.entity.attributes.parent || null,
        }
      })), null, '  ') }}</code></pre>
    </div>
  </div>
</template>

<script>
export default {
  data: () => ({
    edit: false,
    menu: 'main',
    model: [],
  }),

  watch: {
    '$refs.menu.items'(items) {
      if (items) this.model = [...items]
    },
  },

  mounted() {
    this.$watch(
      () => this.$refs.menu?.items,
      (items) => { if (items) this.model = [...items] },
      { immediate: true }
    )
  },

  methods: {
    moveUp(index) {
      if (index === 0) return
      const item = this.model.splice(index, 1)[0]
      this.model.splice(index - 1, 0, item)
    },
    moveDown(index) {
      if (index === this.model.length - 1) return
      const item = this.model.splice(index, 1)[0]
      this.model.splice(index + 1, 0, item)
    },
  },
}
</script>

<style scoped>
.edit {
  background: #f0f0f0;
  border: 2px dashed #999 !important;
}
</style>
