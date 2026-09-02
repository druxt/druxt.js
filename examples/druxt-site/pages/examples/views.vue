<template>
  <div>
    <h1>DruxtView examples</h1>
    <blockquote>DruxtView renders a Drupal View using the JSON:API Views module - results, exposed filters/sorts, headers and footers. The following examples demonstrate the same two render paths as <NuxtLink to="/examples/wrappers">DruxtEntity</NuxtLink>: the default results slot (one DruxtEntity per row, themed by whatever wrapper components exist), and template injection for full control.</blockquote>

    <hr />

    <h2>DruxtView default</h2>
    <p>Each result renders through the default <code>results</code> slot - a <code>DruxtEntity</code> per row, in <code>teaser</code> mode.</p>
    <pre><code>&lt;DruxtView view-id="promoted_items" display-id="block_1" mode="teaser" /&gt;</code></pre>
    <details>
      <summary><strong>Output</strong></summary>
      <DruxtView view-id="promoted_items" display-id="block_1" mode="teaser" />
    </details>

    <hr />

    <h2>DruxtView using template injection</h2>
    <p>The default slot receives <code>view</code> and <code>results</code> directly, bypassing per-result DruxtEntity rendering entirely - useful when a view is just a data source, not something you want themed row-by-row.</p>
    <pre><code>&lt;DruxtView view-id="promoted_items" display-id="block_1"&gt;
  &lt;template #default="{ results }"&gt;
    ...
  &lt;/template&gt;
&lt;/DruxtView&gt;</code></pre>
    <details>
      <summary><strong>Output</strong></summary>
      <DruxtView view-id="promoted_items" display-id="block_1">
        <template #default="{ results }">
          <ul>
            <li v-for="result of results" :key="result.id">
              {{ (result.attributes || {}).title || result.id }}
            </li>
          </ul>
        </template>
      </DruxtView>
    </details>
  </div>
</template>
