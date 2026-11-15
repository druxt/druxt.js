# @druxt/devtools

The Druxt development tools, with no Vue, Nuxt or h3 dependency. A model holds
what a page's Druxt modules did, and the `<druxt-devtools>` custom element and
a console summary show it. Druxt's Nuxt module embeds
the element in a Nuxt DevTools tab and feeds Vue DevTools from the same model.
Another host, such as a React or Next.js app, emits the same events and embeds
the same element.

Add it to a Nuxt site as a dev dependency. Druxt finds it in development, and
a production build has none of it:

```sh
npm install --save-dev @druxt/devtools
```

## The model

`createDruxtDevtools()` returns a channel. A host reports what happens with
`emit(event)`, a tool listens with `subscribe(listener)`, and `snapshot()`
returns everything reported so far. Every event is JSON-serializable, so it can
cross a frame or a process.

```ts
import { createDruxtDevtools } from '@druxt/devtools';

const devtools = createDruxtDevtools();
devtools.emit({ type: 'page', path: '/recipes' });
devtools.snapshot().page; // '/recipes'
```

A `page` event for another path starts that page's requests afresh. A request
from a server render has the `page` it was made for, and the Requests
section names it, as `Server render of /recipes`. Core's development plugin
reports a server render's requests only while the browser shows that page.

## The element

`defineDruxtDevtoolsElement(window)` defines `<druxt-devtools>` in a window.
`connect(channel)` feeds it. Its `section` attribute picks the section and its
`theme` attribute picks light or dark. It styles itself in its own shadow root.

```ts
import { createDruxtDevtools, defineDruxtDevtoolsElement } from '@druxt/devtools';

defineDruxtDevtoolsElement();
const tools = document.createElement('druxt-devtools');
document.body.append(tools);
tools.connect(createDruxtDevtools());
```

## The console summary

`watchDruxtDevtoolsSummary(channel, { open })` prints what the tools would show
once the page settles. With `open`, it prints one line pointing to that tool,
such as `Druxt: 4 defaults in use. Open Nuxt DevTools > Druxt.`. Without it,
each page gets a collapsed group, `Druxt: 4 defaults in use on /path`, with
each default's candidate names, and, only when there are any, an open group of
quiet errors. The groups print again for a new page, a new count, or a quiet
error whose status or detail changed.

## Module extensions

A host can show more than the built-in sections. Each extension is plain data
on the channel, so the element, Vue DevTools and the console summary all show
it:

- A `section` event adds a tab. Its blocks are `pairs`, `table` or `tree`
  data, which the element renders, never markup.
- A `timeline` event adds a labelled event beside the requests.
- `registerAction(action, handler)` offers a button. The handler runs in the
  host, and `runAction(id)` runs it. It returns a function that withdraws
  that registration, and does nothing once the same id is registered again.

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

A Druxt module uses `useDruxtDevtools()` from `@druxt/core` instead, which
calls these for it in development and does nothing elsewhere. See the core
README.

## Links

- [Druxt](https://druxtjs.org)
- [GitHub](https://github.com/druxt/druxt.js)

## License

MIT
