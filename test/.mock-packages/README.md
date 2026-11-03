# Vendored preset, temporary

The engine is an ordinary dependency now:
[`decoupled-drupal-mock`](https://www.npmjs.com/package/decoupled-drupal-mock)
is on npm, pinned to the exact prerelease rather than a range, so a suite that
passes here passes everywhere until the pin moves on purpose.

Its preset is not published yet, so
`decoupled-drupal-mock-umami-<commit>.tgz` stays here, built from
[decoupled-drupal-mock](https://github.com/Decipher/decoupled-drupal-mock) at
the commit the filename names. It becomes a version range and this directory
goes the moment the preset reaches npm.

## The filename names the commit, and has to

Yarn's mirror keys a `file:` dependency by its **path**, not by its contents,
and the version here never moves off `1.0.0-alpha.0`. So rebuilding a tarball
and copying it over the old one installs the old one, from
`$(yarn config get globalFolder)/cache`, with no warning: the lockfile checksum
matches, the cache entry is rebuilt with the same name, and the stale package
reaches `node_modules`. Deleting the project's `.yarn/cache` entry is not
enough, because the mirror refills it.

So the tarball is named after the commit it was built from. A rebuild changes
the path, which changes the locator, which is the only thing Yarn will treat as
a new dependency.

After any rebuild, check that the new code actually arrived rather than
assuming it did. Something only the new build has is the honest test, for
instance a key the older dump's manifest lacks:

```sh
node -e "console.log(require('decoupled-drupal-mock-umami/dump/manifest.json').format)"
```

Do not merge this directory. It is here to let the pipeline run the swap and to
measure it.
