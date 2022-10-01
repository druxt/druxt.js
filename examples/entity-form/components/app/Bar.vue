<template>
  <v-app-bar
    app
    color="blue-grey darken-3"
    clipped-left
    height="56"
    dark
  >
    <v-toolbar-title>
      <h1 class="text-h6">
        {{ title }}
      </h1>
    </v-toolbar-title>
    <v-spacer />

    <v-spacer />

    <!--
      Dialog for maintaining servers
      components/default-layout/server-dialog.vue
    -->
    <!-- <ServerDialog /> -->

    <!--
      Dialog displaying about information
      components/default-layout/about-dialog.vue
    -->
    <AppAboutDialog />
  </v-app-bar>
</template>

<script>
export default {
  data: () => ({
    title: 'Druxt Content Editing Demo'
  })
}
</script>
