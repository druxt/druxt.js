---
title: Deploy a static site
weight: 3
description: 'Generate the site and host the output on a static host or CDN, with Netlify as the worked example.'
---

> **Before you start:** read [Deployment
> models](/explanation/deployment-models) to confirm static is your
> model. The backend must be reachable from wherever the build runs,
> and from visitors' browsers once deployed.

`nuxt generate` renders every page to plain files in `dist/`. Any static
host serves them; this guide uses Netlify for the worked example, and
every step has an equivalent on Vercel, GitHub Pages or a plain web
server.

One thing static hosting does not change: **the deployed site still
talks to Drupal.** Route lookups on client-side navigation, forms and
authenticated content are live browser requests, so the backend you generate
against must stay reachable from visitors' browsers, with
[CORS configured](/how-to/configure-cors). Generating a site that needs
no backend at all is the [fully static
model](/explanation/deployment-models#the-three-models), a deliberate
configuration of its own.

## Generate the site locally first

Prove the build before involving a host. Set Nuxt's target to `static`
(`target: 'static'` in `nuxt.config.js`, or the `NUXT_TARGET` variable
where the project reads one, as the quickstart does), then:

```sh
npx nuxt generate
npx serve dist
```

Check the output before deploying:

- **Every route you expect is in `dist/`.** The generator crawls links
  from the pages it renders, so a page no link points at is not
  generated. List extra routes explicitly if you need to:

  ```js
  import { DruxtClient } from 'druxt';

  export default {
    generate: {
      fallback: '404.html',
      async routes() {
        const druxt = new DruxtClient(process.env.BASE_URL);
        const collections = await druxt.getCollectionAll('node--article', {
          'fields[node--article]': 'path',
        });
        return collections
          .flatMap((collection) => collection.data)
          .map((entity) => entity.attributes.path.alias)
          .filter(Boolean);
      },
    },
  };
  ```

- **The 404 fallback exists.** `generate.fallback: '404.html'` writes
  the not-found page where static hosts expect it. This replaces the
  default `200.html` single-page-app fallback; with every route
  generated, you will not miss it.

If the build fails reaching Drupal, see
[the build-failure entry in Troubleshoot common issues](/how-to/troubleshooting#the-build-fails-reaching-the-backend-econnrefused-timeouts-400s).

## Node version

Nuxt 2 builds cleanly on Node 16. On Node 17 or later, set the OpenSSL
legacy provider in the build command:

```sh
NODE_OPTIONS=--openssl-legacy-provider nuxt generate
```

Set the host's Node version explicitly (an `.nvmrc` file, or the host's
`NODE_VERSION` setting) so builds do not move when the host's default
changes.

## Deploy with the Netlify UI

1. Push the project to a git host and choose **Add new site → Import an
   existing project** in Netlify.
2. Build command: `npm run generate` (prefix with the `NODE_OPTIONS`
   flag above if building on Node 17+). Publish directory: `dist`.
3. Add the environment variables the build needs, at minimum `BASE_URL`
   pointing at a Drupal the **build machine** can reach. See
   [Environment variables](/how-to/environment-variables).
4. Deploy. Netlify rebuilds on every push to the production branch.

## Deploy with the CLI

The same, scriptable:

```sh
npm install --global netlify-cli
netlify init
NODE_OPTIONS=--openssl-legacy-provider npm run generate
netlify deploy --prod --dir=dist
```

## Deploy to GitHub Pages

When the project already is a GitHub repository, Pages needs nothing
outside GitHub. The gotchas to handle first are both specific to Pages:

- A **project page** serves from `https://<user>.github.io/<repo>/`, a
  subpath the build must know about. Set the router base and asset path
  before generating:

  ```js
  export default {
    router: { base: '/<repo>/' },
    build: { publicPath: '/<repo>/_nuxt/' },
  };
  ```

  A **user page** (a repository named `<user>.github.io`) serves from
  the domain root and skips this entirely.

- Pages serves `404.html` for unknown routes, so the
  `generate.fallback: '404.html'` setting from above is already right.

Then publish the generated output to the `gh-pages` branch:

```sh
npx gh-pages -d dist
```

Enable Pages for the repository (Settings → Pages → deploy from the
`gh-pages` branch), and the site serves at the URL above. For rebuild
automation, a GitHub Actions workflow that runs the generate and the
`gh-pages` push on each push to your default branch replaces the manual
command.

## After the first deploy

- Add your new frontend origin to the backend's
  [CORS `allowedOrigins`](/how-to/configure-cors); the
  [proxy](/how-to/proxy) is not available on a static host.
- Content changes need a rebuild. Trigger one from Drupal with a build
  hook (most static hosts issue a URL that starts a build when POSTed),
  or on a schedule.
- Redirects managed in Drupal's redirect module resolve through the
  router at request time only on served pages; a static host needs them
  exported to its own redirect configuration.

## Where to go next

- [Deploy your site](/tutorials/deploy-your-site): the same journey as a
  tutorial, starting from the quickstart.
- [The deployment models overview](/explanation/deployment-models): what
  static does and does not give you.
