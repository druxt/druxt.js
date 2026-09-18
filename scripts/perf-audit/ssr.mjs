// Server render probes: one fetch per route, timed, then the HTML analysed.
import { performance } from 'node:perf_hooks'

const NUXT_SCRIPT = /<script>window\.__NUXT__=([\s\S]*?)<\/script>/
const ERROR_STATE = /error:\{([^}]*)\}/

export function analyseHtml(html) {
  const nuxt = NUXT_SCRIPT.exec(html)
  const nuxtBytes = nuxt ? Buffer.byteLength(nuxt[1]) : 0
  const fetchKeys = (html.match(/data-fetch-key=/g) || []).length
  let errorState = null
  if (nuxt) {
    const error = ERROR_STATE.exec(nuxt[1])
    if (error && !/^\s*$/.test(error[1])) errorState = error[1]
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
