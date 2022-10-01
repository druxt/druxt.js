<template>
  <v-dialog
    v-model="dialog"
    max-width="400px"
  >
    <template #activator="{ on, attrs }">
      <ToolbarBtn
        icon="mdi-information-outline"
        tooltip="About"
        v-bind="attrs"
        v-on="on"
      />
    </template>
    <v-card height="300px">
      <div class="d-flex flex-column justify-space-between fill-height pa-4">
        <div>{{ aboutText }}</div>
        <div>{{ tmText }}</div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  data: () => ({
    dialog: false,
    aboutText: `
      This app provide an example of a Druxt Vuetify site that can view
       and edit Drupal content (nodes).
      Built using Vue.js, Vuetify and Druxt.`,
    tmText: 'Drupal is a registered trademark of Dries Buytaert.'
  }),
}
</script>
