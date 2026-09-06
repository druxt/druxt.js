<template>
  <form action="/en/search/node" method="get">
    <input type="text" name="keys" placeholder="Search" aria-label="Search" />
    <button type="submit">Search</button>
  </form>
</template>

<script>
import { DruxtBlocksBlockMixin } from 'druxt-blocks'

export default {
  mixins: [DruxtBlocksBlockMixin],
}
</script>
