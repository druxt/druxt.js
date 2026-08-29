<template>
  <div>
    <!-- Hero -->
    <section class="border-b border-base-300 bg-base-200">
      <div class="max-w-5xl mx-auto px-6 py-24 sm:py-28 text-center flex flex-col items-center">
        <AppLogo class="w-20 mb-7" title="DruxtJS" />
        <h1 class="text-4xl sm:text-5xl font-bold tracking-tight" v-text="slogan" />
        <p class="mt-4 text-lg text-base-content/70 max-w-xl">
          Druxt is a framework for building fully decoupled Drupal and Nuxt.js applications and sites.
        </p>
        <div class="mt-9 flex flex-wrap items-center justify-center gap-3">
          <NuxtLink class="btn btn-primary gap-2" to="/guide/getting-started">
            <AppIconGuide class="w-5 h-5" /> Get started
          </NuxtLink>
          <NuxtLink class="btn btn-ghost gap-2" to="/modules">
            <AppIconModules class="w-5 h-5" /> Browse modules
          </NuxtLink>
        </div>
        <!--
          Quickstart command. The advanced panel (collapsed by default) swaps
          between the four quickstart repositories and between giget and the
          DevPod CLI, rewriting this one command in place.
        -->
        <div class="mt-8 w-full max-w-2xl">
          <div class="flex items-center gap-2 rounded-btn bg-base-100 border border-base-300 px-4 py-2 text-left">
            <code class="flex-1 min-w-0 overflow-x-auto text-sm font-mono whitespace-nowrap">{{ command }}</code>
            <button
              type="button"
              class="btn btn-xs btn-ghost flex-shrink-0"
              :aria-label="'Copy ' + command"
              @click="copy"
            >{{ copied ? 'Copied' : 'Copy' }}</button>
          </div>

          <button
            type="button"
            class="mt-2 inline-flex items-center gap-1.5 text-sm text-base-content/70 hover:text-base-content"
            :aria-expanded="advanced ? 'true' : 'false'"
            aria-controls="quickstart-advanced"
            @click="advanced = !advanced"
          >
            <span aria-hidden="true" class="inline-block w-3 text-center">{{ advanced ? '−' : '+' }}</span>
            Advanced
          </button>

          <div
            v-show="advanced"
            id="quickstart-advanced"
            class="mt-3 rounded-box border border-base-300 bg-base-100 p-4 text-left flex flex-col gap-4"
          >
            <!-- Hidden while only one starter kit is enabled: a radio group
                 with a single option is noise, not a choice. -->
            <fieldset v-if="starterKits.length > 1">
              <legend class="text-xs font-semibold uppercase tracking-wider text-base-content/70 mb-2">Starter kit</legend>
              <div class="grid gap-2 sm:grid-cols-2">
                <label
                  v-for="option of starterKits"
                  :key="option.repo"
                  class="flex gap-3 items-start rounded-btn border p-3 cursor-pointer transition-colors"
                  :class="repo === option.repo ? 'border-primary bg-base-200' : 'border-base-300 hover:border-primary'"
                >
                  <!--
                    flex-shrink-0, not the v3 spelling `shrink-0`: this is
                    Tailwind 2, where `shrink-0` generates nothing at all.
                    Without it a long enough sibling label (Commerce's is the
                    longest) squeezes the radio below 20px wide and it renders
                    as an oval.
                  -->
                  <input
                    v-model="repo"
                    type="radio"
                    name="quickstart"
                    class="radio radio-sm radio-primary mt-0.5 flex-shrink-0"
                    :value="option.repo"
                  >
                  <span class="min-w-0">
                    <span class="block text-sm font-medium">{{ option.title }}</span>
                    <span class="block text-xs text-base-content/70">{{ option.description }}</span>
                  </span>
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend class="text-xs font-semibold uppercase tracking-wider text-base-content/70 mb-2">Run with</legend>
              <div class="flex flex-wrap gap-2">
                <label
                  v-for="option of runners"
                  :key="option.value"
                  class="flex items-center gap-2 rounded-btn border px-3 py-2 cursor-pointer text-sm transition-colors"
                  :class="runner === option.value ? 'border-primary bg-base-200 font-medium' : 'border-base-300 hover:border-primary'"
                >
                  <input v-model="runner" type="radio" name="runner" class="radio radio-sm radio-primary flex-shrink-0" :value="option.value">
                  {{ option.label }}
                </label>
              </div>
            </fieldset>

            <p class="text-xs text-base-content/70">
              Every quickstart is a template repository with Drupal and Nuxt in one tree.
              <a :href="'https://github.com/druxt/' + repo" target="_blank" rel="noopener">View {{ repo }} on GitHub</a>.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="max-w-5xl mx-auto px-6 py-20 grid gap-10 sm:grid-cols-3">
      <div v-for="feature of features" :key="feature.title">
        <component :is="feature.icon" class="w-6 h-6 mb-3 text-primary-focus" />
        <h2 class="text-lg font-semibold" v-text="feature.title" />
        <p class="mt-2 text-sm text-base-content/70" v-text="feature.description" />
      </div>
    </section>

    <!-- Modules -->
    <section v-if="modules.length" class="border-t border-base-300 bg-base-200">
      <div class="max-w-5xl mx-auto px-6 py-20">
        <div class="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 class="text-2xl font-semibold">Modules</h2>
            <p class="mt-1 text-base-content/70">Adopt the whole framework, or only the parts you need.</p>
          </div>
          <NuxtLink class="btn btn-sm btn-ghost" to="/modules">All modules</NuxtLink>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AppModuleCard v-for="module of modules" :key="module.title" :module="module" />
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  head: {
    titleTemplate: 'DruxtJS',
  },

  data: () => ({
    slogan: 'The Fully Decoupled Drupal Framework',
    advanced: false,
    copied: false,
    repo: 'quickstart',
    runner: 'giget',
    runners: [
      { value: 'giget', label: 'giget' },
      { value: 'devpod', label: 'DevPod' },
    ],
    // Only the entries marked `enabled` are offered. The rest stay listed
    // here, rather than being deleted, because they are expected back once
    // they are working again — flipping the flag is the whole change. The
    // picker hides itself while only one is enabled (see `starterKits`),
    // so a single-option radio group is never rendered.
    quickstarts: [
      { repo: 'quickstart', title: 'Druxt Quickstart', description: 'Drupal 11, Nuxt 2 and Druxt in one repository.', enabled: true },
      { repo: 'quickstart-druxt-site-tome', title: 'Tome', description: 'Databaseless: static Drupal via Tome.', enabled: false },
      { repo: 'quickstart-druxt-serverless', title: 'Serverless', description: 'Serverless Druxt starter kit.', enabled: false },
      { repo: 'quickstart-druxt-commerce', title: 'Commerce', description: 'Druxt against Commerce Kickstart, for decoupled commerce.', enabled: false },
    ],
    features: [
      {
        icon: 'app-icon-api',
        title: 'JSON:API client and store',
        description: 'A JSON:API client and Vuex store modules keep Drupal entities, resources and relationships in sync on the frontend.',
      },
      {
        icon: 'app-icon-modules',
        title: 'Themeable Vue components',
        description: 'The DruxtWrapper pattern lets you override any component, down to a single field, without forking the library.',
      },
      {
        icon: 'app-icon-guide',
        title: 'Multilingual and proxy support',
        description: 'Language negotiation and a request proxy work out of the box for multilingual Drupal sites.',
      },
    ],
  }),

  computed: {
    modules: ({ $store }) => $store.state.modules,

    /** The starter kits currently offered. */
    starterKits: ({ quickstarts }) => quickstarts.filter((o) => o.enabled),

    /**
     * One command block, rewritten by the repo and runner pickers.
     *
     * `--install` matches what the quickstart's own README prescribes:
     * without it giget only downloads the tree, leaving the reader with no
     * dependencies, no provisioned Drupal, and nothing to run.
     */
    command() {
      return this.runner === 'devpod'
        ? 'devpod up github.com/druxt/' + this.repo
        : 'npx giget@latest gh:druxt/' + this.repo + '#develop my-druxt-site --install'
    },
  },

  watch: {
    command() {
      this.copied = false
    },
  },

  methods: {
    async copy() {
      try {
        await navigator.clipboard.writeText(this.command)
        this.copied = true
        // gtag(), not a raw dataLayer.push of an array: gtag.js reads the
        // Arguments object gtag() pushes, whereas a literal array is the GTM
        // convention and is not processed as a GA4 event. window.gtag is a
        // global (top-level function declaration in the classic inline
        // snippet), and optional-chaining keeps this a silent no-op wherever
        // the production-gated snippet isn't present — dev, preview, SSR.
        window.gtag?.('event', 'copy_quickstart_command', { repo: this.repo, runner: this.runner })
      } catch (e) {
        this.copied = false
      }
    },
  },
}
</script>
