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
  ['title', 'id', 'field_name'], // Filter the main Entity fields.
  ['user--user', ['display_name']] // Filter the `user--user` resource fields.
]</code></pre>
      </dd>
      <dt>include</dt>
      <dd>
        <p>An array of relationships include with the JSON:API resource.</p>
        <pre><code>['uid'] // Include the `user--user` resource for the author.</code></pre>
      </dd>
      <dt>schema</dt>
      <dd>
        <p>Boolean; If true, fields will be filtered based on the schema, as well as any explicitly defined fields.</p>
      </dd>
    </dl>

    <hr />

    <h2>Defaults</h2>
    <p>By default the DruxtEntity will not filter the Entity resource.</p>
    <p>The default behaviour can be configured in <code>nuxt.config.js</code></p>
    <p>This should print out all the unfiltered Page data.</p>
    <pre><code>&lt;DruxtEntity :type="type" :uuid="uuid" /&gt;</code></pre>
    <details>
      <summary>Output</summary>
      <DruxtEntity type="node--page" :uuid="uuids['node--page']">
        <template #default="{ entity }">
          <pre><code>{{ JSON.stringify(entity, null,  '  ') }}</code></pre>
        </template>
      </DruxtEntity>
    </details>

    <hr />

    <h2>Schema filtering via Theme component</h2>
    <p>This example is using the query settings on a Theme component to filter just the schema fields.</p>
    <p>This should print out only properties and relationships requested by the Article default schema.</p>
    <p><code>@see components/druxt/entity/node/Article.vue</code></p>
    <pre><code>export default {
  druxt: {
    query: {
      schema: true
    }
  }
}</code></pre>
    <details>
      <summary>Output</summary>
      <DruxtEntity type="node--article" :uuid="uuids['node--article']" :wrapper="true">
        <template #default="{ entity }">
          <pre><code>{{ JSON.stringify(entity, null,  '  ') }}</code></pre>
        </template>
      </DruxtEntity>
    </details>

    <hr />

    <h2>Field filtering via Theme component</h2>
    <p>This example is using the query settings on a Theme component to filter specific fields from the Entity resource.</p>
    <p>This should print out just the requested fields of the Recipe entity.</p>
    <p><code>@see components/druxt/entity/node/Recipe.vue</code></p>
    <pre><code>export default {
  druxt: {
    query: {
      fields: ['field_summary', 'langcode', 'path']
    }
  }
}</code></pre>
    <details>
      <summary>Output</summary>
      <DruxtEntity type="node--recipe" :uuid="uuids['node--recipe']" :wrapper="true">
        <template #default="{ entity }">
          <pre><code>{{ JSON.stringify(entity, null,  '  ') }}</code></pre>
        </template>
      </DruxtEntity>
    </details>

    <hr />

    <h2>Including related resources with filtering via Theme component</h2>
    <p>This example is using the query settings on a Theme component to include related resources.</p>
    <p>It's also possible to filter the related resources by using the an array of arrays compoatible with the JSON:API Params <a href="https://www.npmjs.com/package/drupal-jsonapi-params#addfields">addFields</a> method.</p>
    <p>This should show the Recipe fields, including already requested fields, and the filtered relationship data.</p>
    <p><code>@see components/druxt/entity/node/RecipeTeaser.vue</code></p>
    <pre><code>export default {
  druxt: {
    query: {
      include: ['field_media_image', 'field_media_image.field_media_image'],
      fields: [
        ['title'], // Filter the Entity resource.
        ['media--image', []], // Filter the Media resource.
        ['file--file', ['uri']], // Filter the File resource.
      ]
    }
  }
}</code></pre>
    <details>
      <summary>Output</summary>
      <DruxtEntity mode="teaser" type="node--recipe" :uuid="uuids['node--recipe']" :wrapper="true">
        <template #default="{ entity }">
          <pre><code>{{ JSON.stringify(entity, null,  '  ') }}</code></pre>
        </template>
      </DruxtEntity>
    </details>
    <hr />

    <h2>Query settings as a property</h2>
    <p>This example applies the query settings as a property of the DruxtEntity component.</p>
    <p>This should show the already requested Page data with the filtered author entity included.</p>
    <pre><code>&lt;DruxtEntity
  :type="type"
  :uuid="uuid"
  :settings="{
    query: {
      fields: [['user--user', ['display_name']]],
      include: ['uid'],
    }
  }"
/&gt;</code></pre>
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
          <pre><code>{{ JSON.stringify(entity, null,  '  ') }}</code></pre>
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
