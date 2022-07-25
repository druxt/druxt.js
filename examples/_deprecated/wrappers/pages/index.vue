<template>
  <div v-if="!$fetchState.pending">
    <h1>DruxtWrapper examples</h1>
    <blockquote>
      The DruxtWrapper is a theming component that wraps the DruxtModule output.
      <br />
      The following examples demonstrate different ways it can be used.
    </blockquote>

    <hr />

    <h2>DruxtEntity default</h2>
    <p>This is the default behaviour, renders a theme component.</p>
    <pre><code>&lt;DruxtEntity :type="type" :uuid="uuid" /&gt;</code></pre>
    <details>
      <summary><strong>Output</strong></summary>
      <DruxtEntity :type="type" :uuid="uuid" />
    </details>

    <hr />

    <h2>DruxtEntity with wrapper disabled</h2>
    <p>
      This will ignore any available wrapper components and renders the default
      output of the DruxtEntity module.
    </p>
    <pre><code>&lt;DruxtEntity :type="type" :uuid="uuid" :wrapper="false" /&gt;</code></pre>
    <details>
      <summary><strong>Output</strong></summary>
      <DruxtEntity :type="type" :uuid="uuid" :wrapper="false" />
    </details>

    <hr />

    <h2>DruxtEntity using template injection, default wrapper</h2>
    <p>
      The value of the template will be the output of the component, wrapper
      component is ignored.
    </p>
    <pre><code>&lt;DruxtEntity :type="type" :uuid="uuid"&gt;
    &lt;template #default="{ entity }"&gt;
      ...
    &lt;/template&gt;
  &lt;/DruxtEntity&gt;</code></pre>
    <details>
      <summary><strong>Output</strong></summary>
      <DruxtEntity :type="type" :uuid="uuid">
        <template #default="{ entity }">
          <pre><code>{{ JSON.stringify(entity, null, '  ') }}</code></pre>
        </template>
      </DruxtEntity>
    </details>

    <hr />

    <h2>DruxtEntity using template injection with wrapper enabled</h2>
    <p>
      The value of the template will be the output of the default slot in a
      wrapper component.
    </p>
    <pre><code>&lt;DruxtEntity :type="type" :uuid="uuid" :wrapper="true"&gt;
    &lt;template #default="{ entity }"&gt;
      ...
    &lt;/template&gt;
  &lt;/DruxtEntity&gt;</code></pre>
    <details>
      <summary><strong>Output</strong></summary>
      <DruxtEntity :type="type" :uuid="uuid" :wrapper="true">
        <template #default="{ entity }">
          <pre><code>{{ JSON.stringify(entity, null, '  ') }}</code></pre>
        </template>
      </DruxtEntity>
    </details>
  </div>

  <div v-else>Loading...</div>
</template>

<script>
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'

export default {
  async fetch() {
    const query = new DrupalJsonApiParams().addPageLimit(1).addFields(this.type, ['id'])
    this.uuid = (await this.$store.dispatch('druxt/getCollection', { type: this.type, query })).data[0].id
  },

  data: () => ({
    uuid: null,
    type: 'node--page'
  })
}
</script>
