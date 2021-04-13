<template>
  <b-container class="d-flex flex-column min-vh-100">
    <b-navbar fixed>
      <b-navbar-brand>
        <Logo class="float-left w-25 h-25 mr-3" />
        <h4>DruxtMenu</h4>
        <small>Draggable edit demo</small>
      </b-navbar-brand>

      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav class="ml-auto">
          <b-nav-item href="https://druxtjs.org" target="_blank">
            DruxtJS.org
          </b-nav-item>
          <b-nav-item
            href="https://github.com/druxt/druxt-menu/tree/develop/examples/nuxt-edit"
            target="_blank"
          >
            GitHub
          </b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>

    <b-row class="my-3" align-v="center">
      <b-col>
        <!-- eslint-disable -->
        <p>
          This is an example of a Fully decoupled Drupal menu being rendered by
          the <a href="https://menu.druxtjs.org" target="_blank">DruxtMenu</a> and
          <a href="https://drupal.org/project/jsonapi_menu_items" target="_blank">JSON:API Menu Items</a>
          modules.
        </p>
        <p>
          This example uses the
          <a href="https://www.npmjs.com/package/vuedraggable" target="blank">VueDraggable</a>
          component to provide a frontend editing experience.
        </p>
        <strong>
          Click the lock icon to toggle edit mode.
        </strong>
        <!-- eslint-enable -->
      </b-col>
    </b-row>

    <b-row class="my-auto" align-v="center">
      <b-col>
        <DruxtMenu :name="menu" />
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
export default {
  data: () => ({
    menu: 'main',
  }),
}
</script>

<style scoped>
.navbar-brand {
  font-family: 'Quicksand', sans-serif;
}

.navbar-brand h4 {
  margin-bottom: -0.25rem;
}
</style>
