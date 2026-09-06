# Drupal backend

This directory contains an example Drupal backend repository, set up for
Druxt, paired with `docs/nuxt` and `examples/druxt-site` for local
development and e2e testing.

## Get started (PHP + SQLite, no Docker)

```bash
cd docs/drupal
.devtools/assemble    # Install Composer dependencies
.devtools/provision   # Install the site: SQLite + Tome import of committed config/content
.devtools/start       # Start the PHP built-in development server
```

Or via `make` (see `Makefile`):

```bash
make build   # assemble + provision + start
make stop
make reset   # wipe the throwaway database and stop the server
make info    # read-only summary of the current environment (alias: describe)
make login   # one-time login link
make debug   # restart the server with Xdebug enabled
```

Requires PHP and Composer only — no Docker. Note: as of this writing, the
committed `composer.lock` needs **PHP 8.2 or 8.3** (`lcobucci/clock`, a
transitive dependency of `simple_oauth`, doesn't support 8.4 yet), which is
why CI pins `8.3` rather than the workspace's usual `8.4` — see
`packages/druxtjs/AGENTS.md`. If your `assemble` run reports a missing
`sodium` extension, it's safe to install with
`composer install --ignore-platform-req=ext-sodium`: `simple_oauth` isn't an
enabled module on this site, so the JWT/sodium requirement it pulls in is
never actually exercised.

See `.devtools/README.md` (or the comments in each script) for how this
works and why it's built the way it is — in the spirit of
[AlexSkrypnyk/drupal_extension_scaffold](https://github.com/AlexSkrypnyk/drupal_extension_scaffold).

## Patches

Two, both unreleased upstream fixes for the same problem: a decoupled frontend
asks the router to translate `/es`, the request carries no language prefix of
its own, and everything resolves in the default language.

| Project | Issue | Reference |
| ------- | ----- | --------- |
| decoupled_router | [#3111456](https://www.drupal.org/i/3111456) | merge request 35 diff |
| druxt | [#3273228](https://www.drupal.org/i/3273228) | merge request 9 diff |

**Both are referenced as merge request diffs on purpose, not vendored.** This
backend is a dogfooding site: it should track what those branches actually do,
so a change upstream shows up here and can be fed back to the issue rather than
being frozen out by a local copy. Every reference has the same exit, which is
the issue landing in a release; when that happens, drop the patch and raise the
version constraint.

The cost is worth knowing. A merge request diff is regenerated on every push to
its branch, and this project runs `cweagans/composer-patches` **1.x**, which
records no patch hashes. A re-cut patch that no longer applies still fails
loudly. A re-cut patch that *does* apply and now behaves differently lands
silently and the build stays green. That is the accepted trade for dogfooding,
not an oversight.

### Gotcha: Tome auto-exports on entity/config save

Tome watches entity and config save operations and writes changes straight
to `content/*.json` / `config/sync/*.yml` as they happen — not just on an
explicit `drush tome:content-export`. In CI this is invisible (the checkout
is thrown away after the job), but in a persistent local checkout, running
`provision` **will** leave real file changes behind (a regenerated UUID on
some config entity, a stray new export, etc.). Review `git status` after a
local `provision` run and discard anything that isn't an intentional change
before committing. `config/sync/core.extension.yml`'s `sqlite: 0` line is
expected and should always be discarded — `provision` writes it fresh every
run; it must never be committed.
