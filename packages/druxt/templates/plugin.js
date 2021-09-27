import { DruxtClient } from 'druxt'

export default (context, inject) => {
  const options = <%= devalue(options) %>

  const druxt = new DruxtClient(options.baseUrl, options)
  druxt.settings = options
  inject('druxt', druxt)
}
