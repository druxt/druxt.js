// Server render probes: one fetch per route, timed, then the HTML analysed.
import { performance } from 'node:perf_hooks'

const NUXT_SCRIPT = /<script[^>]*>\s*window\.__NUXT__=([\s\S]*?)<\/script>/
const ERROR_KEY = /[{,]error:/

function extractErrorState(nuxtPayload) {
  const match = ERROR_KEY.exec(nuxtPayload)
  if (!match) return null
  const errorStart = match.index + match[0].length
  const char = nuxtPayload[errorStart]
  if (char !== '{') {
    if (nuxtPayload.slice(errorStart, errorStart + 4) === 'null') return null
    return null
  }
  let depth = 0
  let pos = errorStart
  while (pos < nuxtPayload.length) {
    if (nuxtPayload[pos] === '{') depth++
    else if (nuxtPayload[pos] === '}') {
      depth--
      if (depth === 0) {
        const value = nuxtPayload.slice(errorStart + 1, pos)
        if (!/^\s*$/.test(value)) return value
        return null
      }
    }
    pos++
  }
  return null
}

export function analyseHtml(html) {
  const nuxt = NUXT_SCRIPT.exec(html)
  const nuxtBytes = nuxt ? Buffer.byteLength(nuxt[1]) : 0
  const fetchKeys = (html.match(/data-fetch-key=/g) || []).length
  let errorState = null
  if (nuxt) {
    errorState = extractErrorState(nuxt[1])
  }
  return { htmlBytes: Buffer.byteLength(html), nuxtBytes, fetchKeys, errorState }
}

export async function probe(url) {
  const started = performance.now()
  const response = await fetch(url, { redirect: 'manual', headers: { accept: 'text/html' } })
  const ttfbMs = Math.round(performance.now() - started)
  const html = await response.text()
  const totalMs = Math.round(performance.now() - started)
  return { status: response.status, ttfbMs, totalMs, ...analyseHtml(html) }
}
