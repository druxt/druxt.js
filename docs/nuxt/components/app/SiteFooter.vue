<template>
  <!--
    Site-wide footer. Named SiteFooter rather than Footer because AppDocFooter
    already exists and is a different thing: that one is per-document
    (edit-on-GitHub, prev/next), this one is the site's own.

    Colours come from theme tokens only - base-200 ground, base-300 top
    border, primary links - so a palette change carries through here without
    touching this file.
  -->
  <footer class="border-t border-base-300 bg-base-200 text-base-content">
    <div class="max-w-[110rem] mx-auto px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <NuxtLink to="/" class="flex items-center gap-2 w-max rounded-btn hover:opacity-80">
          <AppLogo class="w-6" title="DruxtJS" />
          <span class="text-base font-semibold tracking-tight">DruxtJS</span>
        </NuxtLink>
        <p class="mt-3 text-sm text-base-content/70 max-w-xs">
          The fully decoupled Drupal framework, for Nuxt.
        </p>
        <p v-if="version" class="mt-3">
          <NuxtLink
            class="badge badge-sm badge-outline hover:border-primary hover:text-primary-focus"
            to="/api/packages/druxt/CHANGELOG"
            :title="'Druxt ' + version + ' release notes'"
          >{{ version }}</NuxtLink>
        </p>
      </div>

      <nav aria-labelledby="footer-docs">
        <h2 id="footer-docs" class="text-xs font-semibold uppercase tracking-wider text-base-content/70">
          Documentation
        </h2>
        <ul class="mt-3 space-y-2 text-sm">
          <li v-for="link of docs" :key="link.to">
            <NuxtLink class="text-primary-focus hover:underline" :to="link.to">{{ link.text }}</NuxtLink>
          </li>
        </ul>
      </nav>

      <nav aria-labelledby="footer-community">
        <h2 id="footer-community" class="text-xs font-semibold uppercase tracking-wider text-base-content/70">
          Community
        </h2>
        <ul class="mt-3 space-y-2 text-sm">
          <li v-for="link of community" :key="link.href">
            <a
              class="text-primary-focus hover:underline"
              :href="link.href"
              target="_blank"
              rel="noopener"
            >{{ link.text }}</a>
          </li>
        </ul>
      </nav>
    </div>

    <div class="border-t border-base-300">
      <div class="max-w-[110rem] mx-auto px-4 sm:px-6 py-4 text-xs text-base-content/70">
        Released under the MIT licence.
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  props: {
    /** e.g. "v0.24.0"; the badge is hidden when the version is unavailable. */
    version: { type: String, default: null },
  },

  data: () => ({
    docs: [
      { text: 'Tutorials', to: '/tutorials' },
      { text: 'How-to guides', to: '/how-to' },
      { text: 'Modules', to: '/modules' },
      { text: 'API reference', to: '/api' },
    ],
    community: [
      { text: 'GitHub', href: 'https://github.com/druxt/druxt.js' },
      // The invite directly, not discord.druxtjs.org - that vanity host's
      // certificate only covers *.github.io and trips a TLS interstitial.
      { text: 'Discord', href: 'https://discord.gg/QnZD46c' },
      { text: 'Druxt on Drupal.org', href: 'https://www.drupal.org/project/druxt' },
    ],
  }),
}
</script>
