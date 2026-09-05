# Local patches

Patches kept in the repo rather than referenced by URL, because each one is a
reworked version of a patch or merge request that is still open upstream. Each
is a replacement for the work already on its issue, not a parallel fix.

**Each patch targets the exact dependency version `composer.lock` pins**, and a
patch that applies cleanly to one release is not portable to the next. Nothing
outside this directory should copy one without checking the version it was cut
against, stated per patch below.

Nothing here has been pushed to drupal.org yet; each is intended to become
the replacement patch/MR on its issue once it has proven itself here.

## `decoupled_router-3111456-resolve-language-from-path.patch`

Issue: [#3111456 Unable to resolve path on node in other language than default](https://www.drupal.org/project/decoupled_router/issues/3111456)

Decoupled Router negotiates the language from the request URL, but a decoupled
frontend calls `/router/translate-path?path=/es` with no prefix of its own, so
every path resolves as the default language.

Reworked from the patch at comment 66, rerolled against 2.0.5. The newer patch
at comment 103 was tried first and rejected: it hands the router the system
path with the language prefix stripped, which 500s **every aliased path in all
languages**. Comment 66 resolves the alias and puts the prefix back, leaving
the router the shape it already expected, and is the revision
umami.demo.druxtjs.org has run in production.

Still to do before offering upstream: `getNegotiator()` is declared on
`ConfigurableLanguageManagerInterface`, not the `LanguageManagerInterface` the
constructor type-hints. It is safe behind the `isMultilingual()` guard, but
injecting `language_negotiator` directly would type-check properly.

## `druxt-3273228-views-route-langcode.patch`

Issue: [#3273228 Add langcode to Views Decoupled Router integration](https://www.drupal.org/project/druxt/issues/3273228)

The companion to the above: with Decoupled Router resolving the language,
view routes (the front page among them) still resolved in the default language
and returned no langcode, so the frontend had nothing to keep the prefix from.

**Targets `drupal/druxt` 1.2.0**, the version `composer.lock` pins here. It does
not apply to 1.2.1 or later, and the reason is worth stating because the failure
is confusing: 1.2.1 added the same `use MethodNotAllowedException` import this
patch adds, so applying it produces a duplicate import and the file stops
parsing. 1.2.2 then rewrote most of `ViewsPathTranslatorSubscriber`, adding
`declare(strict_types=1)`, `#[\Override]` and `: void`, dropping the
`CacheableJsonResponse` guard, and moving route resolution to `ROUTE_NAME` with
`array_intersect_key` parameters. A backend on 1.2.2 needs a patch cut against
1.2.2, not this one. The fix is still unreleased: #3273228 did not make 1.2.2.

Reworked from [MR9](https://git.drupalcode.org/project/druxt/-/merge_requests/9),
which is at "needs work" for good reasons:

- it imports `MethodNotAllowedException` twice, which is fatal
- its `MethodNotAllowedException` catch lost its `return`, so execution carries
  on to an undefined `$match_info`
- it reinstates `if (!$match_info['view_id'])`, undoing the `isset()` guard
  added for #3467742 (MR14, also applied here)
- it leans on the parent's `getPathFromAlias()` and `$this->languageManager`,
  which only exist once the unmerged #3111456 patch is applied

This version keeps MR9's wider coverage (the route, the JSON:API entry point
and individual, and the `jsonapi_views` route all resolve against the
negotiated language) and does its own negotiation, so it stands up against an
unpatched Decoupled Router.

Applies on top of MR11 and MR14, in that order, matching `composer.json`.
