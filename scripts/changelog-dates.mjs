/**
 * Stamps today's date on undated version headings in package changelogs,
 * Keep a Changelog style: "## 0.24.1" becomes "## 0.24.1 - 2026-08-31".
 *
 * `changeset version` writes bare version headings; running this right after
 * it (see the root "version" script) dates them at versioning time, which in
 * this repo's release flow is the release date. Historical headings were
 * dated from npm publish times in the same format.
 */
import fs from 'node:fs'
import path from 'node:path'

const date = new Date().toISOString().slice(0, 10)
let stamped = 0

const files = fs.readdirSync('packages')
  .map((dir) => path.join('packages', dir, 'CHANGELOG.md'))
  .filter((file) => fs.existsSync(file))

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8')
  const output = source.replace(/^## (\d+\.\d+\.\d+(?:-[\w.]+)?)$/gm, (line, version) => {
    stamped += 1
    return `## ${version} - ${date}`
  })
  if (output !== source) fs.writeFileSync(file, output)
}

console.log(`changelog-dates: stamped ${stamped} heading(s) with ${date}`)
