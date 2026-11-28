<template>
  <div>
    <h1>DruxtDevelTemplate examples</h1>
    <blockquote>
      A Druxt component with nothing to render it shows a debug panel while
      Nuxt runs in development mode. The panel lists the names a theme
      component could take, from the most specific to the least, and a button
      that creates one.
    </blockquote>

    <hr />

    <h2>A component without a theme component</h2>
    <p>
      <code>DruxtExampleNotice</code> is a small custom module in this example
      app, and it has no theme component on purpose, so this page always has
      one to show. Open the panel, choose a name and press
      <strong>Create</strong>: Druxt writes the component under
      <code>components/druxt/example/notice/</code> and opens it in your
      editor.
    </p>
    <pre><code>&lt;DruxtExampleNotice kind="warning" /&gt;</code></pre>
    <DruxtExampleNotice kind="warning" />
  </div>
</template>

<script>
export default {
}
</script>
