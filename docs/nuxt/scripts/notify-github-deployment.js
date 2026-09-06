#!/usr/bin/env node

/**
 * Lagoon post-rollout hook: reports the just-built preview URL to GitHub as
 * a Deployment, so the open PR (if any) shows a "View deployment" link.
 *
 * Lagoon has no native GitHub integration (only Slack/RocketChat/Email/
 * Teams/Webhook notifications), so this calls the GitHub API directly.
 * Uses Node's built-in https module rather than curl/jq, since this custom
 * Dockerfile's final stage isn't guaranteed to have either installed.
 *
 * No-ops (never fails the deploy) when GITHUB_DEPLOY_TOKEN isn't set yet, or
 * when there's no open PR for the current branch (e.g. main, or a branch
 * pushed without a PR).
 */

const https = require('https')

const GITHUB_OWNER = 'druxt'
const GITHUB_REPO = 'druxt.js'

function githubRequest(method, path, token, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const req = https.request(
      {
        hostname: 'api.github.com',
        path,
        method,
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'User-Agent': 'druxtjs-lagoon-notify',
          'X-GitHub-Api-Version': '2022-11-28',
          ...(data
            ? {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
              }
            : {}),
        },
      },
      (res) => {
        let raw = ''
        res.on('data', (chunk) => {
          raw += chunk
        })
        res.on('end', () => {
          const status = res.statusCode
          let parsed
          try {
            parsed = raw ? JSON.parse(raw) : null
          } catch (error) {
            reject(new Error(`Invalid JSON from GitHub (${status}): ${raw.slice(0, 200)}`))
            return
          }
          if (status >= 200 && status < 300) {
            resolve(parsed)
          } else {
            reject(new Error(`GitHub API ${method} ${path} failed (${status}): ${raw.slice(0, 200)}`))
          }
        })
      }
    )
    req.on('error', reject)
    if (data) {
      req.write(data)
    }
    req.end()
  })
}

async function main() {
  const token = process.env.GITHUB_DEPLOY_TOKEN
  const branch = process.env.LAGOON_GIT_BRANCH
  const route = process.env.LAGOON_ROUTE

  if (!token || !branch || !route) {
    console.log('[notify-github-deployment] GITHUB_DEPLOY_TOKEN, LAGOON_GIT_BRANCH, or LAGOON_ROUTE not set - skipping.')
    return
  }

  const pulls = await githubRequest(
    'GET',
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls?head=${GITHUB_OWNER}:${encodeURIComponent(branch)}&state=open`,
    token
  )

  if (!Array.isArray(pulls) || pulls.length === 0) {
    console.log(`[notify-github-deployment] No open PR for branch "${branch}" - skipping.`)
    return
  }

  const pr = pulls[0]

  const deployment = await githubRequest('POST', `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/deployments`, token, {
    ref: pr.head.sha,
    environment: `lagoon-preview/${branch}`,
    required_contexts: [],
    transient_environment: true,
    auto_merge: false,
    description: 'Lagoon preview environment',
  })

  const environmentUrl = route.startsWith('http') ? route : `https://${route}`

  await githubRequest('POST', `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/deployments/${deployment.id}/statuses`, token, {
    state: 'success',
    environment_url: environmentUrl,
    description: 'Lagoon preview deployed',
  })

  console.log(`[notify-github-deployment] Posted deployment ${deployment.id} (${environmentUrl}) for PR #${pr.number}`)
}

main().catch((error) => {
  console.warn(`[notify-github-deployment] ${error.message}`)
})
