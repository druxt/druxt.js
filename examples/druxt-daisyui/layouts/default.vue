<template>
  <div class="min-h-screen flex flex-col" :data-theme="theme">
    <header class="navbar bg-base-100 shadow-sm px-4 lg:px-8">
      <div class="flex-1">
        <NuxtLink to="/" class="flex items-center">
          <img
            src="/core/profiles/demo_umami/themes/umami/logo.svg"
            alt="Umami"
            class="h-8 w-auto"
          />
        </NuxtLink>
      </div>

      <button
        class="btn btn-ghost btn-circle ml-2"
        :aria-label="
          theme === 'umami-dark'
            ? 'Switch to light theme'
            : 'Switch to dark theme'
        "
        @click="toggleTheme"
      >
        {{ theme === 'umami-dark' ? '☀️' : '🌙' }}
      </button>
    </header>

    <main class="flex-1 px-4 lg:px-8 py-4 md:py-8 max-w-5xl w-full mx-auto">
      <Nuxt />
    </main>

    <footer class="footer footer-center bg-neutral text-neutral-content p-3 md:p-6">
      <p>Recipe Box: a Druxt + DaisyUI reference example.</p>
    </footer>
  </div>
</template>

<script>
const STORAGE_KEY = 'druxt-daisyui-theme';

export default {
  data: () => ({
    theme: 'umami',
  }),

  mounted() {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) this.theme = stored;
  },

  methods: {
    toggleTheme() {
      this.theme = this.theme === 'umami-dark' ? 'umami' : 'umami-dark';
      window.localStorage.setItem(STORAGE_KEY, this.theme);
    },
  },
};
</script>
