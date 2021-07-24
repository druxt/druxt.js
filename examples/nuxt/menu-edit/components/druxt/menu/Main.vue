<template>
  <div>
    <b-card class="mb-3">
      <div class="position-absolute" style="right: 1rem">
        <component
          :is="'b-icon-' + (!edit ? 'lock' : 'unlock')"
          class="rounded-circle bg-secondary p-3 m-1 right"
          shift-h="-8"
          shift-v="8"
          variant="light"
          @click="edit = !edit"
        />
      </div>

      <component
        :is="component.is"
        v-bind="component.propsData"
        v-model="model"
      >
        <b-nav-item
          v-for="item of model"
          :key="item.entity.id"
          :class="{ edit }"
        >
          <b-icon-grip-vertical v-if="edit" scale="0.66" />
          {{ item.entity.attributes.title }}
        </b-nav-item>
      </component>
    </b-card>

    <b-card title="JSON:API">
      <vue-json-pretty :data="model" :deep="3" />
    </b-card>
  </div>
</template>

<script>
import { BIconGripVertical, BIconLock, BIconUnlock } from 'bootstrap-vue'
import { DruxtMenuMixin } from 'druxt-menu/dist/mixins/index.mjs'
import Draggable from 'vuedraggable'
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'

export default {
  components: {
    BIconGripVertical,
    BIconLock,
    BIconUnlock,
    Draggable,
    VueJsonPretty,
  },

  mixins: [DruxtMenuMixin],

  data: ({ items }) => ({
    edit: false,
    model: items,
  }),

  computed: {
    component: ({ edit }) =>
      edit
        ? {
            is: 'draggable',
            propsData: {
              tag: 'b-nav',
            },
          }
        : { is: 'b-nav' },
  },
}
</script>

<style scoped>
.bi-lock,
.bi-unlock {
  cursor: pointer;
}

.edit {
  border: 2px dashed lightgrey;
  margin-right: 0.1em;
}

.edit,
.edit > * {
  cursor: move;
}
</style>
