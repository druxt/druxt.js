# Design brief: druxt-site

The vanilla Druxt integration example: the full `druxt-site` module stack
(`druxt-site`, `druxt-router`, `druxt-entity`, `druxt-blocks`, `druxt-menu`,
`druxt-views`, `druxt-breadcrumb`, `druxt-schema`) rendering the Umami demo
content with **no CSS framework at all** — one hand-written wireframe
stylesheet. Where the three themed examples (`druxt-daisyui`,
`druxt-tailwind`, `druxt-bootstrapvue`) demonstrate Druxt underneath a
design system, this one demonstrates that the Drupal-driven markup carries
enough structure to be styled directly: element selectors plus the
attributes Druxt components leak onto their root nodes (region `name`, view
`mode`, field `errors`), no utility classes required.

## Mood board

- The design specimen's "System" screen (screen 00) in
  `openspec/changes/druxtjs-examples-suite/design/Druxt Site Specimen.dc.html`
  — the authoritative source for every value below.
- Classic print wireframes / editorial gravure: ink on paper, rules instead
  of boxes, one typeface, one accent (the logo). The restraint is the
  demonstration — CSS "only sets spacing and rules".
- The Umami theme's own logo.svg, shipped with the Drupal profile —
  deliberately the only colour on the page; nothing in the CSS was added
  for it.

## Color palette

| Token        | Value     | Use                                                    |
| ------------ | --------- | ------------------------------------------------------ |
| `--ink`      | `#111110` | Text, region boundary rules, active interactive states |
| `--muted`    | `#6f6f6a` | Mono labels, metadata, breadcrumbs, placeholder text   |
| `--rule`     | `#cfcfc9` | Panel/checkbox outer borders, pager boxes, bar track   |
| `--hairline` | `#e4e4de` | Item separators inside a list (rows, ingredients, nav) |
| `--paper`    | `#fbfbf9` | Page background                                        |

No accent, no palette beyond these five inks and papers. Interactive
elements invert (ink fill, white text) instead of taking a colour.

## Typography

System font stack only (`-apple-system, BlinkMacSystemFont, 'Segoe UI',
Roboto, 'Helvetica Neue', Arial, sans-serif`) with the OS monospace stack
(`ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`) for anything
that reads as data: labels, metadata lines, breadcrumbs, JSON payloads,
pagers, chip text, percentages.

| Size                              | Weight | Use                                                         |
| --------------------------------- | ------ | ----------------------------------------------------------- |
| 44px / 1.05, -0.02em              | 500    | Page titles (`h1`)                                          |
| 28px / 1.15, -0.01em              | 500    | Section headings, panel titles (`h2`)                       |
| 20px / 1.2–1.25                   | 500    | Card titles, row titles, sub-headings (`h2` in cards, `h3`) |
| 16px / 1.6                        | 400    | Body copy, capped at a 66ch measure                         |
| 13–15px / 1.2–1.6                 | 400    | Nav, form inputs, dense UI text                             |
| 11px mono / 1, +0.14em, uppercase | 500    | Labels — field labels, breadcrumb is 12px mono              |

## Spacing system

An 8px baseline with steps 8 / 16 / 24 / 40 / 64 / 96 (`--space-1`…`--space-6`
as CSS custom properties). Horizontal page gutter is a fixed 32px. Region
boundaries are 1px `--ink`; item separators inside a region are 1px
`--hairline`. No radius, no shadow, no fill except ink on interactive
elements.

## Component specs

| Component          | Hook                                                    | Notes                                                                                                                                                                                        |
| ------------------ | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Block regions      | `div[name="…"]`                                         | Umami regions render in source order; each gets an ink top rule + 32px gutters. `pre_header` is compact (12px), `breadcrumbs` adds a hairline bottom rule.                                   |
| Entity cards       | `a[href]:has(> h2)`                                     | The default `CardCommon` markup (`a > h2 + image`) becomes a bordered index row: 96px square thumbnail left, title right, hairline between rows — turning the stock card grid into an index. |
| Fields             | `div[errors] > strong` / `> div`                        | Field labels render as `strong` and take the 11px mono uppercase treatment; consecutive values (multi-value fields like ingredients) get hairline separators.                                |
| Views pager        | `div[mode] ul li`                                       | Mono 13px in 1px rule boxes; hover promotes to ink border.                                                                                                                                   |
| Main menu          | `div[name="header"] li a`                               | Active trail marked by an ink bottom border rather than colour.                                                                                                                              |
| Language block     | `div[name="pre_header"] li`                             | Inline mono links, 12px; pending state renders an empty div so the header doesn't shift.                                                                                                     |
| Reactive filtering | `pages/examples/reactive-filtering.vue` (scoped styles) | The one page with bespoke components: mono chips (active = ink fill), 8px coverage bar (ink fill on rule track), row grid `72px / 1fr / 200px / 96px`.                                       |

## Page layouts

- **`/` (frontpage)**: `DruxtSite` wildcard layout — regions in source
  order: pre_header (languages), banner_top (hero banner + promoted view),
  header (main menu), breadcrumbs, content, footer (promo + disclaimer).
- **`/en/recipes`**: `DruxtView[recipes]` card mode rendered as the bordered
  index described above.
- **`/en/recipes/:slug`**: default schema-driven entity rendering; field
  labels and ingredient lists pick up the field rules above.
- **`/en/contact`**: `DruxtEntityForm[contact_message--feedback]` — inputs
  styled generically (label above, 1px rule border, no radius) so any field
  type the form module emits lands on the same rhythm.
- **`/examples/*`**: functional pattern pages, untouched by the wireframe
  pass except for the shared type/spacing system. `/examples/debug` shows
  JSON payloads in mono inside rule-bordered panels.

Every route above except `/` and `/examples/*` requires the `/en` langcode
prefix to resolve on this backend.

## Responsive breakpoints

None — the wireframe is a single-column flow; grids degrade naturally
(`aspect-ratio` images, auto-fill card grid). Adding breakpoints is
explicitly out of scope: the example demonstrates structure-over-surface,
not a production theme.
