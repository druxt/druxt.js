---
title: Drupal for Nuxt developers
weight: -8
description: 'The Drupal vocabulary, tools and commands the rest of these docs assume, explained for developers coming from the JavaScript side.'
---

Druxt puts a Nuxt frontend on a Drupal backend, so building a Druxt site
means running Drupal and its tooling without being a Drupal developer.
This page covers the concepts and commands the rest of these docs use, in
frontend terms. If you come from Drupal instead, read
[Nuxt for Drupal developers](/explanation/nuxt-for-drupal-developers).

## What Drupal does in a Druxt project

Drupal is the content backend. Editors create and structure content in its
admin UI, and Druxt reads that content over
[JSON:API](https://www.drupal.org/docs/core-modules-and-themes/core-modules/jsonapi-module),
a REST API included in Drupal core. You will configure Drupal and run its
CLI, but you will not write PHP: Druxt replaces the layer a Drupal
developer would normally build.

## The vocabulary

The terms these docs use, and the closest frontend concept for each:

| Drupal term           | What it is                                                                                 | Closest frontend concept                                                       |
| --------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Entity                | Any piece of stored content or configuration                                               | A record, or a typed object                                                    |
| Node                  | A content entity, such as a page or an article                                             | A CMS "post"                                                                   |
| Content type (bundle) | A node's type, defining its fields                                                         | A schema or interface                                                          |
| Field                 | One property on a content type                                                             | A typed property                                                               |
| Display mode          | A stored choice of which fields render, and how                                            | A view model; Druxt turns these into [component schemas](/explanation/schemas) |
| Block                 | A reusable fragment placed in a region of the page                                         | A component instance in a layout slot                                          |
| Menu                  | An editable navigation tree                                                                | Navigation data, editor-owned                                                  |
| View                  | A configurable content query with its own display                                          | A saved query plus its list component                                          |
| Module                | An installable extension (the [Druxt module](https://www.drupal.org/project/druxt) is one) | An npm package or Nuxt module                                                  |
| Permission            | A grant checked per role, per operation                                                    | Route/API authorization                                                        |
| Machine name          | The stable ID of a thing, distinct from its human label                                    | A slug or key                                                                  |

The one that matters most to Druxt is the display mode: Druxt reads
display modes as schemas and resolves Vue components from them, so a
change an editor makes in the Drupal admin UI changes what the frontend
renders. [The schema system](/explanation/schemas) explains this end to
end.

## Composer

[Composer](https://getcomposer.org) is PHP's npm. `composer.json` plays
the role of `package.json`, `composer.lock` the role of the lock file, and
`composer require drupal/druxt` the role of `npm install druxt`. Drupal
modules install with Composer and are then **enabled** in Drupal: install
puts the code on disk, enable turns it on for the site. That second step
has no npm equivalent, and forgetting it is a common early stumble.

## drush, Drupal's CLI

[drush](https://www.drush.org) is Drupal's command-line tool, installed
per project with `composer require drush/drush`, the way a JS project
carries its own CLI in `devDependencies`. When the backend runs in a
container, prefix the command: `ddev drush ...` under
[DDEV](https://ddev.readthedocs.io).

The commands these docs use:

| Command                                     | What it does                                               |
| ------------------------------------------- | ---------------------------------------------------------- |
| `drush pm:enable <module> -y`               | Enables an installed module                                |
| `drush role:perm:add <role> '<permission>'` | Grants a permission to a role                              |
| `drush cache:rebuild`                       | Rebuilds Drupal's caches, needed after config file changes |
| `drush config:set <name> <key> <value>`     | Sets one configuration value                               |
| `drush user:login` (`uli`)                  | Prints a one-time admin login link                         |

`drush cache:rebuild` earns special mention: Drupal caches aggressively,
and a config edit that "did nothing" usually just has not been picked up
yet. It is the Drupal reflex equivalent to restarting the dev server.

## Where configuration lives

Drupal configuration is split between the database and files:

- Most configuration is edited in the admin UI and stored in the
  database. It can be exported to YAML for version control.
- `sites/default/settings.php` holds per-environment settings, like
  `$settings` overrides and the database connection.
- `sites/default/services.yml` holds container-level settings,
  including CORS. See
  [Configure CORS in Drupal](/how-to/configure-cors).

There is no `nuxt.config.js` equivalent here: expect settings spread
over more than one place.

## What you can skip

Drupal's own rendering stack, Twig templates, the theme layer and render
arrays: Druxt replaces all of it with Vue, and you never write code
against Drupal's routing or form APIs either. Drupal itself keeps
owning paths and aliases; the frontend resolves them through the
Decoupled Router module, which is backend configuration, not code you write. If a Drupal tutorial
spends its time in `.theme` files and Twig, it is solving a problem Druxt
has already taken off your plate.

## Where to go next

- [Prepare the Drupal backend](/how-to/prepare-the-backend): the setup
  these concepts feed into.
- [The schema system](/explanation/schemas): display modes as the
  contract between editors and components.
- [Getting started](/tutorials/getting-started): a working site without
  installing Drupal by hand.
