<script setup lang="ts">
defineOptions({ name: 'ConfigRenderPage' })
// A fetcher's part during a server render: settings for this request alone, merged over the stored ones.
if (import.meta.server) {
  setDrupalSettings('default', {
    public: { fromRender: 'public-from-render' },
    server: { renderServerOnly: 'server-only-from-render' },
  })
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
