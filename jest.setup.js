import { config } from '@vue/test-utils'

config.stubs['NuxtLink'] = {
  name: 'NuxtLink',
  template: '<nuxt-link-stub v-bind="$attrs" v-on="$listeners"><slot /></nuxt-link-stub>',
  props: ['to']
}
