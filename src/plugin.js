import druxtRouter from '../../druxt-router/src'

const router = new druxtRouter('<%= options.baseUrl %>')

export default ({ app }, inject) => {
  inject('druxtRouter', () => router)
}
