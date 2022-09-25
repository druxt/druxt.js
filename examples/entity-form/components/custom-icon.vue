<template>
  <v-img :src="require(`@/assets/icons/${icon}.png`)" />
</template>

<script>
export default {
  name: 'CustomIcon',

  props: {
    icon: {
      type: String,
      required: true,
    },
  },
}
</script>
