import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, writeFile, mkdtemp, appendFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseLogLines, groupByEndpoint, readNewLines, waitForSettle } from '../backend-log.mjs'

const fixture = new URL('./fixtures/php-server.log', import.meta.url)

test('parseLogLines keeps request lines only', async () => {
  const entries = parseLogLines(await readFile(fixture, 'utf8'))
  assert.equal(entries.length, 8)
  assert.deepEqual(entries[0], { method: 'GET', path: '/jsonapi', status: 200 })
  assert.deepEqual(entries[6], { method: 'GET', path: '/favicon.ico', status: 404 })
})

test('groupByEndpoint buckets by shape', async () => {
  const groups = groupByEndpoint(parseLogLines(await readFile(fixture, 'utf8')))
  assert.deepEqual(groups, { index: 2, collections: 1, resources: 1, router: 1, menu: 1, files: 1, other: 1, total: 8 })
})

test('readNewLines returns only bytes past the offset', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'perf-audit-'))
  const file = join(dir, 'log')
  await writeFile(file, 'old line\n')
  const first = await readNewLines(file, 0)
  assert.equal(first.text, 'old line\n')
  await appendFile(file, 'new line\n')
  const second = await readNewLines(file, first.offset)
  assert.equal(second.text, 'new line\n')
  assert.equal(second.offset, first.offset + 'new line\n'.length)
})

test('waitForSettle resolves once the file stops growing', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'perf-audit-'))
  const file = join(dir, 'log')
  await writeFile(file, 'a\n')
  setTimeout(() => appendFile(file, 'b\n'), 100)
  const offset = await waitForSettle(file, 0, { quietMs: 300, timeoutMs: 5000 })
  assert.equal(offset, 4)
})
