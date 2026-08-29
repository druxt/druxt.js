<template>
  <!--
    Rendered client-side only: the server has no way to know the OS
    preference. This uses a manual mounted-flag instead of Nuxt's built-in
    <client-only>, whose bundled implementation (vue-client-only, itself
    versioned "0.0.0-semantic-release") renders an empty comment node here
    under Vue 2.7 — its functional-component `slots()`/`parent` handling
    doesn't behave the same as it did pre-2.7, and Nuxt 2 has no newer
    build. Confirmed against a live preview: $colorMode/data-theme were
    both correct, but the toggle's own markup (real content and the
    invisible SSR placeholder alike) never appeared in the DOM at all.
  -->
  <div v-if="mounted" class="dropdown dropdown-end">
    <button type="button" tabindex="0" class="btn btn-ghost btn-square btn-sm" aria-label="Colour mode">
      <AppIconSun v-if="$colorMode.value === 'light'" class="w-5 h-5" />
      <AppIconMoon v-else class="w-5 h-5" />
    </button>

    <ul tabindex="0" class="dropdown-content menu mt-2 p-1 shadow-lg bg-base-100 border border-base-300 rounded-box w-40">
      <li v-for="option of options" :key="option.value">
        <button
          type="button"
          class="rounded-btn px-3 py-2 text-sm flex items-center gap-2"
          :class="$colorMode.preference === option.value ? 'bg-base-200 text-primary-focus font-medium' : ''"
          @click="$colorMode.preference = option.value"
        >
          <component :is="option.icon" class="w-4 h-4 opacity-60" />
          {{ option.label }}
        </button>
      </li>
    </ul>
  </div>

  <!-- Avoids a layout shift while the client hydrates. -->
  <span v-else class="btn btn-ghost btn-square btn-sm pointer-events-none opacity-0" />
</template>

<script>
export default {
  data: () => ({
    mounted: false,
    options: [
      { value: 'system', label: 'System', icon: 'app-icon-menu' },
      { value: 'light', label: 'Light', icon: 'app-icon-sun' },
      { value: 'dark', label: 'Dark', icon: 'app-icon-moon' },
    ],
  }),

  mounted() {
    this.mounted = true
  },
}
</script>
