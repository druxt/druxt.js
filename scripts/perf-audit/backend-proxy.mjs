#!/usr/bin/env node
// A reverse proxy the audit runs itself, so backend-request counting doesn't
// depend on the provisioned backend's own log (some backends never write a
// per-request completion line). Logs one line per finished request in the
// same format backend-log.mjs's parser reads.
import http from 'node:http'
import { appendFileSync } from 'node:fs'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function pad(n) {
  return String(n).padStart(2, '0')
}

function formatTimestamp(date) {
  const day = DAYS[date.getDay()]
  const month = MONTHS[date.getMonth()]
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  return `${day} ${month} ${pad(date.getDate())} ${time} ${date.getFullYear()}`
}

function logLine(logFile, remotePort, status, method, pathWithQuery) {
  const line = `[${formatTimestamp(new Date())}] 127.0.0.1:${remotePort} [${status}]: ${method} ${pathWithQuery}\n`
  appendFileSync(logFile, line)
}

export function startProxy({ port, target, logFile }) {
  const targetUrl = new URL(target)
  const targetPort = targetUrl.port || 80

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const method = req.method
      const pathWithQuery = req.url
      const remotePort = req.socket.remotePort
      const headers = { ...req.headers }
      delete headers.host

      const upstreamReq = http.request({
        hostname: targetUrl.hostname,
        port: targetPort,
        path: pathWithQuery,
        method,
        headers,
      }, (upstreamRes) => {
        res.writeHead(upstreamRes.statusCode, upstreamRes.headers)
        upstreamRes.pipe(res)
      })

      upstreamReq.on('error', () => {
        if (!res.headersSent) res.writeHead(502)
        res.end()
      })

      res.on('finish', () => {
        logLine(logFile, remotePort, res.statusCode, method, pathWithQuery)
      })

      req.pipe(upstreamReq)
    })

    server.on('error', reject)
    server.listen(port, '127.0.0.1', () => resolve({
      port: server.address().port,
      close: () => new Promise((res) => server.close(() => res())),
    }))
  })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  const opts = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port') opts.port = Number(args[++i])
    else if (args[i] === '--target') opts.target = args[++i]
    else if (args[i] === '--log') opts.logFile = args[++i]
  }
  startProxy(opts)
    .then(({ port }) => { console.log(String(port)) })
    .catch((err) => { console.error(err.message); process.exit(1) })
}
