<template>
  <div>
    <h1>Custom component using DruxtSchemaMixin</h1>
    <p>This demonstrates the ability to use Drupal Display settings, field placement and configuration, with non-Drupal data.</p>
    <hr />
    <SchemaComponent
      type="node--page"
      :data="{
        body: 'Praesent sapien massa, convallis a pellentesque nec, egestas non nisi. Donec sollicitudin molestie malesuada. Mauris blandit aliquet elit, eget tincidunt nibh pulvinar a. Nulla quis lorem ut libero malesuada feugiat.',
        links: ['https://druxtjs.org']
      }"
    />
  </div>
</template>
