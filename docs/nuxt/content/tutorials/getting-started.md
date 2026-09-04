---
title: Getting started with Druxt.js
weight: -9
description: From an empty machine to a running fully decoupled Drupal and Nuxt site.
---

In this tutorial you will set up a complete Druxt site (a Drupal 11 backend
and a Nuxt 2 frontend, connected by Druxt) running on your machine, and
publish your first piece of content through it.

You'll use:

- **The quickstart**: the maintained starter repository that wires Drupal,
  Nuxt and Druxt together for you.
- **The one-command setup**: provisions a local throwaway Drupal (SQLite)
  with Druxt and OAuth pre-configured.

No prior Druxt knowledge is assumed. If one half of the stack is new to
you, [Drupal for Nuxt developers](/explanation/drupal-for-nuxt-developers)
and [Nuxt for Drupal developers](/explanation/nuxt-for-drupal-developers)
fill in the other side's vocabulary. This tutorial works without them.

## Prerequisites

- [Node 16](https://nodejs.org): if you use [nvm](https://github.com/nvm-sh/nvm)
  or [mise](https://mise.jdx.dev), `nvm use` / `mise install` picks the pinned
  version for you.
- One of:
  - PHP 8.3 or newer with the `pdo_sqlite` extension and [Composer](https://getcomposer.org),
    or
  - [DDEV](https://ddev.readthedocs.io) (Docker). The steps below assume
    the local PHP path; for DDEV, follow the DDEV section of the
    [quickstart README](https://github.com/druxt/quickstart#readme) for
    setup, then rejoin at step 3.
- A [GitHub](https://github.com) account (to create a project from the
  template).

> If you'd rather watch the pieces being assembled by hand, the
> [quickstart repository](https://github.com/druxt/quickstart) README documents
> every step this tutorial automates.

## Step 1: Create your project

Use the **Use this template** button on
[github.com/druxt/quickstart](https://github.com/druxt/quickstart) to create
your own repository from the starter, then clone it locally.

If you prefer the terminal, `giget` does the same in one line:

```sh
npx giget@1 gh:druxt/quickstart#develop my-druxt-site
cd my-druxt-site
```

**Outcome:** you are inside your project root, and it contains a `drupal/`
directory (the backend) and a `nuxt/` directory (the frontend).

## Step 2: Set everything up

From the project root:

```sh
npm run setup
```

This one command:

1. installs the frontend dependencies,
2. provisions a fresh Drupal site with the Druxt module, Simple OAuth and an
   OAuth consumer (SQLite, throwaway),
3. starts the backend, and
4. writes `BASE_URL` and `OAUTH_CLIENT_ID` to `.env`.

**Outcome:** the setup script prints a series of `PASS` lines and ends with
the backend marked as running. Your `.env` file now contains a `BASE_URL`
pointing at `http://127.0.0.1:8888` (or the next free port; the script
picks one and prints it).

## Step 3: Start the frontend

```sh
npm run dev
```

**Outcome:** two services are now running:

| URL                                                      | What it is       |
| -------------------------------------------------------- | ---------------- |
| http://127.0.0.1:8888, or the port setup printed         | Drupal (backend) |
| http://localhost:3000, or the port `npm run dev` printed | Nuxt (frontend)  |

Open http://localhost:3000 (or the next free port, printed in the
terminal). The page you see is rendered by Nuxt. It's a
little empty: the backend has no content yet. That's the next step.

## Step 4: Create your first content

Log into Drupal without touching a password:

```sh
npm run login
```

**Outcome:** the command prints a one-time login link. Open it in your
browser for a Drupal admin session, logged in as the site administrator.

In the admin toolbar, go to **Content → Add content → Article**, give it a
title (such as `Hello Druxt`), and **Save**.

**Outcome:** the article page opens in Drupal, and the content list at
**Content** shows one published article.

## Step 5: See it on the frontend

Look at the URL of the article you just created in Drupal. It ends in
something like `/node/1`.

Now open the **same path on the Nuxt frontend**:
http://localhost:3000/node/1

**Outcome:** the article title and body render, but this page was not built
by Drupal's theming system. Drupal served the content as JSON:API data and
Nuxt rendered it.

## What you've got

A local fully decoupled site, and a set of commands to run it:

| Command         | What it does                                |
| --------------- | ------------------------------------------- |
| `npm run dev`   | Start both backend (if needed) and frontend |
| `npm run login` | Open a one-time Drupal admin login          |
| `npm run stop`  | Stop the local backend                      |
| `npm run reset` | Re-provision a fresh throwaway backend      |
| `npm run info`  | Show backend status and details             |

The moving parts, in one paragraph: `drupal/` is a standard Drupal 11 site
with the [Druxt module](https://www.drupal.org/project/druxt) installed and
the _access druxt resources_ permission enabled. `nuxt/` is a Nuxt 2 site
using the `druxt-site` module, which pulls layout, menus, blocks and content
from the backend. `.env` tells the frontend where to find the backend, and
is the only file you'd change to point the frontend at a different Drupal.

## Where to go next

- Keep learning: [Build a custom Druxt module](/tutorials/first-custom-module),
  the next lesson.
- Log a user in: [Add a login flow](/tutorials/authentication): the OAuth
  setup this command already provisioned, put to use.
- Put it online: [Deploy your site](/tutorials/deploy-your-site), the
  deployment lesson.
- Understand the machine you just started:
  [Architecture](/explanation/architecture).
- Start customizing the look: [Theme Druxt components](/how-to/theming).
- Browse what each package does: [Druxt modules](/modules).
- See finished Druxt sites running in production:
  [demo.druxtjs.org](https://demo.druxtjs.org).
- Something not working the way you expect? [Troubleshoot common
  issues](/how-to/troubleshooting).
