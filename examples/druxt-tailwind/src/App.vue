<template>
  <div class="min-h-screen flex flex-col">
    <header
      class="flex items-center px-6 lg:px-12 py-6 border-b border-gray-200"
    >
      <img
        src="/core/profiles/demo_umami/themes/umami/logo.svg"
        alt="Umami"
        class="h-7 w-auto"
      />
    </header>

    <!-- No site menu, no breadcrumb: this app is a single-purpose tool, not
         a Druxt "Site" (that's what examples/druxt-site demonstrates). The
         Meal Planner owns the full viewport width for its two-pane layout. -->
    <main class="flex-1 w-full px-6 lg:px-8 py-12">
      <router-view />
    </main>

    <footer
      class="px-6 lg:px-12 py-8 border-t border-gray-200 text-sm text-gray-500"
    >
      Meal Planner: a bespoke-modules + TailwindCSS reference example, without
      Nuxt.
    </footer>
  </div>
</template>
