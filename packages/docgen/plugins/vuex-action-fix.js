/**
 * Cleans up jsdoc-vuex-plugin output: an `@action` tag with no `=property`
 * part renders as "Mutates state property undefined".
 */
'use strict'

const SUFFIX = ' => Mutates state property</i><code>undefined</code>'

exports.handlers = {
  processingComplete(e) {
    for (const doclet of e.doclets) {
      const description = doclet.description || ''
      if (description.includes(SUFFIX)) {
        doclet.description = description.replace(SUFFIX, '</i>')
      }
    }
  },
}
