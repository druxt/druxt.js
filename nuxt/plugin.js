import Vue from 'vue'
import { DruxtMenu, DruxtMenuComponent } from 'druxt-menu'

Vue.use({
  install: function (Vue) {
    if (Vue._druxt_menu_installed) return
    Vue._druxt_menu_installed = true

    // Register components.
    Vue.component('DruxtMenu', DruxtMenuComponent)
  }
})

export default (context, inject) => {
  const baseUrl = '<%= options.baseUrl %>'

  const druxtMenu = new DruxtMenu(baseUrl)
  inject('druxtMenu', () => druxtMenu)
}
