<template>
  <div class="group rounded-box border border-base-300 bg-base-100 p-5 flex flex-col gap-3 hover:border-primary hover:shadow-lg transition-all">
    <div class="flex items-center gap-3">
      <span class="w-9 h-9 rounded-btn bg-base-200 text-primary-focus grid place-items-center">
        <component :is="icon" class="w-5 h-5" />
      </span>
      <h3 class="text-lg font-semibold" v-text="module.title" />
    </div>

    <p class="text-sm text-base-content/70 flex-1" v-text="module.description" />

    <div class="flex flex-wrap gap-2 pt-1">
      <NuxtLink class="btn btn-sm btn-secondary" :to="module.dir">Get started</NuxtLink>
      <NuxtLink class="btn btn-sm btn-ghost" :to="'/api/packages/' + pkg">API</NuxtLink>
      <NuxtLink class="btn btn-sm btn-ghost" :to="'/api/packages/' + pkg + '/CHANGELOG'">Changelog</NuxtLink>
    </div>
  </div>
</template>

<script>
// Imported statically: the pick is dynamic by data, which auto-import
// template scanning cannot see.
import { moduleIcon } from './icon/module'

export default {
  props: {
    /** A store.state.modules entry: { title, description, dir } */
    module: { type: Object, required: true },
  },

  computed: {
    pkg: ({ module }) => module.dir.split('/')[2],

    /**
     * The module's icon component; the core mark covers unknown packages.
     *
     * @param {object} vm - The component ViewModel.
     * @param {string} vm.pkg - The package directory name.
     * @returns {object} The icon component.
     */
    icon: ({ pkg }) => moduleIcon(pkg),
  },
}
</script>
