<script setup lang="ts">
defineOptions({ name: 'ConfigSettingsPage' })
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
    <dt>keys</dt>
    <dd id="keys">{{ Object.keys(settings).join(',') }}</dd>
  </dl>
</template>
