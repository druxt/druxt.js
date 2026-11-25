# @druxt/devtools

The Druxt development tools. A model holds what a page's Druxt modules did. The `<druxt-devtools>` custom element and a console summary show it. The package has no Vue, Nuxt or h3 dependency, so any host can use it.

Druxt's Nuxt module embeds the element in a Nuxt DevTools tab, and feeds Vue DevTools from the same model. Another host, such as a React or Next.js app, emits the same events and embeds the same element.

## Install

Add it to a Nuxt site as a dev dependency:

```sh
npm install --save-dev @druxt/devtools
```

Druxt finds it in development, and a production build has none of it.

It needs Node `^22.19.0`, `^24.11.0` or `>=26.0.0`.

## Quick start

A Nuxt site doesn't need any code: install the package, and Druxt does the rest. Another host creates a channel and reports events to it, and the element shows them:

```ts
import { createDruxtDevtools, defineDruxtDevtoolsElement } from '@druxt/devtools';

const devtools = createDruxtDevtools();

defineDruxtDevtoolsElement();
const tools = document.createElement('druxt-devtools');
document.body.append(tools);
tools.connect(devtools);

devtools.emit({ type: 'page', path: '/recipes' });
devtools.snapshot().page; // '/recipes'
```

## Exports

| Export                                        | What it does                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------------- |
| `createDruxtDevtools()`                       | Creates a channel, and the snapshot it keeps.                                    |
| `defineDruxtDevtoolsElement(window?)`         | Defines `<druxt-devtools>` in a window, and returns its class.                   |
| `watchDruxtDevtoolsSummary(channel, options)` | Prints a summary to the console. It returns a function that stops it.            |
| `summaryCounts(snapshot)`                     | Gets the counts in words, such as `4 defaults in use, 2 quiet errors`.           |
| `sectionData(section)`                        | Gets a module section's blocks as plain data.                                    |
| `groupMissing(modules)`                       | Groups the modules that render Druxt's default, by component.                    |
| `describeCandidate(component, candidates)`    | Describes the most specific candidate in words, such as `node · article · full`. |
| `splitStatus(summary)`                        | Splits `403: Forbidden` into its status and its detail.                          |
| `noteKey(note)`                               | Gets a note's key, or its kind when it has no key.                               |
| `moduleSectionKey(id)`                        | Gets the tab key of a module's section, `x-<id>`.                                |
| `druxtMonoMark(size?, fill?)`                 | Gets the Druxt mark in one colour, as SVG source.                                |
| `druxtTabIconSvg()`, `druxtTabIcon()`         | Get the tab icon, as SVG source or as a data URL.                                |
| `DRUXT_DEVTOOLS_SECTIONS`                     | The built-in sections: `missing`, `quiet`, `modules`, `requests`, `settings`.    |
| `DRUXT_DEVTOOLS_TAG`                          | The element's tag, `druxt-devtools`.                                             |
| `DRUXT_DEVTOOLS_SECTION_EVENT`                | The name of the element's event, `druxt-devtools-section`.                       |
| `DRUXT_MARK_PATHS`                            | The paths of the Druxt mark.                                                     |

## The model

`createDruxtDevtools()` returns a channel. A host reports to it, and a tool reads it.

| Method                            | What it does                                                              |
| --------------------------------- | ------------------------------------------------------------------------- |
| `emit(event)`                     | Reports an event to the snapshot and to every subscriber.                 |
| `subscribe(listener)`             | Listens for events. It returns a function that stops listening.           |
| `snapshot()`                      | Returns everything reported so far, as a copy.                            |
| `registerAction(action, handler)` | Offers an action. It returns a function that withdraws that registration. |
| `runAction(id)`                   | Runs an action's handler. It rejects when no action has that id.          |

Every event is JSON-serializable, so it can cross a frame or a process.

| Event                 | Payload                   | What it reports                                                |
| --------------------- | ------------------------- | -------------------------------------------------------------- |
| `page`                | `path`                    | The current page.                                              |
| `module:resolved`     | `module`                  | A module rendered with a wrapper of the site's own, or failed. |
| `module:missing`      | `module`                  | A module rendered Druxt's default output.                      |
| `module:removed`      | `id`                      | A module left the page.                                        |
| `module:note`         | `id`, `note`              | A module added a note about itself.                            |
| `module:note:removed` | `id`, `key`               | A note no longer applies.                                      |
| `module:restored`     | `id`, `component`, `key?` | A module took its data from a payload it did not fetch.        |
| `quiet`               | `error`                   | A quiet failure. A `summary` of `null` clears it.              |
| `request`             | `request`                 | A request, or an answer the store already held.                |
| `settings`            | `settings`                | The resolved settings, and where each came from.               |
| `section`             | `section`                 | A module adds or updates a section.                            |
| `section:removed`     | `id`                      | A module removes its section.                                  |
| `action`              | `action`                  | A module offers an action. `registerAction()` emits it.        |
| `action:removed`      | `id`                      | An action is withdrawn.                                        |
| `timeline`            | `event`                   | A labelled event beside the requests.                          |

The snapshot keeps what the events reported:

