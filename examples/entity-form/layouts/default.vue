<template>
  <v-app>
    <!--
      App bar at top of page
      components/default-layout/app-bar.vue
    -->
    <AppBar />

    <!--
      Nav drawer on left hand side
      components/default-layout/navigation-drawer.vue
    -->
    <NavigationDrawer />

    <v-main>
      <!-- This is where routing takes place and loads pages/index.vue -->
      <Nuxt />
    </v-main>
  </v-app>
</template>
