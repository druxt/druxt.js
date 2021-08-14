<template>
  <v-card class="pa-2" outlined>
    <h2>{{ $attrs.entity.attributes.title }}</h2>
    <slot />
  </v-card>
</template>
