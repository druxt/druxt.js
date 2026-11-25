import type { App, ComponentInternalInstance } from 'vue'
import { setupDevtoolsPlugin } from '@vue/devtools-api'
import type { DruxtDevtoolsBlock, DruxtDevtoolsChannel, DruxtDevtoolsModule, DruxtDevtoolsRequest, DruxtDevtoolsTimelineEvent } from '@druxt/devtools'
import { describeCandidate } from '@druxt/devtools'

/** The id of the inspector and of the timeline layer. */
export const DRUXT_VUE_DEVTOOLS_ID = 'druxt'

// The words a request's kind is shown with, and the tag colour of each module status.
const KINDS = { 'jsonapi': 'JSON:API', 'schema': 'Schema', 'date-formats': 'Date format', 'other': 'Request' } as const
const TONES = { ready: 0x0C7565, default: 0x1A6CA8, error: 0xB3261E } as const

/** An inspector tree node. */
interface Node {
  id: string
  label: string
  tags: { label: string, textColor: number, backgroundColor: number }[]
  children: Node[]
}

/**
 * The modules as a tree. Each module sits under the nearest module it renders within.
 *
 * With a filter, the tree is flat.
 *
 * @param modules - The page's modules.
 * @param instances - Their component instances, by id.
 * @param filter - The inspector's filter.
 */
const tree = (modules: DruxtDevtoolsModule[], instances: Map<string, ComponentInternalInstance>, filter = ''): Node[] => {
  const query = filter.trim().toLowerCase()
  const nodes = new Map<string, Node>(modules.map((module) => {
    const meta = describeCandidate(module.component, module.candidates)
    const status = module.status === 'error' ? String(module.statusCode || 'error') : module.status
    return [module.id, { id: module.id, label: module.component, tags: [...meta ? [{ label: meta, textColor: 0x16212B, backgroundColor: 0xE8EEF3 }] : [], { label: status, textColor: 0xFFFFFF, backgroundColor: TONES[module.status] }], children: [] }]
  }))
  const roots: Node[] = []
  for (const module of modules) {
    let parent = instances.get(module.id)?.parent
    while (parent && !nodes.has(String(parent.uid))) parent = parent.parent
    const node = nodes.get(module.id)!
    if (parent) nodes.get(String(parent.uid))!.children.push(node)
    else roots.push(node)
  }
  if (!query) return roots
  // With a filter, the tree is flat. It lists every module whose name, wrapper or candidate names match.
  return modules.filter((module) => [module.component, module.wrapper || '', ...module.candidates].some((text) => text.toLowerCase().includes(query))).map((module) => ({ ...nodes.get(module.id)!, children: [] }))
}

// An object as inspector state: a list of keys and values.
const entries = (values: Record<string, unknown>) => Object.entries(values).map(([key, value]) => ({ key, value }))

// The id prefix of a module section's node in the inspector tree. It tells a section's node from a module's.
const SECTION = 'section:'

/** A module section's blocks as inspector state: a list's keys, a table's rows, or a tree's value. */
const blockState = (block: DruxtDevtoolsBlock) => {
  if (block.type === 'pairs') return entries(block.items)
  if (block.type === 'table') return block.rows.map((row, index) => ({ key: String(row[0] ?? index + 1), value: Object.fromEntries(block.columns.map((column, at) => [column, row[at]])) }))
  return [{ key: 'value', value: block.value }]
}

/**
 * Adds Druxt to Vue DevTools. Development only.
 *
 * It adds a "Druxt" inspector, with a tree of the page's modules, and a "Druxt requests" timeline layer for fetches
 * and restores.
 *
 * Selecting a module shows its candidates, wrapper, data key, props, state and settings. It also highlights the
 * module's component in the page.
 *
 * @param app - The Vue app.
 * @param channel - The development tools' channel.
 * @param instances - The modules' component instances, by id.
 */
