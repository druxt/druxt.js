<template>
  <div>
    <h1>DruxtRouter - Router modes</h1>
    <blockquote>The DruxtRouter can be used directly or as a wildcard route, as required.</blockquote>

    <hr />

    <h2>Module settings</h2>
    <p>These settings are for the <code>druxt</code> object in <code>nuxt.config.js</code></p>
    <dl>
      <dt>middleware</dt>
      <dd>
        <p>Boolean; If true (default), executes middleware on the DruxtRouter page to handle server side redirects.</p>
        <p>Disable this for Full Statiic Serverless builds.</p>
      </dd>
      <dt>wildcard</dt>
      <dd>
        <p>Boolean; If true, adds a wildcard router page to the Vue router.</p>
      </dd>
    </dl>

    <hr />

    <h2>Component - Default</h2>
    <p>By default the DruxtRouter component will render a Druxt component based on the Vue router route.</p>
    <p>This mode allows routes to be controled by the Nuxt <code>~/pages</code> components.</p>
    <pre><code>&lt;DruxtRouter /&gt;</code></pre>
    <details>
      <summary>Output</summary>
      <DruxtRouter />
    </details>

    <hr />

    <h2>Component - Path prop</h2>
    <p>A Path property can be provided or bound to the DruxtRouter component to specify what route should be rendered.</p>
    <p>This mode allows explicit rendering of specified routes.</p>
    <pre><code>&lt;DruxtRouter path="/node/1" /&gt;</code></pre>
    <details>
      <summary>Output</summary>
      <DruxtRouter path="/node/1" />
    </details>

    <hr />

    <h2>Page: Wildcard </h2>
    <p>A wildcard router page can be injected into the Vue router to catch all non-page based requests.</p>
    <p>This can be done by enabling the feature in your <code>nuxt.config.js</code></p>
    <p>This feature is enabled by default when using the DruxtSite module.</p>
    <pre><code>export default {
  druxt: {
    router: {
      wildcard: true
    }
  }
}</code></pre>
    <NuxtLink to="/node/1">Example: /node/1</NuxtLink>

    <hr />

    <h2>Page: Extend</h2>
    <p>The DruxtRouter page can be extended.</p>
    <p>This gives you full control of the router page with support for redirects via the page middleware.</p>
    <p>To extend the router, create a <code>~/pages</code> component:</p>
    <pre><code>&lt;script&gt;
import DruxtRouter from 'druxt-router/dist/components/DruxtRouter.vue'

export default {
  extends: DruxtRouter
}
&lt;/script&gt;</code></pre>
    <NuxtLink to="/en/recipes/deep-mediterranean-quiche">Example: /en/recipes/deep-mediterranean-quiche</NuxtLink>

    <hr />

    <h2>Page: Disable middleware</h2>
    <p>The DruxtRouter page middleware handles Decoupled router based redirects.</p>
    <p>As middleware is executed in Full Static builds, this can cause issues if your Drupal backend is offline.</p>
    <p>You can disable the feature in your <code>nuxt.config.js</code></p>
    <pre><code>export default {
  druxt: {
    router: {
      middleware: false
    }
  }
}</code></pre>
  </div>
</template>

<style scoped>
dl dt {
  font-weight: bold;
}
</style>
