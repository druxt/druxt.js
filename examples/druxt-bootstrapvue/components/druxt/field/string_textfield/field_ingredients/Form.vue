<template>
  <label class="coc-ingredients">
    <strong>{{ $parent.label.text }}:</strong>
    <br />
    <div>
      <Draggable
        :value="model"
        handle=".coc-ingredient__grip"
        ghost-class="coc-ingredient--ghost"
        tag="ul"
        class="coc-ingredients__list"
        @input="reorder"
      >
        <li v-for="(item, delta) in model" :key="delta" class="coc-ingredient">
          <span class="coc-ingredient__grip" title="Drag to reorder">⠿</span>
          <input
            :value="item"
            type="text"
            @input="update(delta, $event.target.value)"
          />
          <button
            type="button"
            class="coc-ingredient__remove"
            title="Remove"
            @click="remove(delta)"
          >
            &times;
          </button>
        </li>
      </Draggable>
      <button type="button" class="coc-ingredients__add" @click="add">
        + Add ingredient
      </button>
    </div>
  </label>
</template>

<script>
import Draggable from 'vuedraggable'
import { DruxtFieldMixin } from 'druxt-entity'

// Ingredient order is editorial, not alphabetical, so the recipe form needs
// to reorder as well as edit. DruxtField renders a multi-value field as a
// flat run of inputs with no way to move one.
//
// Every method assigns a new array rather than mutating in place: the mixin
// watches `model` by identity, so an in-place splice would never reach the
// entity.
export default {
  components: { Draggable },

  mixins: [DruxtFieldMixin],

  methods: {
    add() {
      this.model = [...(this.model || []), '']
    },

    remove(delta) {
      this.model = this.model.filter((_, i) => i !== delta)
    },

    reorder(value) {
      this.model = [...value]
    },

    update(delta, value) {
      this.model = this.model.map((item, i) => (i === delta ? value : item))
    },
  },
}
</script>

<style scoped>
.coc-ingredients__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.coc-ingredient {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.coc-ingredient__grip {
  flex: none;
  cursor: grab;
  color: #adb5bd;
  font-size: 15px;
  line-height: 1;
  user-select: none;
}

.coc-ingredient__grip:active {
  cursor: grabbing;
}

.coc-ingredient--ghost {
  opacity: 0.4;
}

.coc-ingredient__remove {
  flex: none;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  background: #fff;
  color: #6c757d;
  width: 30px;
  height: 30px;
  font-size: 17px;
  line-height: 1;
  cursor: pointer;
}

.coc-ingredient__remove:hover {
  border-color: #dc3545;
  color: #dc3545;
}

.coc-ingredients__add {
  border: 1px dashed #ced4da;
  border-radius: 0.25rem;
  background: #fff;
  color: #495057;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
}

.coc-ingredients__add:hover {
  border-color: #007bff;
  color: #007bff;
}
</style>