- A `page` event for another path starts that page's requests and timeline events afresh.
- The latest 500 requests are kept, and the latest 500 timeline events.
- A module keeps one note for each key. The key is the note's `key`, or its `kind`. A later note with the same key replaces it.
- A note that arrives before its module is held until the module reports.
- A `module:restored` event reaches the subscribers, and the snapshot doesn't record it.
- A request from a server render has the `page` it was made for. The Requests section names it, as `Server render of /recipes`. Core's development plugin reports a server render's requests only while the browser shows that page.

## The element

`defineDruxtDevtoolsElement(window)` defines `<druxt-devtools>` in a window, once. Each window has its own element registry, so pass the window to define it in, such as a DevTools frame's. The default is the current window.

The element is plain DOM in its own shadow root, and it styles itself there. Its sections are Missing wrappers, Quiet errors, Modules, Requests and Settings, then each section a module added.

| Attribute      | Default                           | Description                                                                       |
| -------------- | --------------------------------- | --------------------------------------------------------------------------------- |
| `section`      | `missing`                         | The section shown. It is a built-in section, or a module section's key, `x-<id>`. |
| `theme`        | The system's colour scheme        | `light` or `dark`.                                                                |
| `waiting-text` | `Waiting for the app to connect.` | The text shown before a host connects the element.                                |

| Property or method | Type                                    | Description                                                                         |
| ------------------ | --------------------------------------- | ----------------------------------------------------------------------------------- |
| `section`          | `string`                                | The `section` attribute.                                                            |
| `waitingText`      | `string`                                | The `waiting-text` attribute.                                                       |
| `createEndpoint`   | `string \| null`                        | Where the create action posts a file's request. `null` by default.                  |
| `openInEditor`     | `((file: string) => void) \| null`      | Opens a created file in the developer's editor. `null` by default.                  |
| `links`            | `{ wrappers?: string, quiet?: string }` | Documentation links. `wrappers` is Druxt's page on component resolution by default. |
| `connect(source)`  | Method                                  | Reads a channel, and renders again on each of its events.                           |
| `disconnect()`     | Method                                  | Stops reading the channel.                                                          |
| `render()`         | Method                                  | Renders now, without waiting for the next frame.                                    |

- `connect()` also takes a fixed snapshot: an object with only `snapshot()`. Without `subscribe`, the element doesn't update. Without `runAction`, it doesn't offer actions.
- When the section changes, the element dispatches a `druxt-devtools-section` event whose `detail` is `{ section }`. A host can use it to keep the section in the tab's URL.
- A module that renders Druxt's default output is listed with the wrapper names it looked for. With `createEndpoint`, the element offers to create one of its `templates`, and posts the template's `request` as JSON. Without it, the element shows the file's path and starter.
- A site's own `--druxt-ink`, `--druxt-surface`, `--druxt-accent`, `--druxt-danger`, `--druxt-success`, `--druxt-focus`, `--druxt-font`, `--druxt-mono`, `--druxt-radius` and `--druxt-space` custom properties change the element's look.

## The console summary

`watchDruxtDevtoolsSummary(channel, options)` prints what the tools would show, once the page settles.

| Option    | Type      | Default   | Description                                                                        |
| --------- | --------- | --------- | ---------------------------------------------------------------------------------- |
| `open`    | `string`  | None      | The tool the developer opens, such as `Nuxt DevTools > Druxt`.                     |
| `console` | `Console` | `console` | Where it prints. It needs `info`, `group`, `groupCollapsed`, `groupEnd` and `log`. |
| `delay`   | `number`  | `1000`    | How long the page must go without an event before it prints, in milliseconds.      |

- With `open`, it prints one line that points to that tool, such as `Druxt: 4 defaults in use. Open Nuxt DevTools > Druxt.`. The line prints again only when the counts change.
- Without `open`, each page gets a collapsed group, `Druxt: 4 defaults in use on /path`. It holds each default's candidate names and the modules' sections.
- Without `open`, the quiet errors get an open group, `Druxt: 2 quiet errors on /path`, only when there are any.
- The groups print again for a new page, a new count, new section data, or a quiet error whose status or detail changed.
- Nothing prints when there is nothing to report.

## Module extensions

A host can show more than the built-in sections. Each extension is plain data on the channel, so the element, Vue DevTools and the console summary all show it:

- A `section` event adds a tab. Its blocks are `pairs`, `table` or `tree` data. The element renders the data, and a module never supplies markup.
- A `timeline` event adds a labelled event beside the requests.
- `registerAction(action, handler)` offers a button in the section the action names. The handler runs in the host, and `runAction(id)` runs it. It returns a function that withdraws that registration. The function does nothing once the same id is registered again.

```ts
devtools.emit({
  type: 'section',
  section: { id: 'route', label: 'Route', blocks: [{ type: 'pairs', items: { path: '/about' } }] },
});
devtools.emit({
  type: 'timeline',
  event: { id: '1', label: 'views refetch', detail: 'filter changed', time: 120 },
});
devtools.registerAction(
  { id: 'views:clear', label: 'Clear the view cache', section: 'route' },
  () => clearCache(),
);
```

A Druxt module uses `useDruxtDevtools()` from `@druxt/core` instead. It calls these for the module in development, and does nothing elsewhere. See the core README.

## Links

- [Druxt](https://druxtjs.org)
- [GitHub](https://github.com/druxt/druxt.js)

## License

MIT
