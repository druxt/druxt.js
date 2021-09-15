import Vue from 'vue'
import Router from 'vue-router'

import DruxtRouter from 'druxt-router/dist/components/DruxtRouter.vue'

Vue.use(Router)

export function createRouter(ssrContext, config) {
  return new Router({
    mode: 'history',
    routes: [{
      name: 'druxt-router',
      path: '*',
      component: DruxtRouter,
      chunkName: 'druxt-router'
    }]
  })
}
