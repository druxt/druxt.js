<template>
  <div>
    <AppHeader class="absolute z-100" title="DruxtJS" />

    <div class="shadow bg-base-200 drawer h-screen pt-15">
      <input id="sidebar" type="checkbox" class="drawer-toggle" />

      <div class="flex flex-col drawer-content">
        <Nuxt />
      </div>
      <div class="drawer-side">
        <label for="sidebar" class="drawer-overlay"></label>
        <AppSidebar />
      </div>
    </div>
  </div>
</template>
