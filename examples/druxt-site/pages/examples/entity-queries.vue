<template>
  <div v-if="!$fetchState.pending">
    <h1>DruxtEntity query settings</h1>
    <blockquote>The DruxtEntity query settings allow including and filtering fields from the request resource.</blockquote>

    <hr />

    <h2>Query settings</h2>
    <dl>
      <dt>fields</dt>
      <dd>
        <p>An array or arrays of fields to filter from the returned resource(s).</p>
        <p>If an array of strings is provided, they will be used to filter the main Entity.</p>
        <pre><code>['title', 'id', 'field_name']</code></pre>
        <p>Additional resources can be filtered using a nest array syntax.</p>
        <pre><code>[
  ['title', 'id', 'field_name'],
  ['user--user', ['display_name']]
]</code></pre>
      </dd>
      <dt>include</dt>
      <dd>
        <p>An array of relationships include with the JSON:API resource.</p>
        <pre><code>['uid']</code></pre>
      </dd>
      <dt>schema</dt>
      <dd>
        <p>Boolean; If true, fields will be filtered based on the schema, as well as any explicitly defined fields.</p>
      </dd>
    </dl>

    <hr />

    <h2>Defaults</h2>
    <p>By default the DruxtEntity will not filter the Entity resource.</p>
    <p>This should print out all the unfiltered Page data.</p>
    <details>
      <summary>Output</summary>
      <DruxtEntity type="node--page" :uuid="uuids['node--page']">
        <template #default="{ entity }">
          <pre><code>{{ JSON.stringify(entity, null, '  ') }}</code></pre>
        </template>
      </DruxtEntity>
    </details>

    <hr />

    <h2>Schema filtering via Theme component</h2>
    <p>Using query settings on a Theme component to filter just the schema fields.</p>
    <details>
      <summary>Output</summary>
      <DruxtEntity type="node--article" :uuid="uuids['node--article']" :wrapper="true">
        <template #default="{ entity }">
          <pre><code>{{ JSON.stringify(entity, null, '  ') }}</code></pre>
        </template>
      </DruxtEntity>
    </details>

    <hr />

    <h2>Field filtering via Theme component</h2>
    <p>Using query settings to filter specific fields from the Recipe entity.</p>
    <details>
      <summary>Output</summary>
      <DruxtEntity type="node--recipe" :uuid="uuids['node--recipe']" :wrapper="true">
        <template #default="{ entity }">
          <pre><code>{{ JSON.stringify(entity, null, '  ') }}</code></pre>
        </template>
      </DruxtEntity>
    </details>

    <hr />

    <h2>Including related resources with filtering</h2>
    <p>Using query settings to include related resources and filter them.</p>
    <details>
      <summary>Output</summary>
      <DruxtEntity mode="teaser" type="node--recipe" :uuid="uuids['node--recipe']" :wrapper="true">
        <template #default="{ entity }">
          <pre><code>{{ JSON.stringify(entity, null, '  ') }}</code></pre>
        </template>
      </DruxtEntity>
    </details>

    <hr />

    <h2>Query settings as a property</h2>
    <p>Applying query settings as a property of the DruxtEntity component.</p>
    <details>
      <summary>Output</summary>
      <DruxtEntity
        type="node--page"
        :uuid="uuids['node--page']"
        :settings="{
          query: {
            fields: [['user--user', ['display_name']]],
            include: ['uid'],
          }
        }">
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
    const uuids = await Promise.all(Object.keys(this.uuids).map((type) => {
      const query = new DrupalJsonApiParams().addPageLimit(1).addFields(type, ['id'])
      return this.$store.dispatch('druxt/getCollection', { type, query })
    }))
    for (const type of Object.keys(this.uuids)) {
      this.uuids[type] = uuids.find((o) => o.data[0].type === type).data[0].id
    }
  },
  data: () => ({
    uuids: {
      'node--article': undefined,
      'node--page': undefined,
      'node--recipe': undefined,
    },
  })
}
</script>

<style scoped>
dl dt {
  font-weight: bold;
}
</style>
