#!/usr/bin/env node
/**
 * Static server for the generated site, replacing `nuxt start`.
 *
 * `nuxt start` 301s bare directory URLs to a trailing slash - the opposite
 * of the slashless canonical URLs every og:url, canonical link and sitemap
 * entry advertises - and answers unknown paths with the SPA shell as a 200.
 * This serves the same dist with the redirect reversed and a real 404
 * status, using node core only so the runtime image needs no dependencies.
 *
 * Legacy URLs are redirected from the same map nginx uses for the package
 * subdomains. druxtjs.org itself is routed to this server, not nginx, so
 * the map's druxtjs.org rules only take effect when answered here.
 */
const http = require('http')
const fs = require('fs')
const path = require('path')

const DIST = path.join(__dirname, '..', 'dist')

// The image copies the map beside the site; a repo checkout has it in .lagoon.
const REDIRECTS_MAPS = [
  process.env.REDIRECTS_MAP,
  path.join(__dirname, '..', 'redirects-map.conf'),
  path.join(__dirname, '..', '..', '..', '.lagoon', 'redirects-map.conf'),
].filter(Boolean)

// A druxtjs.org rule: `~^(www\.)?druxtjs\.org<path regex>/?$ <target>;`
const RULE = /^~\^\(www\\\.\)\?druxtjs\\\.org(\S+)\/\?\$\s+(\S+);$/

/**
 * Parse the druxtjs.org rules out of an nginx redirects map.
 *
 * Targets are made relative so a preview environment redirects within its
 * own host, and slashless so the redirect lands in one hop.
 *
 * @param {string} conf - The map file contents.
 * @returns {{ pattern: RegExp, target: string }[]} Rules in file order.
 */
const parseRedirects = (conf) => String(conf).split('\n').reduce((rules, line) => {
  const match = line.trim().match(RULE)
  if (!match || match[2].includes('$')) return rules
  const target = match[2].replace(/^https:\/\/druxtjs\.org/, '').replace(/\/+$/, '')
  return rules.concat({ pattern: new RegExp(`^${match[1]}/?$`), target: target || '/' })
}, [])

const loadRedirects = (file) => (file ? parseRedirects(fs.readFileSync(file, 'utf8')) : [])

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.map': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const send = (res, status, headers, body, headOnly) => {
  res.writeHead(status, headers)
  res.end(headOnly ? undefined : body)
}

const sendFile = (res, file, stats, headOnly, status) => {
  const headers = {
    'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'Content-Length': stats.size,
    'Last-Modified': stats.mtime.toUTCString(),
    // _nuxt filenames are content-hashed; everything else must revalidate
    // so a fresh deploy is picked up (stale shells trigger chunk-reload).
    'Cache-Control': file.includes(`${path.sep}_nuxt${path.sep}`)
      ? 'public, max-age=31536000, immutable'
      : 'no-cache',
  }
  if (headOnly) return send(res, status, headers, undefined, true)
  // Headers wait for 'open': a file lost between stat and open gets a clean
  // 500, and an unhandled stream error would otherwise kill the process.
  const stream = fs.createReadStream(file)
  stream.on('open', () => {
    res.writeHead(status, headers)
    stream.pipe(res)
  })
  stream.on('error', () => {
    if (res.headersSent) return res.destroy()
    send(res, 500, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Internal Server Error')
  })
  res.on('close', () => stream.destroy())
}

const statFile = (file) => {
  try {
    const stats = fs.statSync(file)
    return stats.isFile() ? stats : null
  } catch (e) {
    return null
  }
}

const notModified = (req, stats) => {
  const ims = req.headers['if-modified-since']
  return Boolean(ims) && new Date(ims) >= new Date(stats.mtime.toUTCString())
}

const createHandler = (dist, redirects = []) => (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, { Allow: 'GET, HEAD' }, 'Method Not Allowed')
  }
  const headOnly = req.method === 'HEAD'

  let pathname
  let search
  try {
    const url = new URL(req.url, 'http://internal')
    pathname = decodeURIComponent(url.pathname)
    search = url.search
  } catch (e) {
    return send(res, 400, {}, 'Bad Request')
  }

  // Legacy URLs go first so their slashed form also lands in one hop.
  const legacy = redirects.find(({ pattern }) => pattern.test(pathname))
  if (legacy) {
    return send(res, 301, { Location: legacy.target + search })
  }

  // Canonical URLs carry no trailing slash: strip it with one permanent
  // redirect, query preserved. The bare root is untouched.
  if (pathname !== '/' && pathname.endsWith('/')) {
    return send(res, 301, { Location: pathname.replace(/\/+$/, '') + search })
  }

  const resolved = path.normalize(path.join(dist, pathname))
  if (resolved !== dist && !resolved.startsWith(dist + path.sep)) {
    return send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Not Found', headOnly)
  }

  for (const candidate of [path.join(resolved, 'index.html'), resolved]) {
    const stats = statFile(candidate)
    if (!stats) continue
    if (notModified(req, stats)) return send(res, 304, {}, undefined, true)
    return sendFile(res, candidate, stats, headOnly, 200)
  }

  const notFound = statFile(path.join(dist, '404.html'))
  if (notFound) return sendFile(res, path.join(dist, '404.html'), notFound, headOnly, 404)
  return send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Not Found', headOnly)
}

module.exports = { createHandler, parseRedirects, loadRedirects, DIST, REDIRECTS_MAPS }

if (require.main === module) {
  const host = process.env.HOST || '0.0.0.0'
  const port = Number(process.env.PORT) || 3000
  const map = REDIRECTS_MAPS.find((file) => statFile(file))
  const redirects = loadRedirects(map)
  http.createServer(createHandler(DIST, redirects)).listen(port, host, () => {
    process.stdout.write(`serve: ${DIST} on http://${host}:${port}\n`)
    // Logged so a deploy shows whether the map made it into the image.
    process.stdout.write(map
      ? `serve: ${redirects.length} legacy redirects from ${map}\n`
      : 'serve: no redirects map found, legacy URLs will 404\n')
  })
}
