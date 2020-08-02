const dmd = require('dmd')
const fs = require('fs')
const globby = require('globby')
const jsdoc2md = require('jsdoc-to-markdown')
const mkdirp = require('mkdirp')
const path = require('path')
const vueDocs = require('vue-docgen-api')

const writeData = function(file, data) {
  if (!data) return

  const content = dmd(data, {
    'example-lang': 'vue live',
    'heading-depth': 1,
    partial: [
      path.resolve('node_modules/druxt-docgen/partials/sig-name.hbs')
    ],
    separators: true
  })
  if (!content) return

  const destination = file.replace('src', 'docs/api').replace(/\.[^/.]+$/, '.md')
  mkdirp.sync(path.dirname(destination))

  // Build frontmatter.
  const name = data[0].id.split(':').pop()
  const frontmatter = `---\ntitle: ${name}\n---\n\n`

  fs.writeFileSync(destination, frontmatter + content)
}

module.exports = function () {
  globby.sync('src', { expandDirectories: { extensions: [ 'js', 'vue' ] } }).map(file => {
    // Skip tests, fixtures and mocks.
    if (file.match(/\/__.*?__\//)) return

    const templateData = jsdoc2md.getTemplateDataSync({
      configure: path.resolve('node_modules/druxt-docgen/jsdoc.json'),
      files: file,
    })

    // Vue.js SFC documentation with vue-docgen-api.
    if (file.match(/\.vue$/)) {
      vueDocs.parse(file).then(data => {
        templateData.map(item => {
          const parts = item.id.split('.')
          if (item.memberof === null && parts.length > 1) {
            parts.pop()
            item.memberof = parts.join('.')
          }

          // @vue-computed tag support.
          if (item._vueComputed) {
            // Strip out HTML table from description.
            item.description = item.description.replace(/<\/p.*/ms, '')

            // Add
            item._vueComputed.map(property => {
              templateData.push({
                id: `module:${data.displayName}.computed.${property.name}`,
                longname: `module:${data.displayName}.computed.${property.name}`,
                kind: 'property',
                scope: 'static',
                memberof: `module:${data.displayName}.computed`,

                ...property
              })
            })
          }

          // Vue.js Computed properties fixes.
          if (parts[1] === 'computed' && parts.length === 2) {
            item.kind = 'property'
          }
        })

        writeData(file, templateData)
      })
    }

    // JS files.
    else {
      templateData.map(item => {
        // Vuex state scope fix.
        if (item.name === 'state' && item.scope === 'inner') {
          delete item.scope
        }

        // Vuex mutations/@mutator tag suport.
        if (item.mutators) {
          item.description = item.mutators[0].description
          item.kind = 'method'
          item.scope = 'mutation'
        }
      })
      writeData(file, templateData)
    }
  })
}
