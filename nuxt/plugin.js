import Vue from 'vue'
import { Druxt, DruxtComponent } from 'druxt'

// Install the Druxt Vue.js component.
Vue.use({
  install: function (Vue) {
    if (Vue._druxt_installed) return
    Vue._druxt_installed = true

    // Register component.
    Vue.component(DruxtComponent.name, DruxtComponent)
  }
})

// Inject the $druxt plugin.
export default (context, inject) => {
  const baseUrl = '<%= options.baseUrl %>'
  const options = {}

  <% if (options.endpoint) { %>
  options.endpoint = '<%= options.endpoint %>'
  <% } %>

  const druxt = new Druxt(baseUrl, options)
  inject('druxt', druxt)
}
