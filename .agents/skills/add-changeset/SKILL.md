---
name: add-changeset
description: Writes the changeset that versions a druxt.js package change and becomes its changelog entry. Use when a change touches a published package under packages/, when a pull request is missing a changeset, or when asked whether a change needs a changeset or which version bump it needs.
---

# Add a changeset

A changeset is a Markdown file in `.changeset/` that names the packages a change affects, the bump each one gets, and the text of its changelog entry. [Changesets](https://github.com/changesets/changesets) reads it at release time.

## When one is needed

| Change                                                                                                  | Changeset |
| ------------------------------------------------------------------------------------------------------- | --------- |
| Source, behaviour or runtime dependencies of a published package (`packages/*/src`, its `package.json`) | Yes       |
| Tests, docs, CI, examples, `scripts/`, or the private `druxt-docgen` and `druxt-test-utils` packages    | No        |
| A fix for a bug that no released version has, because it arrived after the last release                 | No        |

To check whether a release has a bug, read the published package: `npm pack 'druxt-router@0.31.0'`, with the real package and version, downloads it, and its `dist/` is the code users run.

Merging a changeset to a release line publishes every pending package as a snapshot under the `dev` npm tag (`.github/workflows/release.yml`). Leave a changeset out of a change that does not affect a published package.

## Write it

Name the file after the change, in kebab case, such as `router-trailing-slash.md`. The frontmatter keys are npm package names (`druxt-router`, not `router`):

```markdown
---
'druxt-router': patch
---

fix(#412): a path with a trailing slash resolves to the same route as the path without one.

Sites that added a redirect to strip the slash can remove it.
```

- Use `patch` for a fix and `minor` for a feature. Every package is still `0.x`. For a breaking change, ask a maintainer which level to use and add a `BREAKING CHANGE:` line, which the changelog marks as breaking.
- List each published package whose behaviour changes, including a package that only changes because a dependency it uses did. Changesets does not always release dependents on its own.
- The first line becomes the changelog bullet. Start it with `type(#N):`, where `#N` is the GitHub issue, or the pull request when there is no issue. The changelog links it (`.changeset/changelog.cjs`). The type is `fix`, `feat`, `perf`, `refactor`, `docs` or `revert`, and `type(#N)!:` marks a breaking change, which is a `minor` on `0.x`.
- After the colon, write the sentence lowercase, or open with code in backticks. The changelog adds the capital.
- Say what is true for the site now. Don't open with "fix": it renders as "Fixed …". Later paragraphs are indented beneath the bullet, and a code block needs a language. A Markdown heading would cut the release's section short.
- A changeset that names several packages is copied into each of their changelogs. Write it about what they share. Naming a component from one of them, such as `DruxtMenu`, needs that package's name beside it, or a changeset of its own.
- Write for someone upgrading Druxt. Say what changed for them and what they can do now, with a code sample when there is a new option. Leave out internal function names and how the fix works.

`yarn changeset` prompts for the same details and writes a file with a random name. Either way works.

## Check it

`yarn lint:changesets` checks the rules above, and `--preview` prints each package's changelog section as the version pull request will write it. The prose lint covers `.changeset/` too. Run both before committing:

```bash
yarn lint:changesets --preview
yarn lint:prose
```

Commit the changeset with the change it describes.
