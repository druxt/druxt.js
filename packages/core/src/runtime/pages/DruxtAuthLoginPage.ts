import { defineComponent, h, resolveDynamicComponent } from 'vue'
import type { Component } from 'vue'
import { navigateTo, useRoute } from '#imports'
import { useDruxtAuth } from '../auth'
import { sitePath } from '../utils/site-path'

// The login route's page, as druxt-auth 0.x generated one.
//
// A visitor who is already signed in never sees the form. They go on to the page in the `redirect` query, or to the
// front page. This happens on the server too.
export default defineComponent({
  name: 'DruxtAuthLoginPage',
  async setup() {
    if (useDruxtAuth().loggedIn.value) {
      const redirect = useRoute().query.redirect
      await navigateTo(sitePath(typeof redirect === 'string' ? redirect : '/'), { replace: true })
      return () => null
    }
    return () => h(resolveDynamicComponent('DruxtAuthLogin') as Component)
  },
})
