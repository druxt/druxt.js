<template>
  <div class="tag-list">
    <slot name="results" />
    <slot name="pager" />
  </div>
</template>

<script>
export default {}
</script>

<style scoped>
.tag-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
  font-size: 13px;
}
</style>
