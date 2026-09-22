# Releasing

The packages publish to npm from `.github/workflows/release.yml`. Nobody runs `npm publish` by hand.

| Channel | npm dist-tag | When it publishes | What it is for |
| ------- | ------------ | ----------------- | -------------- |
| Development | `dev` | Every push to `develop` with a pending changeset | Trying unreleased work on a real site |
| Stable | `latest` | When you merge the pull request that versions the packages | Everyone else |

## Development releases

A push to `develop` cuts a snapshot of every package with a pending changeset, and of every package that depends on one. Almost everything depends on `druxt`, so a change to the core republishes the whole set.

A snapshot version reads `0.24.1-dev.20260920004838`: the version the pending changesets add up to, then the tag and a timestamp. Each package pins its sibling packages to the exact snapshot published beside it. One install brings in one coherent set:

```bash
npm install druxt-site@dev
```

Nothing is committed, no git tag is made, and `latest` does not move.

To use one on a site, see [Use a development release](https://druxtjs.org/how-to/use-development-releases). It also explains how to keep one copy of `druxt` installed.

## Stable releases

1. Merge pull requests that carry changesets. See [Changesets](CONTRIBUTING.md#changesets).
2. The workflow opens a pull request titled `chore(release): version packages`, and keeps it up to date. It holds the version bumps and the changelog entries.
3. Merge that pull request when the release is ready. This is the release decision.
4. The push that follows publishes each new version to `latest`. It also pushes a `name@version` tag for each one, with a GitHub Release built from that version's changelog section.
5. Merge `develop` into `main`.

## Build and publish jobs

Each channel runs as a build job followed by a publish job.

| Job | Runs repository code | Can publish to npm |
| --- | -------------------- | ------------------ |
| Build | Yes, install scripts included | No |
| Publish | No, it checks out nothing | Yes |

The build job ends by packing tarballs, and the publish job hands those tarballs to npm. A pull request rehearses the build job only, so code in a pull request never runs with publishing rights.

## The pre-publish gate

`yarn release:check` runs before every publish, on both channels. It refuses a release set when:

- a dependency uses a specifier that only resolves in this repository, such as `workspace:` or `link:`
- an internal range does not include the sibling version in this release
- a package depends on a private sibling
- a version is at or below the one npm already has
- an entry in a package's `files` was not built

`yarn release:check:test` runs its tests.

## One-time setup

Publishing uses npm trusted publishing, so there is no npm token to store or rotate. Until the setup is complete the workflow stops after packing: the tarballs it would have published are attached to the run as an artifact, and nothing reaches npm.

1. On npmjs.com, open each published package, then **Settings**, then **Trusted publisher**. Choose GitHub Actions, and enter the organization `druxt`, the repository `druxt.js` and the workflow filename `release.yml`. Leave the environment empty. Under **Allowed actions**, tick **Allow npm publish**: the workflow publishes directly, and a publisher limited to staged publishing refuses it.
2. Create a GitHub App for the organization with read and write access to **Contents** and **Pull requests**, and install it on this repository. Store its ID as the repository variable `RELEASE_APP_ID` and its private key as the secret `RELEASE_APP_PRIVATE_KEY`. GitHub doesn't run checks on a pull request opened with the workflow's own token, and `develop` requires them.
3. Set the repository variable `NPM_PUBLISH` to `true`.

A package that does not exist on npm yet cannot name a trusted publisher. Publish its first version by hand, then complete step 1 for it.
