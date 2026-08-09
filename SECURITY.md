# Security Policy

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Report vulnerabilities through GitHub's private vulnerability reporting:

**[github.com/druxt/druxt.js/security/advisories/new](https://github.com/druxt/druxt.js/security/advisories/new)**

(Repo → **Security** → **Report a vulnerability**.)

If GitHub Security Advisories are unavailable, contact a maintainer privately via
Discord DM — do **not** post vulnerability details in public channels. Use the
[druxt.org](https://druxtjs.org) community Discord to find a maintainer, then
continue the conversation in direct messages.

Include if possible:

- A description of the issue and its impact
- Steps to reproduce, or a proof-of-concept
- Affected versions (check the latest release on npm)
- Any suggested mitigation

You should receive an initial response within 72 hours. Coordinated disclosure is
appreciated — please give maintainers time to assess and patch before public
discussion.

## Supply-chain posture

- **GitHub Actions** used in `.github/workflows/*.yml` are pinned to full commit
  SHAs, not floating tags. Renovate keeps those pins current
  (`renovate.json` → `pinDigests: true`) by rewriting the committed SHAs when
  newer action releases arrive. The committed SHAs are immutable between Renovate
  runs, so CI executes exactly the action revisions that were reviewed.
- **GitLab CI** runs the `Security/Secret-Detection.gitlab-ci.yml` template on
  every pipeline (branch push and merge-request event); commits containing known
  secret patterns are blocked.
- **Dependency updates** arrive as a single grouped Renovate PR against `develop`,
  automerge-on-green for non-major non-frozen bumps; majors and build-stack
  boundary packages are frozen and handled manually. See `renovate.json`.
