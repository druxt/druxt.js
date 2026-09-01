#!/usr/bin/env node
/**
 * Static server for the generated site, replacing `nuxt start`.
 *
 * `nuxt start` 301s bare directory URLs to a trailing slash - the opposite
 * of the slashless canonical URLs every og:url, canonical link and sitemap
 * entry advertises - and answers unknown paths with the SPA shell as a 200.
 * This serves the same dist with the redirect reversed and a real 404
 * status, using node core only so the runtime image needs no dependencies.
 */
const http = require('http')
const fs = require('fs')
const path = require('path')

const DIST = path.join(__dirname, '..', 'dist')

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

const createHandler = (dist) => (req, res) => {
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

module.exports = { createHandler, DIST }

if (require.main === module) {
  const host = process.env.HOST || '0.0.0.0'
  const port = Number(process.env.PORT) || 3000
  http.createServer(createHandler(DIST)).listen(port, host, () => {
    process.stdout.write(`serve: ${DIST} on http://${host}:${port}\n`)
  })
}
