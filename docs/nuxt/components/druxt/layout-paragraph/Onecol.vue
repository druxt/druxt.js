<template>
  <div class="pt-2 pb-8">
    <h2
      v-if="entity.attributes.field_title"
      class="text-xl mb-4"
      v-text="entity.attributes.field_title"
    />
    <slot />
  </div>
</template>

<script>
export default {
  props: {
    children: {
      type: Array,
      required: true,
    },
    entity: {
      type: Object,
      required: true,
    },
    langcode: {
      type: String,
      default: undefined,
    }
  }
}
</script>
