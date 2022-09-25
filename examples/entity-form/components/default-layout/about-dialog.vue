<template>
  <v-dialog
    v-model="dialog"
    max-width="400px"
  >
    <template #activator="{ on, attrs }">
      <ToolbarBtn
        v-on="on"
        v-bind="attrs"
        icon="mdi-information-outline"
        tooltip="About"
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
  name: 'AboutDialog',

  setup (props, context) {
    const dialog = false
    const aboutText = `
      This app provide an example of a Druxt Vuetify site that can view
       and edit Drupal content (nodes).
      Built using Vue.js, Vuetify and Druxt.`
    const tmText = `Drupal is a registered trademark of Dries Buytaert.`

    return {
      dialog,
      aboutText,
      tmText,
    }
  },

}
</script>
