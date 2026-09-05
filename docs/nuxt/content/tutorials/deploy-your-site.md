---
title: Deploy your site
weight: -6
description: Generate the quickstart as static files, prove why the backend still matters, and put a working Druxt site on a live URL.
---

The [first tutorial](/tutorials/getting-started) ended with a site running
on your machine. This lesson takes the next step: generating the site as static files
and finishing with a working Druxt site on a public URL. It also proves
why the backend still matters.

## Prerequisites

- The [Getting started](/tutorials/getting-started) tutorial, completed,
  with its backend provisioned and running (`npm run info` shows its
  status).
- A [Netlify](https://www.netlify.com) account.
- Permission to install npm packages globally, and about half an hour.
  The generate runs are the slow part.

One constraint shapes the lesson. A Druxt site needs its backend even
after generating, because route lookups on navigation and live data are
browser requests. Your throwaway backend runs on your machine, where
the internet cannot reach it, so the live deploy in step 3 points at
the public Druxt demo backend instead. Your own article stays local for
now, and step 4 covers what publishing your own content takes.

## Step 1: Tell Nuxt what to generate

The quickstart's routes come from Drupal, so the static generator needs
a starting point to crawl from. Add this line to `nuxt/nuxt.config.js`,
just inside `export default {`:

```js
generate: { fallback: '404.html', routes: ['/'] },
```

`routes: ['/']` seeds the crawler with the homepage; it discovers the
rest by following links. `fallback: '404.html'` writes the not-found
page where static hosts expect it (this replaces the default `200.html`
single-page-app fallback).

Then find the `proxy` setting inside the `druxt` block and tie it to
the build target:

```js
proxy: {
  api: process.env.NUXT_TARGET !== 'static'
},
```

The proxy is server middleware that no static host can run. With this
line, development keeps the proxy, and the static build has the browser
talk to Drupal directly (the demo backend used later answers any
origin).

## Step 2: Generate locally and prove the dependency

Check the backend is up (`npm run info`), then generate from the project
root:

```sh
NUXT_TARGET=static npm run generate --prefix nuxt
```

(On Node 17 or later, prefix the command with
`NODE_OPTIONS=--openssl-legacy-provider`; Node 16, the tested version,
rejects that flag and does not need it. See
[Troubleshooting](/how-to/troubleshooting) for why.)

Nuxt renders your pages, your article included, into `nuxt/dist/` as
plain HTML, CSS and JavaScript. Serve it and click around:

```sh
npx serve nuxt/dist
```

Now stop the backend (`npm run stop`) and reload. The page you are on
still renders, and navigation breaks. Generated pages are baked files, but
moving between them still asks Drupal to resolve the route. That is the
dependency the rest of this lesson works around, and the reason step 3
uses a backend that browsers can reach.

Start the backend again for good measure: `npm run dev`, then Ctrl+C
once it is up (the frontend stops; the backend keeps serving, which is
what `npm run stop` is for).

## Step 3: Deploy against the public demo backend

The Druxt demo backend at `https://demo-api.druxtjs.org` is public,
answers browsers from any origin, and runs the Umami food-magazine demo
content. Pointing your frontend at it takes a theme change and an
environment override.

First, its blocks and menus belong to Drupal's `umami` theme, and a
Druxt frontend renders the block layout of whatever theme it is told
about. In `nuxt/nuxt.config.js`, find the `site` block and change its
`theme`:

```js
site: {
  theme: 'umami'
},
```

Second, generate against the demo backend. Passing `BASE_URL` on the
command line overrides `.env` for this run only, so nothing needs
editing back afterwards:

```sh
BASE_URL=https://demo-api.druxtjs.org NUXT_TARGET=static npm run generate --prefix nuxt
```

(The same Node 17+ `NODE_OPTIONS` prefix applies here.)

Expect the homepage, the language variants and the listing pages
(articles, recipes) this time, with the Umami menu rendered. Individual
articles and recipes are not crawled: the listings render their links
client-side, where the crawler cannot follow them. Deploy the output:

```sh
npm install --global netlify-cli@15
netlify login
```

(Newer Netlify CLI majors need Node 18 and later; 15 is the last line
that runs on the Node 16 this stack pins.)

```sh
netlify deploy --prod --dir=nuxt/dist
```

Answer the prompts to create a new site. The printed URL is a working
Druxt site on the internet: pages pre-rendered, menu live, navigation
resolving routes against the demo backend from your visitors' browsers.
If something fails, [Troubleshoot common
issues](/how-to/troubleshooting) covers the build and CORS failure
modes; if the demo backend itself is unreachable, the deploy still
serves its generated pages, and navigation degrades until it returns.

Change `theme` back to `olivero` (the quickstart's original value,
Drupal's default frontend theme) when you return to local work.

## Step 4: Publishing your own content

To put **your** content on that URL, your backend has to live somewhere
browsers can reach. The realistic options:

- **Host Drupal, keep the frontend static.** Any Drupal host works
  ([prepare the backend](/how-to/prepare-the-backend),
  [configure CORS](/how-to/configure-cors)); point `BASE_URL` at it,
  generate, deploy, rebuild when content changes. This is the most
  common production shape.
- **Host both halves as servers.** A node service renders live content
  next to hosted Drupal.
- **A databaseless backend.** Drupal can exist only at build time, its
  content exported to files with
  [Tome](https://www.drupal.org/project/tome), and the
  [quickstart-druxt-site-tome](https://github.com/druxt/quickstart-druxt-site-tome)
  starter is this shape. Freeing the result from any backend also means
  disabling the router middleware, covered under the fully static
  model.

[Deployment models](/explanation/deployment-models) compares the three
and hands off to the deploy guides.

## Where to go next

- Keep learning: [Build a custom Druxt module](/tutorials/first-custom-module),
  the final lesson.
- [Deployment models](/explanation/deployment-models): choose the shape
  for your real site.
- [Deploy a static site](/how-to/deploy-static): the production version
  of this lesson, with git-driven builds and rebuild hooks.
- [Prepare the Drupal backend](/how-to/prepare-the-backend): make a real
  Drupal site Druxt-ready.
- Back to [the tutorials index](/tutorials).
