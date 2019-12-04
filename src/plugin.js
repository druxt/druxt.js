import DruxtRouter from 'druxt-router/src'

const router = new DruxtRouter('<%= options.baseUrl %>')

export default ({ app }, inject) => {
  inject('druxtRouter', () => router)
}
