<template>
  <transition name="rdp-fade">
    <div
      v-if="id"
      class="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      @click.self="$emit('close')"
    >
      <div
        data-testid="rdp-panel"
        class="bg-base-100 w-full sm:max-w-2xl lg:max-w-3xl sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto relative"
      >
        <button
          type="button"
          data-testid="rdp-close"
          aria-label="Close"
          class="btn btn-sm btn-circle absolute top-3 right-3 z-10"
          @click="$emit('close')"
        >
          &times;
        </button>
        <!-- Resolves to DruxtEntityNodeRecipeFull via the standard
             wrapper-resolution convention - same component the whole suite
             already uses, just invoked in-page instead of via a route. -->
        <DruxtEntity type="node--recipe" :uuid="id" mode="full" />
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  props: {
    id: {
      type: String,
      default: null,
    },
  },
}
</script>

<style scoped>
.rdp-fade-enter-active,
.rdp-fade-leave-active {
  transition: opacity 0.18s ease-out;
}

.rdp-fade-enter,
.rdp-fade-leave-to {
  opacity: 0;
}
</style>
