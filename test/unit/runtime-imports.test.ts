import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const packages = fs.readdirSync(path.join(__dirname, '../packages'))
  .map((dir) => path.join(__dirname, '../packages', dir, 'package.json'))
  .filter((file) => fs.existsSync(file))
  .map((file) => JSON.parse(fs.readFileSync(file, 'utf8')))
  .filter((pkg) => pkg.exports)

describe('package exports', () => {
  test.each(packages.map((pkg) => [pkg.name]))('%s exports its own package.json', (name) => {
    // Resolved by Node itself, as the exports map is what it enforces.
    const script = `console.log(require('${name}/package.json').name)`
    expect(execFileSync(process.execPath, ['-e', script], { cwd: path.join(__dirname, '..'), encoding: 'utf8' }).trim()).toBe(name)
  })
})
