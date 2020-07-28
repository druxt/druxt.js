const dmd = require('dmd')
const fs = require('fs')
const globby = require('globby')
const jsdoc2md = require('jsdoc-to-markdown')
const mkdirp = require('mkdirp')
const path = require('path')
const vueDocs = require('vue-docgen-api')

const writeFile = function(file, data) {
  if (!data) return

  const destination = file.replace('src', 'docs/api').replace(/\.[^/.]+$/, '.md')
  mkdirp.sync(path.dirname(destination))
  fs.writeFileSync(destination, data)
}

module.exports = function () {
  // Vue.js SFC documentation with vue-docgen-api.
  globby.sync('src/**/*.vue').map(file => {
    vueDocs.parse(file).then(data => {
      const content = dmd([
        {
          id: data.displayName,
          name: data.displayName,
          description: data.description
        },
      ])
      writeFile(file, content)
    })
  })

  // JSDoc documentation with jsdoc-to-markdown.
  globby.sync('src/**/*.js').map(file => {
    // Skip tests, fixtures and mocks.
    if (file.match(/\/__.*?__\//)) return

    jsdoc2md.render({ files: file }).then(data => {
      writeFile(file, data)
    })
  })
}
