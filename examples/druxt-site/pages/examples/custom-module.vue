<template>
  <div>
    <h1>Custom module: DruxtCardGrid</h1>
    <p>
      Druxt doesn't require every component to come from a <code>druxt.js</code>
      package. <code>DruxtCardGrid</code> is a small custom module — authored
      in this example app, not published to npm — that fetches a bundle's
      published entities and renders them with the core <code>DruxtEntity</code>
      component. See <code>components/DruxtCardGrid.vue</code>.
    </p>

    <hr />

    <DruxtCardGrid type="node--recipe" :limit="6" />
  </div>
</template>
