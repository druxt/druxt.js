<template>
  <div>
    <h1>Custom component using DruxtSchemaMixin</h1>
    <p>This demonstrates the ability to use Drupal Display settings, field placement and configuration, with non-Drupal data.</p>
    <hr />
    <SchemaComponent
      type="node--page"
      :data="{
        body: 'This body text comes from a plain JavaScript object, not a Drupal entity - DruxtSchemaMixin only needs display-mode configuration and a data source, not JSON:API.',
        links: ['https://druxtjs.org']
      }"
    />
  </div>
</template>