export function setupDruxtVueDevtools(app: App, channel: DruxtDevtoolsChannel, instances: Map<string, ComponentInternalInstance>): void {
  setupDevtoolsPlugin({
    id: 'druxt',
    label: 'Druxt',
    packageName: '@druxt/core',
    homepage: 'https://druxtjs.org',
    app,
    enableEarlyProxy: true,
  }, (api) => {
    api.addInspector({ id: DRUXT_VUE_DEVTOOLS_ID, label: 'Druxt', icon: 'account_tree', treeFilterPlaceholder: 'Filter modules', noSelectionText: 'Select a Druxt module' })
    api.addTimelineLayer({ id: DRUXT_VUE_DEVTOOLS_ID, label: 'Druxt requests', color: 0x3498DB })

    api.on.getInspectorTree((payload) => {
      if (payload.inspectorId !== DRUXT_VUE_DEVTOOLS_ID) return
      const snapshot = channel.snapshot()
      // The modules come first, then the sections that modules added.
      payload.rootNodes = [
        ...tree(snapshot.modules, instances, payload.filter),
        ...snapshot.sections.map((section) => ({ id: `${SECTION}${section.id}`, label: section.label, tags: [{ label: 'section', textColor: 0x16212B, backgroundColor: 0xE8EEF3 }], children: [] })),
      ]
    })
    let selected: string | undefined
    api.on.getInspectorState((payload) => {
      if (payload.inspectorId !== DRUXT_VUE_DEVTOOLS_ID) return
      if (String(payload.nodeId).startsWith(SECTION)) {
        const section = channel.snapshot().sections.find((item) => `${SECTION}${item.id}` === payload.nodeId)
        if (section) payload.state = Object.fromEntries(section.blocks.map((block, index) => [block.title || `${section.label} ${index + 1}`, blockState(block)]))
        return
      }
      const module = channel.snapshot().modules.find((item) => item.id === payload.nodeId)
      if (!module) return
      payload.state = {
        'Module': entries({ component: module.component, wrapper: module.wrapper || 'Druxt\'s default', key: module.key, status: module.status, ...module.schema ? { schema: module.schema } : {}, ...module.error ? { error: module.error } : {} }),
        'Candidates, most specific first': module.candidates.map((name, index) => ({ key: String(index + 1), value: name })),
        'Props': entries(module.props),
        'State': entries(module.state),
        'Settings': entries(module.settings),
        ...module.notes.length ? { Notes: module.notes.map((note) => ({ key: note.kind, value: note.detail ? `${note.title} ${note.detail}` : note.title })) } : {},
      }
      // Vue DevTools' own component inspector holds the rest. So the component is pointed at in the page, once per
      // selection, and not on every refresh of the state.
      if (payload.nodeId === selected) return
      selected = payload.nodeId as string
      const instance = instances.get(module.id)
      if (instance) void api.highlightElement(instance)
    })

    // Sends the tree and the state again, at most once every 100 ms.
    let pending = false
    const refresh = () => {
      if (pending) return
      pending = true
      setTimeout(() => {
        pending = false
        api.sendInspectorTree(DRUXT_VUE_DEVTOOLS_ID)
        api.sendInspectorState(DRUXT_VUE_DEVTOOLS_ID)
      }, 100)
    }

    const addRequest = (request: DruxtDevtoolsRequest) => {
      api.addTimelineEvent({
        layerId: DRUXT_VUE_DEVTOOLS_ID,
        event: {
          // The event is placed at the time the browser heard of it. A server render's request keeps its own clock
          // in its data and title.
          time: api.now(),
          title: `${request.side === 'server' ? `Server render, ${Math.round(request.start)} ms: ` : ''}${KINDS[request.kind]} ${request.path}`,
          subtitle: request.source === 'store' ? 'store' : `${request.status ?? ''} ${Math.round(request.duration)} ms`.trim(),
          data: { ...request },
          logType: (request.status || 0) >= 400 ? 'error' : 'default',
        },
      })
    }

    const addEvent = (event: DruxtDevtoolsTimelineEvent) => {
      api.addTimelineEvent({ layerId: DRUXT_VUE_DEVTOOLS_ID, event: { time: api.now(), title: event.source ? `${event.source}: ${event.label}` : event.label, subtitle: event.detail, data: { ...event } } })
    }

    // The requests and events reported before this ran are added first, such as the server render's from the
    // payload. Then each is added as it comes.
    const before = channel.snapshot()
    for (const request of before.requests) addRequest(request)
    for (const event of before.timeline) addEvent(event)
    channel.subscribe((event) => {
      if (event.type === 'request') {
        addRequest(event.request)
      } else if (event.type === 'timeline') {
        addEvent(event.event)
      } else if (event.type === 'module:restored') {
        api.addTimelineEvent({ layerId: DRUXT_VUE_DEVTOOLS_ID, event: { time: api.now(), title: `Restore ${event.component}`, subtitle: event.key, data: { ...event } } })
      }
      if (event.type.startsWith('module:') || event.type.startsWith('section') || event.type === 'quiet') refresh()
    })
  })
}
