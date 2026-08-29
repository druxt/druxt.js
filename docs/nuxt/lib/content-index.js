/**
 * Build-time index of the `content/` tree.
 *
 * `@nuxt/content` v1 has no supported way to query the collection from a
 * nuxt.config.js hook: the package exports `Database`, and instantiating one
 * starts a file watcher that never releases the event loop, so a `generate`
 * using it never exits. Reading the tree directly is deterministic, needs no
 * running Nuxt, and is straightforward to unit test.
 *
 * Only the frontmatter is parsed. Nothing here renders Markdown; the fields
 * this module returns (path, title, description) are exactly what sitemap.xml
 * and llms.txt consume.
 */

const fs = require('fs')
const path = require('path')

const { normalisePath, titleFromPath } = require('./site')

/** A leading `---` fence, which is the only place frontmatter is frontmatter. */
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/

/** `key: value` on one line. The value keeps any colons after the first. */
const FIELD = /^([A-Za-z_][\w-]*)[ \t]*:[ \t]*(.*)$/

/**
 * Split a document into its frontmatter fields and its body.
 *
 * Hand-rolled rather than using gray-matter, which this did use. The docs site
 * is not a yarn workspace of the repository root, so a root `yarn install` does
 * not provide its dependencies, yet the root jest and knip both read this file:
 * jest could not resolve gray-matter and the suite failed to load, and knip
 * reported it unlisted. Declaring it at the root fixed both and cost 50 minutes
 * of CI, because the cache is keyed on the root yarn.lock and every node job
 * then reinstalled 2193 packages from cold and hit the one-hour timeout.
 *
 * Handling three scalar keys is not worth a dependency in either tree. This
 * parses exactly what `content/` uses: title, weight and description, all
 * single-line scalars. It deliberately does not implement YAML. Anything it
 * does not recognise is ignored rather than guessed at, so a document that
 * grows a nested or multi-line value degrades to the same route-derived title
 * and excerpted description a document with no frontmatter already gets.
 *
 * @param {string} raw - The complete file contents.
 * @returns {{data: object, content: string}} Fields and the remaining body.
 */
const parseFrontmatter = (raw) => {
  const text = String(raw || '')
  const fence = FRONTMATTER.exec(text)
  if (!fence) return { data: {}, content: text }

  const data = {}
  fence[1].split(/\r?\n/).forEach((line) => {
    const field = FIELD.exec(line)
    if (!field) return

    const value = field[2].trim()
    const quoted = /^(['"])([\s\S]*)\1$/.exec(value)

    if (quoted) data[field[1]] = quoted[2]
    else if (/^-?\d+(?:\.\d+)?$/.test(value)) data[field[1]] = Number(value)
    else data[field[1]] = value
  })

  return { data, content: text.slice(fence[0].length) }
}

/** Index files, whose route is their containing directory rather than the file. */
const INDEX_NAMES = ['README', 'index']

/**
 * Route path for a content file, mirroring how pages/*_/_.vue resolve slugs.
 *
 * `content/guide/README.md` serves `/guide`, not `/guide/README`, and the API
 * section uses `index.md` for the same purpose. Both collapse to the parent
 * directory so the sitemap lists the URL a visitor actually lands on.
 *
 * @param {string} relative - Path relative to the content root, e.g. `guide/theming.md`.
 * @returns {string} The route path.
 */
const routeFor = (relative) => {
  const withoutExtension = relative.replace(/\.md$/i, '')
  const segments = withoutExtension.split(path.sep).filter(Boolean)
  const last = segments[segments.length - 1]
  if (INDEX_NAMES.includes(last)) segments.pop()
  return normalisePath('/' + segments.join('/'))
}

/** Lines that describe nothing on their own and are skipped when excerpting. */
const isSkippableLine = (line) => (
  line === ''
  || line.startsWith('#') // heading
  || line.startsWith('![') // standalone image
  || line.startsWith('|') // table row
  || line.startsWith('```') // fence
  || line.startsWith('<') // raw html / component
  || /^[-*_]{3,}$/.test(line) // rule
  // List items, matching utils/content.js documentDescription, which only
  // accepts p and blockquote nodes. Without this the two disagree on a document
  // whose first prose is a list: the build wrote "- first bullet item" into
  // llms.txt while the page's own meta description fell back to the section
  // blurb. A leading bullet is not a summary either way.
  || /^([-*+]|\d+\.)\s/.test(line)
  // A note to a maintainer, not a summary. content/guide/deprecations.md opens
  // with "TODO: Move to API documentation", which would otherwise become that
  // page's meta description and its llms.txt entry.
  || /^(TODO|FIXME|NOTE|XXX)\b[:\s]/i.test(line)
)

/**
 * A one-line summary of a document, for `<meta name="description">` and for the
 * llms.txt entry.
 *
 * Almost no page in `content/` sets a `description` in its frontmatter, which
 * is why every page currently ships the empty site-wide default. The first real
 * line of prose is a far better answer than nothing, and most module READMEs
 * and guide pages already open with exactly that: a one-sentence blockquote
 * summary.
 *
 * @param {string} body - Markdown body, frontmatter already stripped.
 * @returns {string} A plain-text summary, or an empty string.
 */
const excerpt = (body) => {
  const lines = String(body || '')
    .split('\n')
    .map((raw) => raw.replace(/^>\s?/, '').trim())

  // Pages under content/api are jsdoc2md output: a heading, then a <dl> of
  // every symbol in the package. Excerpting those line by line yields sentence
  // fragments torn out of the middle of the markup ("wrapper component.</p>"),
  // which is worse than saying nothing and letting the caller supply a real
  // description. Detected by structure rather than by path so it holds for any
  // generated page.
  const firstMeaningful = lines.find((line) => line !== '' && !line.startsWith('#'))
  if (!firstMeaningful || firstMeaningful.startsWith('<')) return ''

  const line = lines.find((candidate) => !isSkippableLine(candidate))
  if (!line) return ''

  return line
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links keep their text
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Every `.md` file under a directory, depth first.
 *
 * @param {string} dir - Directory to walk.
 * @param {string} root - The content root, for relative paths.
 * @returns {string[]} Paths relative to `root`.
 */
const walk = (dir, root) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.reduce((found, entry) => {
    const absolute = path.join(dir, entry.name)
    if (entry.isDirectory()) return found.concat(walk(absolute, root))
    if (!/\.md$/i.test(entry.name)) return found
    return found.concat(path.relative(root, absolute))
  }, [])
}

/**
 * Read the content tree.
 *
 * @param {string} contentDir - Absolute path to the content root.
 * @returns {Array<object>} Documents as { route, title, description, section, mtime }.
 */
const readContent = (contentDir) => {
  if (!fs.existsSync(contentDir)) return []

  return walk(contentDir, contentDir)
    .map((relative) => {
      const absolute = path.join(contentDir, relative)
      const raw = fs.readFileSync(absolute, 'utf8')
      const { data, content } = parseFrontmatter(raw)
      const route = routeFor(relative)

      return {
        route,
        title: data.title || titleFromPath(route),
        description: data.description || excerpt(content),
        weight: typeof data.weight === 'number' ? data.weight : 0,
        section: route.split('/').filter(Boolean)[0] || null,
        // The commit date would be a truer <lastmod>, but a CI checkout has no
        // per-file history without a full clone. mtime is stable within a build
        // and is what the file system can actually answer.
        mtime: fs.statSync(absolute).mtime,
      }
    })
    .sort((a, b) => a.route.localeCompare(b.route))
}

module.exports = { readContent, routeFor, excerpt, parseFrontmatter }
