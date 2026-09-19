import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, writeFile, mkdtemp, appendFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseLogLines, groupByEndpoint, readNewLines, waitForSettle, logSize } from '../backend-log.mjs'

const fixture = new URL('./fixtures/php-server.log', import.meta.url)

test('parseLogLines keeps request lines only', async () => {
  const entries = parseLogLines(await readFile(fixture, 'utf8'))
  assert.equal(entries.length, 9)
  assert.deepEqual(entries[0], { method: 'GET', path: '/jsonapi', status: 200 })
  assert.deepEqual(entries[6], { method: 'GET', path: '/favicon.ico', status: 404 })
})

test('groupByEndpoint buckets by shape', async () => {
  const groups = groupByEndpoint(parseLogLines(await readFile(fixture, 'utf8')))
  assert.deepEqual(groups, { index: 2, collections: 1, resources: 1, router: 1, menu: 1, files: 2, other: 1, total: 9 })
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

test('readNewLines treats a missing file as empty', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'perf-audit-'))
  assert.deepEqual(await readNewLines(join(dir, 'missing.log'), 0), { text: '', offset: 0 })
})

test('logSize returns the current byte size, 0 when missing', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'perf-audit-'))
  const file = join(dir, 'log')
  assert.equal(await logSize(join(dir, 'missing')), 0)
  await writeFile(file, 'abcde')
  assert.equal(await logSize(file), 5)
})

test('waitForSettle resolves once the file stops growing', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'perf-audit-'))
  const file = join(dir, 'log')
  await writeFile(file, 'a\n')
  setTimeout(() => appendFile(file, 'b\n'), 100)
  const size = await waitForSettle(file, { quietMs: 300, timeoutMs: 5000 })
  assert.equal(size, 4)
})

test('waitForSettle treats a missing file as size 0', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'perf-audit-'))
  const file = join(dir, 'missing')
  const size = await waitForSettle(file, { quietMs: 50, timeoutMs: 500 })
  assert.equal(size, 0)
})
