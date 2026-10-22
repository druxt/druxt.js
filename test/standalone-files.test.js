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

const relativeImports = (file) => [...fs.readFileSync(file, 'utf8')
  .matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)['"](\.{1,2}\/[^'"]+)['"]/g)]
  .map((match) => match[1])

describe('files copied outside the bundle', () => {
  const directories = looseDirectories()

  test('the exported directories are found', () => {
    // Fails rather than passes with nothing to check if the export shape changes.
    expect(directories.map((d) => path.relative(root, d))).toEqual(expect.arrayContaining([
      path.join('druxt', 'src', 'server-middleware'),
      path.join('druxt', 'src', 'components'),
    ]))
  })

  test('import nothing from outside their own directory', () => {
    const escapes = directories.flatMap((directory) => sources(directory).flatMap((file) => relativeImports(file)
      .filter((specifier) => !path.resolve(path.dirname(file), specifier).startsWith(directory + path.sep))
      .map((specifier) => `${path.relative(root, file)} imports ${specifier}`)))
    expect(escapes).toStrictEqual([])
  })
})
