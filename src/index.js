const dmd = require('dmd')
const fs = require('fs')
const globby = require('globby')
const jsdoc2md = require('jsdoc-to-markdown')
const mkdirp = require('mkdirp')
const ncp = require('ncp').ncp
const path = require('path')
const vueDocs = require('vue-docgen-api')
const { dev, build } = require('vuepress')

const siteConfig = require('./vuepress.config')

const cwd = path.join(__dirname, '..')

/**
 * DruxtDocgen class.
 */
class DruxtDocgen {
  /**
   * Generate documentation for source JS and Vue files.
   */
  async generateDocs () {
    // Copy public files.
    await mkdirp(path.resolve('docs/.vuepress/public'))
    await ncp(path.resolve(cwd, 'docs/.vuepress/public'), path.resolve('docs/.vuepress/public'))

    const files = await globby([
      // Javascript.
      'src/**/*.js',
      // Vue.js.
      'src/components/**/*.vue',
      // Exclude fixtures, mocks and tests.
      '!**/__*__/**/*',
    ])

    for (const file of files) {
      // Get JSDoc template data from file.
      const templateData = jsdoc2md.getTemplateDataSync({
        configure: path.resolve(cwd + '/jsdoc.json'),
        files: file,
      })

      // Process file based on extension.
      if (file.match(/\.js$/)) {
        await this.processJs(file, templateData)
      }
      else {
        await this.processVue(file, templateData)
      }

      this.writeData(file, templateData)
    }
  }

  /**
   * Process Javascript files.
   */
  async processJs (file, templateData) {
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
  }

  /**
   * Process Vue.js files.
   */
  async processVue (file, templateData) {
    // Get data from vue-docgen-api.
    const data = await vueDocs.parse(file)

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
  }

  /**
   * Run Vuepress process.
   */
  runServer () {
    const options = {
      siteConfig,
      sourceDir: 'docs',
      theme: 'druxt'
    }

    if (process.argv.slice(2).pop() === 'build') {
      return build(options)
    }
    dev(options)
  }

  /**
   * Write data to file system.
   *
   * @param {string} file - The file name.
   * @param {*} data - The JSDoc / Vuedoc generated data.
   */
  writeData (file, templateData) {
    if (!templateData) return

    const content = dmd(templateData, {
      'example-lang': 'vue live',
      'heading-depth': 1,
      partial: [
        path.resolve(cwd, 'partials/sig-name.hbs')
      ],
      separators: true
    })
    if (!content) return

    const destination = file.replace('src', 'docs/api').replace(/\.[^/.]+$/, '.md')
    mkdirp.sync(path.dirname(destination))

    // Build frontmatter.
    const name = templateData[0].id.split(':').pop()
    const frontmatter = `---\ntitle: ${name}\n---\n\n`

    fs.writeFileSync(destination, frontmatter + content)
  }
}

module.exports = DruxtDocgen
