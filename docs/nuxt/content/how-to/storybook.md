---
title: Browse and develop components in Storybook
weight: -3
description: Zero-config Storybook with auto-generated stories fed by live Drupal data.
---

> Druxt provides zero-config, auto generated Storybook integration with live data.

![DruxtBlocks Storybook integration](/images/druxt-block-storybook.png)

> **Before you start:** this guide assumes a working Druxt site. See
> [Getting started](/tutorials/getting-started).

## Features

- Access to Druxt components, modules, stores and more within Storybook.
- Auto-generated stories based on live data.
- Support for **Blocks**, **Entities**, **Menus** and **Views**.

---

## Set up Storybook

1. Install the [Nuxt Storybook module](https://storybook.nuxtjs.org).

   ```sh
   npm i -D @nuxtjs/storybook @storybook/addon-docs
   ```

2. Run Storybook:

   ```sh
   npx nuxt storybook
   ```

---
