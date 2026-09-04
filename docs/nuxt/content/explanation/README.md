---
title: Concepts
weight: -10
description: 'Understanding-oriented explanations of how Druxt works and why, from the architecture and data flow to deployment shapes and the vocabulary of both sides of the stack.'
---

Concepts are **understanding-oriented**: they explain how Druxt works and the
reasoning behind its design, from the architecture and data flow to the
mental model the modules share. They deliberately avoid step-by-step
instructions. For doing, see the [How-to guides](/how-to).

## Topics

- [Architecture](/explanation/architecture): the fully decoupled Drupal and
  Nuxt.js request lifecycle, end to end.
- [The DruxtStore](/explanation/druxt-store): collections, resources, and
  how modules share state.
- [Decoupled routing](/explanation/routing): how Drupal routes map to
  frontend paths.
- [The schema system](/explanation/schemas): display modes as a component
  data source.
- [Component resolution](/explanation/component-resolution): wrapper
  discovery and the theme layer.
- [Request topology](/explanation/request-topology): which requests
  happen where, and why CORS only ever bites in the browser.
- [Deployment models](/explanation/deployment-models): three production
  shapes and the decision framework between them.
- [Drupal for Nuxt developers](/explanation/drupal-for-nuxt-developers):
  the backend vocabulary and tooling, in frontend terms.
- [Nuxt for Drupal developers](/explanation/nuxt-for-drupal-developers):
  the frontend concepts, mapped to the Drupal ideas they replace.
- [Support and versioning](/explanation/support-and-versioning): what a
  release number promises, and how deprecation works.
