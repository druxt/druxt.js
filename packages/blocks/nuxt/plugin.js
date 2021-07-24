import Vue from 'vue'

import * as DruxtBlocksComponents from 'druxt-blocks/dist/components/index.mjs'

Vue.use({
  install: function (Vue) {
    if (Vue._druxt_blocks_installed) return
    Vue._druxt_blocks_installed = true

    // Register components.
    for (const component in DruxtBlocksComponents) {
      Vue.component(component, DruxtBlocksComponents[component])
    }
  }
})

export default (context, inject) => {
  const options = {}

  <% if (Array.isArray(((options.blocks || {}).query || {}).fields)) { %>
  options.query = {
    fields: [<%= options.blocks.query.fields.map((s) => `"${s}"`).join(', ') %>],
  }
  <% } %>

  inject('druxtBlocks', { options })
}
