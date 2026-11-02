# Vendored mock packages, temporary

These two tarballs are here so CI can install the Decoupled Drupal mock while
it is still unreleased. They are built from
[decoupled-drupal-mock](https://github.com/Decipher/decoupled-drupal-mock), and
they come out of this repository again the moment the packages are published:
`decoupled-drupal-mock` and `decoupled-drupal-mock-umami` become ordinary
version ranges in `package.json`, and this directory goes.

The engine's `./jest` and `./axios` entry points, which `test/__mocks__/axios.js`
imports, are not on the mock's release branch yet, which is the only reason a
built artefact is vendored rather than a published version named.

Do not merge this directory. It is here to let the pipeline run the swap and
to measure it.
