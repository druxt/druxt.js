import { DruxtSchema } from 'druxt-schema'

export default ({ $druxt }, inject) => {
  const schema = new DruxtSchema($druxt.settings.baseUrl)
  schema.import = async id => {
    try {
      return import(`./schemas/${id}.json`).then(m => m.default || m)
    } catch(e) {
      return false
    }
  }
  inject('druxtSchema', schema)
}

/**
 * @typedef {object} Schema
 * @see {@link ./typedefs/schema|Schema}
 */
