// Reads the php -S request log that examples/drupal/.devtools/start writes.
import { open, stat } from 'node:fs/promises'

const LINE = /^\[[^\]]+\] \S+ \[(\d{3})\]: (\w+) (\S+)/

export function parseLogLines(text) {
  const entries = []
  for (const line of text.split('\n')) {
    const match = LINE.exec(line)
    if (match) entries.push({ status: Number(match[1]), method: match[2], path: match[3] })
  }
  return entries
}

export function groupByEndpoint(entries) {
  const groups = { index: 0, collections: 0, resources: 0, router: 0, menu: 0, files: 0, other: 0, total: 0 }
  for (const { path } of entries) {
    const clean = path.split('?')[0]
    groups.total++
    if (/^(\/[a-z-]+)?\/jsonapi$/.test(clean)) groups.index++
    else if (/^(\/[a-z-]+)?\/jsonapi\/menu_items\//.test(clean)) groups.menu++
    else if (/^(\/[a-z-]+)?\/jsonapi\/[^/]+\/[^/]+\/[0-9a-f-]{36}/.test(clean)) groups.resources++
    else if (/^(\/[a-z-]+)?\/jsonapi\//.test(clean)) groups.collections++
    else if (/^(\/[a-z-]+)?\/router\/translate-path/.test(clean)) groups.router++
    else if (/^\/(sites\/[^/]+|system)\/files\//.test(clean)) groups.files++
    else groups.other++
  }
  return groups
}

export async function logSize(file) {
  try {
    return (await stat(file)).size
  } catch (err) {
    if (err.code === 'ENOENT') return 0
    throw err
  }
}

export async function readNewLines(file, offset) {
  const { size } = await stat(file)
  if (size <= offset) return { text: '', offset }
  const handle = await open(file, 'r')
  try {
    const buffer = Buffer.alloc(size - offset)
    await handle.read(buffer, 0, buffer.length, offset)
    return { text: buffer.toString('utf8'), offset: size }
  } finally {
    await handle.close()
  }
}

export async function waitForSettle(file, offset, { quietMs = 500, timeoutMs = 15000 } = {}) {
  const started = Date.now()
  let last = (await stat(file)).size
  let quietSince = Date.now()
  while (Date.now() - started < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 50))
    const { size } = await stat(file)
    if (size !== last) { last = size; quietSince = Date.now() }
    else if (Date.now() - quietSince >= quietMs) return size
  }
  return last
}
