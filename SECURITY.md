# Security Policy

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Report vulnerabilities through GitHub's private vulnerability reporting:

**[github.com/druxt/druxt.js/security/advisories/new](https://github.com/druxt/druxt.js/security/advisories/new)**

(Repo → **Security** → **Report a vulnerability**.)

If GitHub Security Advisories are unavailable, contact the maintainer directly via
the [druxt.org](https://druxtjs.org) community channels (Discord) and request a
private reporting path.

Include if possible:

- A description of the issue and its impact
- Steps to reproduce, or a proof-of-concept
- Affected versions (check the latest release on npm)
- Any suggested mitigation

You should receive an initial response within 72 hours. Coordinated disclosure is
appreciated — please give maintainers time to assess and patch before public
discussion.

## Supply-chain posture

- **GitHub Actions** used in `.github/workflows/*.yml` are pinned to floating
  majors for readability but **Rewritten by Renovate to SHA digests** on its next
  run (`renovate.json` → `pinDigests: true`). This binds CI runs to immutable
  action revisions.
- **GitLab CI** runs the `Security/Secret-Detection.gitlab-ci.yml` template on
  every pipeline (branch push and merge-request event); commits containing known
  secret patterns are blocked.
- **Dependency updates** arrive as a single grouped Renovate PR against `develop`,
  automerge-on-green for non-major non-frozen bumps; majors and build-stack
  boundary packages are frozen and handled manually. See `renovate.json`.
