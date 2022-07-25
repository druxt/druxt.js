<template>
  <div>
    <h1>DruxtDebug component examples</h1>
    <blockquote>The DruxtDebug component is a wrapper for debug output, and is only rendered when Nuxt is running in develop mode.</blockquote>

    <hr />

    <h2>Basic usage</h2>
    <p>The component renders a Details field, with a summary and any provided debug markup.</p>
    <pre><code>&lt;DruxtDebug&gt;
  Any markup can go here.
&lt;/DruxtDebug&gt;
</code></pre>
    <DruxtDebug>
      Any markup can go here.
    </DruxtDebug>

    <h2>Summary</h2>
    <p>The <strong>summary</strong> prop allows you to provide your own summary text.</p>
    <pre><code>&lt;DruxtDebug summary="Debug summary"&gt;
  Any markup can go here.
&lt;/DruxtDebug&gt;
</code></pre>
    <DruxtDebug summary="Debug summary">
      Any markup can go here.
    </DruxtDebug>

    <hr />

    <h2>Debug JSON</h2>
    <p>The <strong>json</strong> property takes JSON data and makes it readable.</p>
    <pre><code>&lt;DruxtDebug :json="{ test: [{ one: true, two: false, three: [] }] }" /&gt;</code></pre>
    <DruxtDebug :json="{ test: [{ one: true, two: false, three: [] }] }" />
  </div>
</template>

<script>
export default {
}
</script>

<style scoped>
dl dt {
  font-weight: bold;
}
</style>
