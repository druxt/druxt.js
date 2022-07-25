<template>
  <div>
    <slot />
  </div>
</template>

<script>
export default {
  druxt: {
    query: {
      // Include related resources.
      include: ['field_media_image', 'field_media_image.field_media_image'],
      fields: [
        ['title'], // Filter the Entity resource.
        ['media--image', []], // Filter the Media resource.
        ['file--file', ['uri']], // Filter the File resource.
      ]
    }
  }
}
</script>
