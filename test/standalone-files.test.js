import fs from 'fs'
import path from 'path'

// A directory a package exports by subpath, such as `./server-middleware/*`,
// is copied file for file into dist/ rather than bundled. A relative import
// that leaves the directory points at a file dist/ never has, so the copy
// cannot load, as druxt's cacheClear.mjs could not.
const root = path.resolve(__dirname, '../packages')

const looseDirectories = () => fs.readdirSync(root).flatMap((name) => {
  const manifest = path.join(root, name, 'package.json')
  if (!fs.existsSync(manifest)) return []
  const { exports = {} } = JSON.parse(fs.readFileSync(manifest, 'utf8'))
  return Object.entries(exports)
    .filter(([key, target]) => key.endsWith('/*') && typeof target === 'string' && target.startsWith('./dist/'))
    .map(([, target]) => path.join(root, name, 'src', target.slice('./dist/'.length, -'/*'.length)))
    .filter((directory, index, all) => fs.existsSync(directory) && all.indexOf(directory) === index)
})

const sources = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const file = path.join(directory, entry.name)
  if (entry.isDirectory()) return sources(file)
  return /\.(js|mjs|vue)$/.test(entry.name) ? [file] : []
})

// Static imports, and import() or require() calls. Block comments go first, so
// one such as webpack's chunk name before the path does not hide it, and the
// match itself has no nested repetition to backtrack over.
const relativeSpecifiers = (source) => [...source
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .matchAll(/(?:\bfrom|\bimport|\b(?:import|require)\s*\()\s*['"](\.{1,2}\/[^'"]+)['"]/g)]
  .map((match) => match[1])

const relativeImports = (file) => relativeSpecifiers(fs.readFileSync(file, 'utf8'))

describe('files copied outside the bundle', () => {
  const directories = looseDirectories()

  test('the exported directories are found', () => {
    // Fails rather than passes with nothing to check if the export shape changes.
    expect(directories.map((d) => path.relative(root, d))).toEqual(expect.arrayContaining([
      path.join('druxt', 'src', 'server-middleware'),
      path.join('druxt', 'src', 'components'),
    ]))
  })

  test('every form of relative import is read', () => {
    const source = [
      "import a from './a'",
      "import './b'",
      "export { c } from '../c'",
      "const d = () => import('./d')",
      "const e = () => import(/* webpackChunkName: \"e\" */ '../e')",
      "const f = require( /* a */ /* b */ './f')",
      "import g from /* note */ '../g'",
      "import /* side effect */ './h'",
      "import i from 'i'",
    ].join('\n')
    expect(relativeSpecifiers(source)).toStrictEqual(['./a', './b', '../c', './d', '../e', './f', '../g', './h'])
  })

  test('import nothing from outside their own directory', () => {
    const escapes = directories.flatMap((directory) => sources(directory).flatMap((file) => relativeImports(file)
      .filter((specifier) => !path.resolve(path.dirname(file), specifier).startsWith(directory + path.sep))
      .map((specifier) => `${path.relative(root, file)} imports ${specifier}`)))
    expect(escapes).toStrictEqual([])
  })
})
