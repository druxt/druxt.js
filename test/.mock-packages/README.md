# Vendored mock packages, temporary

These two tarballs are here so CI can install the Decoupled Drupal mock while
it is still unpublished. They are built from
[decoupled-drupal-mock](https://github.com/Decipher/decoupled-drupal-mock), and
they come out of this repository again the moment the packages reach npm:
`decoupled-drupal-mock` and `decoupled-drupal-mock-umami` become ordinary
version ranges in `package.json`, and this directory goes.

Nothing is missing from the mock itself. The `./jest` and `./axios` entry
points `test/drupal.js` reads are on its default branch, and a built artefact
is vendored only because neither package has been released.

## The filename carries the commit, and has to

Yarn's mirror keys a `file:` dependency by its **path**, not by its contents,
and the version here never moves off `1.0.0-alpha.0`. Rebuilding a tarball and
copying it over the old one therefore installs the old one, from
`$(yarn config get globalFolder)/cache`, with no warning: the lockfile checksum
matches, the cache entry is rebuilt with the same name, and the stale package
reaches `node_modules`. Deleting the project's `.yarn/cache` entry is not
enough, because the mirror refills it.

So each tarball is named after the commit it was built from. A rebuild changes
the path, which changes the locator, which is the only thing Yarn will treat as
a new dependency.

After any rebuild, check that the new code actually arrived rather than
assuming it did. Something only the new build has is the honest test, for
instance:

```sh
node -e "console.log(Object.keys(require('decoupled-drupal-mock/package.json').exports))"
```

Do not merge this directory. It is here to let the pipeline run the swap and to
measure it.
