This directory contains scripts used for development. These can be used
locally and in the CI environment — no Docker required, just PHP,
Composer, and SQLite.

In the spirit of
[AlexSkrypnyk/drupal_extension_scaffold](https://github.com/AlexSkrypnyk/drupal_extension_scaffold)
— but for a full site checkout rather than a bare extension: there's no
`build/` directory or `composer create-project` step, since `docs/drupal`
already IS the site codebase.

| Script                  | Purpose                                                                                                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `assemble`              | Install Composer dependencies.                                                                                                                                                |
| `provision`             | Patch in the `sqlite` module, configure a throwaway SQLite database, `drush tome:install` the committed config/content, and clean up the Consumers module's default consumer. |
| `consumer-cleanup.php`  | Post-install drush script: delete every OAuth consumer except the committed Druxt consumer (see below).                                                                       |
| `image-derivatives.php` | Post-install drush script: pre-generate every image file x `druxt_*` image style derivative (see below).                                                                      |
| `start`                 | Launch the built-in PHP development server (docroot `web/`). Auto-discovers a free port, writes `.env`, and prints a one-time login link once the site is provisioned.        |
| `stop`                  | Stop the development server.                                                                                                                                                  |
| `info`                  | Print a read-only summary of the current environment (PHP/Drupal/Composer/Drush versions, webserver, database path).                                                          |
| `helpers.php`           | Shared PHP utilities (dotenv read/write, port discovery, drush wrapper, filesystem helpers).                                                                                  |
| `etc/php.ini`           | Minimal ini loaded via `PHPRC` by the `drush()` helper — see the comment in `helpers.php`'s `drush()` function for why.                                                       |

## Quick start

```bash
cd docs/drupal
.devtools/assemble
.devtools/provision
.devtools/start
```

Or via `make` (see the root `Makefile`):

```bash
make build   # assemble + provision + start
make stop
make reset   # wipe the throwaway database and stop the server
```

## Deliberate differences from the reference pattern

- **SQLite override lives in `settings.local.php`, not `settings.php`.**
  `docs/drupal/web/sites/default/settings.php` is tracked in git — writing
  a runtime-only DB override directly into it (as the reference pattern
  does on a project where that's an accepted trade-off) would mean every
  local `provision` run leaves a diff on a committed file. `settings.php`
  already had a commented-out `settings.local.php` include block; enabling
  it (a one-time, committed change) means `provision` only ever writes to
  the already-gitignored `settings.local.php`.
- **The `sqlite` module patch is additive and fails loudly if its anchor is
  missing.** `config/sync/core.extension.yml` already has `mysql: 0` (the
  MySQL driver module); `provision` only _adds_ `sqlite: 0`, alongside
  it, never removing `mysql`. If the expected anchor text isn't found, the
  script fails with an explicit error rather than silently skipping the
  patch or corrupting the file.
- **No custom-script extension point (`scripts/<prefix>-*.sh` hooks).** The
  reference pattern supports post-provision/start/stop hooks (used
  elsewhere for things like Cloudflare tunnels or OAuth consumer setup).
  `docs/drupal` handles its one current post-install need — OAuth consumer
  hygiene — with a single targeted script (`consumer-cleanup.php`) called
  directly by `provision`, rather than a generic hook mechanism. The
  `simple_oauth`-backed consumer is committed as Tome content
  (`content/consumer.*.json`), but the Consumers module's `hook_install()`
  also creates a 'Default Consumer' with a random UUID on every install;
  committing that would churn the content export forever, so `provision`
  deletes anything but the committed consumer. The OAuth keys live in the
  committed `keys/` directory, with paths injected via a `$config`
  override in `settings.php` (simple_oauth resolves key paths against the
  process working directory, which differs between the built-in server
  and drush). Revisit a hook mechanism only if more post-install steps
  appear.
- **Image derivatives are pre-generated, not requested on demand.** Core's
  image controller requires an `itok` token on derivative URLs that
  JSON:API never exposes, so the frontend apps link derivative paths
  directly (`/sites/default/files/styles/druxt_card_4_3/public/...`) and
  `provision` pre-builds every file x style pair via
  `image-derivatives.php`. Static serving (`.ht.router.php`, or any
  `try_files` webserver) returns the files without a token.
- **`drush()` routes through a custom `PHPRC`, not a `-d` flag.** Drupal
  installs/imports can exceed PHP's default 128M `memory_limit`, and
  `site-install` (called internally by `tome:install`) runs in its own
  child PHP process via Drush's `SiteProcess` — CLI `-d` flags on the
  parent process don't reach it, but environment variables (including
  `PHPRC`) do. See `etc/php.ini` and the comment in `helpers.php`.

## Environment variables

| Variable         | Default                           | Purpose                                                            |
| ---------------- | --------------------------------- | ------------------------------------------------------------------ |
| `WEBSERVER_HOST` | `127.0.0.1`                       | PHP built-in server bind host                                      |
| `WEBSERVER_PORT` | auto-discovered (8888+)           | PHP built-in server port                                           |
| `DB_FILE`        | `/tmp/druxtjs-drupal-site.sqlite` | SQLite database path                                               |
| `XDEBUG`         | unset                             | Set to any non-empty value to start the server with Xdebug enabled |
