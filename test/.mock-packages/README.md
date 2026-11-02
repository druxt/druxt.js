# Vendored mock packages, temporary

These two tarballs are here so CI can install the Decoupled Drupal mock while
it is still unpublished. They are built from the default branch of
[decoupled-drupal-mock](https://github.com/Decipher/decoupled-drupal-mock), at
the commit `BUILT_FROM.txt` names, and they come out of this repository again
the moment the packages reach npm: `decoupled-drupal-mock` and
`decoupled-drupal-mock-umami` become ordinary version ranges in `package.json`,
and this directory goes.

Nothing is missing from the mock itself any more. The `./jest` and `./axios`
entry points `test/drupal.js` reads are on its default branch, and a built
artefact is vendored only because neither package has been released.

Do not merge this directory. It is here to let the pipeline run the swap and to
measure it.
