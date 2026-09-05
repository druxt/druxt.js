# Local patches

Two patches, both for the same thing: a decoupled frontend asks the router to
translate `/es`, the request carries no language prefix of its own, and
everything resolves in the site's default language. Both fixes are written and
under review upstream but not in a release yet.

They are kept as files here rather than as URLs. A merge request diff is
regenerated on every push to its branch, and this project runs
`cweagans/composer-patches` **1.x**, which records no patch hashes, so a moved
branch would not be caught: the next `composer install` would fetch whatever
the diff said that day, apply it, and the build would stay green. A file in the
repository changes only when someone changes it.

**Each patch is cut against the exact version `composer.json` pins.** A patch
that applies to one release will not always apply to the next, so re-cut rather
than re-use when the pin moves. The base each was cut against is recorded below.

Both are snapshots of upstream work, not parallel fixes. The issue is the
source of truth; when either lands in a release, delete the patch here and
raise the version constraint instead.

## `decoupled_router-3111456-resolve-language-from-path.patch`

Issue: [#3111456 Unable to resolve path on node in other language than
default](https://www.drupal.org/project/decoupled_router/issues/3111456),
at *needs review*.

Decoupled Router negotiates language from the request URL, but a decoupled
frontend calls `/router/translate-path?path=/es` with no prefix of its own, so
every path resolves as the default language.

Taken from
[MR 35](https://git.drupalcode.org/project/decoupled_router/-/merge_requests/35),
reduced to the files a site needs at runtime: the two event subscribers and
`decoupled_router.routing.yml`. The merge request's own tests are not included,
because a consuming site does not run them.

- **Cut against:** `drupal/decoupled_router` **2.0.7**
- **Excludes:** `tests/`, `.cspell.json`

## `druxt-3273228-views-route-langcode.patch`

Issue: [#3273228 Add langcode to Views Decoupled Router
integration](https://www.drupal.org/project/druxt/issues/3273228),
at *needs review*.

The companion to the above. With Decoupled Router resolving the language, view
routes (the front page among them) still resolved in the default language and
returned no langcode, so the frontend had nothing to keep the prefix from.

Generated from the issue fork branch
`feature/3273228-views_route_langcode`, which is based on the 1.2.2 tag, so it
carries the 1.2.x fixes already released and adds only the langcode work.

- **Cut against:** `drupal/druxt` **1.2.2**
- **Fork head:** `36b63420310ba4566779f9b9222c6b745d60c688`
- **Touches:** `src/EventSubscriber/ViewsPathTranslatorSubscriber.php` only

Unlike the version this replaced, it does not depend on the #3111456 patch
being applied: it reads the prefix off the path via
`language.negotiation url.prefixes` rather than through
`getPathFromAlias()` and `$this->languageManager` on the parent, both of
which only exist on a patched Decoupled Router. The two patches are now
independent, and applying only one is a supported thing to do.

One limitation, recorded because it is easy to mistake for a fault: the
langcode is reported reliably, but the generated URLs carrying the prefix
could not be demonstrated in a kernel test, because `PathProcessorLanguage`
builds its processor list from the negotiator and a kernel test does not wire
that up. It works in a real request; two tests upstream skip with that stated
reason.
