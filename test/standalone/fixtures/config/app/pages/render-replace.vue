<script setup lang="ts">
defineOptions({ name: 'ConfigRenderReplacePage' })
// As render.vue, with `replace: true`: the public tier replaces the stored one instead of merging over it.
if (import.meta.server) {
  setDrupalSettings('default', {
    public: { fromRender: 'public-from-render' },
    server: { renderServerOnly: 'server-only-from-render' },
  }, { replace: true })
}
const settings = useDruxtSettings()
</script>

<template>
  <dl>
    <dt>siteUrl</dt>
    <dd id="site-url">{{ settings.siteUrl }}</dd>
    <dt>fromDrupal</dt>
    <dd id="from-drupal">{{ settings.fromDrupal }}</dd>
    <dt>fromRender</dt>
    <dd id="from-render">{{ settings.fromRender }}</dd>
    <dt>serverOnly</dt>
    <dd id="server-only">{{ settings.serverOnly ?? 'absent' }}</dd>
  </dl>
</template>
