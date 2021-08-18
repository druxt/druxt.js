import consola from 'consola'
import dmd from 'dmd'
import fs from 'fs' 
import { globby } from 'globby'
import jsdoc2md from 'jsdoc-to-markdown'
import mkdirp from 'mkdirp'
import path from 'path'
import VueDocgenApi from 'vue-docgen-api'

async function main () {
  const files = await globby([
    // Javascript.
    'packages/**/src/**/*.js',
    // Vue.js.
    'packages/**/src/components/**/*.vue',
    // Exclude fixtures, mocks and tests.
    '!**/__*__/**/*',
  ])

  for (const file of files) {
    // Get JSDoc template data from file.
    const templateData = jsdoc2md.getTemplateDataSync({
      //configure: path.resolve(path.resolve(__dirname, '/jsdoc.json')),
      files: file,
    })

    // Process file based on extension.
//     if (file.match(/\.js$/)) {
//       await this.processJs(file, templateData)
//     }
//     else {
//       await this.processVue(file, templateData)
//     }

    writeData(file, templateData)
  }
}

async function writeData (file, templateData) {
  if (!templateData) return

  const content = dmd(templateData, {
    // 'example-lang': 'vue live',
    'heading-depth': 1,
    // partial: [
    //   path.resolve(cwd, 'partials/sig-name.hbs')
    // ],
    separators: true
  })
  if (!content) return

  const destination = 'docs/content/docgen/' + file.replace('src/', '').replace(/\.[^/.]+$/, '.md')
  mkdirp.sync(path.dirname(destination))

  // Build frontmatter.
  const name = templateData[0].id.split(':').pop()
  const frontmatter = `---\ntitle: ${name}\n---\n\n`

  fs.writeFileSync(destination, frontmatter + content)
}

main().catch((error) => {
  consola.error(error)
  process.exit(1)
})
