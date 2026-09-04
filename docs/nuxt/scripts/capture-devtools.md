# Regenerating the Vue Devtools screenshots

The three `static/images/devtools-*.png` captures come from the
standalone Vue Devtools v6 app under a virtual display. The devtools UI
is an Electron window, so this is a documented procedure rather than a
one-command script; the coordinates below assume the window placed at
the origin at 1280x800.

Prerequisites: `Xvfb`, `xdotool` and ImageMagick's `import`
(`apt-get install xvfb xdotool imagemagick`), plus a quickstart with its
backend running.

1. Start a display and the devtools app (`ELECTRON_RUN_AS_NODE` must be
   unset; some tool environments export it):

   ```sh
   Xvfb :99 -screen 0 1600x1000x24 &
   npm i --no-save @vue/devtools@6
   env -u ELECTRON_RUN_AS_NODE DISPLAY=:99 ELECTRON_DISABLE_SANDBOX=1 \
     node_modules/.bin/electron node_modules/@vue/devtools/app.js &
   ```

2. Temporarily add the connection script to the quickstart's
   `nuxt/nuxt.config.js` head (revert afterwards), then run `nuxt dev`
   with the usual Node 17+ `NODE_OPTIONS` prefix and open the site in
   any browser or a headless playwright page:

   ```js
   head: {
     script: [{ src: 'http://localhost:8098' }],
   },
   ```

3. Open a content-rich page, so the tree and suggestion chain carry
   real substance: a recipe on an Umami backend
   (`/en/recipes/deep-mediterranean-quiche` against
   `https://demo-api.druxtjs.org`) gives a DruxtEntity with nine
   DruxtField children and a 14-entry `$theme` list.

4. Position the window and drive it with xdotool; capture each state
   with `import -window <window-id> <file>`:

   - `devtools-theme.png`: type `druxt` into "Find components", expand
     down to the recipe's DruxtEntity and its DruxtField children,
     select DruxtEntity, scroll the state pane to the `druxt` section
     and expand `$theme` so the full suggestion list is visible.
   - `devtools-scaffold.png`: hover an unregistered suggestion in that
     list so its save action shows.
   - `devtools-inspector.png`: open the DruxtJS inspector (the droplet
     icon in the left rail), select Connection details.

5. Crop each capture to its subject so the three images stay small and
   visually distinct (geometries assume the 1280x800 window at the
   origin):

   ```sh
   convert devtools-theme.png -crop 1095x690+185+55 +repage devtools-theme.png
   convert devtools-scaffold.png -crop 547x345+733+395 +repage devtools-scaffold.png
   convert devtools-inspector.png -crop 1280x235+0+25 +repage devtools-inspector.png
   ```

   Theme keeps the component tree and full state pane, scaffold is just
   the `$theme` list with the save action, inspector is the top strip
   with the rail, node list and connection details.

6. Optimize with `pngquant --quality 65-90` and revert the config edit.
