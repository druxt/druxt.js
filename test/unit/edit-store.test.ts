import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, markRaw } from 'vue'
import { createPinia, getActivePinia, setActivePinia } from 'pinia'
import { defineDruxtEditDestination, draftKey } from '../../packages/core/src/edit'
import type { DruxtDraft, DruxtEditResource } from '../../packages/core/src/edit'
import type { DruxtEditEvent, DruxtEditSaveEvent } from '../../packages/core/src/runtime/edit-store'

// The store reads the Nuxt app for its hooks, its client and `druxt.editing`. A fake one stands in, so the store runs
// with core alone, no Nuxt build and no other Druxt module.
const app = vi.hoisted(() => ({ current: undefined as unknown, settings: {} as Record<string, unknown> }))
vi.mock('#app', () => ({ tryUseNuxtApp: () => app.current }))
vi.mock('../../packages/core/src/runtime/settings', () => ({ useDruxtSettings: () => app.settings }))
vi.mock('@druxt/core/edit', () => import('../../packages/core/src/edit'))

const { useDruxtEditStore } = await import('../../packages/core/src/runtime/edit-store')
const { useDruxtStore } = await import('../../packages/core/src/runtime/store')

const ID = 'b0b0b0b0-0000-4000-8000-000000000020'
const target = { type: 'node--page', id: ID, langcode: 'en' }
const pristine: DruxtEditResource = { type: 'node--page', id: ID, attributes: { title: 'About' }, relationships: {} }

/** A deferred answer, settled by the test. */
const deferred = <T>() => {
  let settle!: (value: T) => void
  const promise = new Promise<T>((resolve) => { settle = resolve })
  return { promise, settle }
}

/** The edit store over a fresh Pinia and a fake Nuxt app, with what its hooks received. */
const setup = (settings: Record<string, unknown> = {}) => {
  const hooked: Array<[string, DruxtEditEvent | DruxtEditSaveEvent]> = []
  // Nuxt's callHook, which awaits each hook: here, a record of what each received.
  const callHook = async (name: string, event: DruxtEditEvent | DruxtEditSaveEvent) => { hooked.push([name, JSON.parse(JSON.stringify(event))]) }
  app.settings = { editing: settings }
  app.current = { runWithContext: <T>(fn: () => T) => fn(), callHook, $druxt: undefined }
  const pinia = createPinia()
  // Core's Pinia plugin gives every store the client as `this.$druxt`. The edit store writes through a destination.
  pinia.use(() => ({ $druxt: markRaw({}) as never }))
  createApp({}).use(pinia)
  setActivePinia(pinia)
  return { edits: useDruxtEditStore(), store: useDruxtStore(), hooked }
}

afterEach(() => {
  app.current = undefined
})

describe('useDruxtEditStore().save() while canSave() decides', () => {
  it('leaves saving when canSave() refuses after an edit made meanwhile, and keeps that edit unsent', async () => {
    const { edits } = setup()
    const answers: Array<(ok: boolean) => void> = []
    const save = vi.fn(async (_draft: DruxtDraft, { payload }: { payload: unknown }) => ({ data: { ...pristine, attributes: { ...(payload as DruxtEditResource).attributes } } }))
    edits.addDestination(defineDruxtEditDestination({
      name: 'review',
      canSave: () => {
        const answer = deferred<boolean>()
        answers.push(answer.settle)
        return answer.promise
      },
      save,
    }))
    const key = edits.open(target, pristine, { destination: 'review' })
    edits.edit(key, 'title', 'First')

    const refused = edits.save(key)
    expect(edits.get(key)!.status).toBe('saving')
    edits.edit(key, 'title', 'Second')
    answers[0]!(false)
    expect(await refused).toMatchObject({ ok: false, reason: 'refused' })

    const draft = edits.get(key)!
    expect(draft.status).toBe('idle')
    expect(draft.pending).toBeNull()
    expect(draft.edits.attributes.title).toBe('Second')
    expect(save).not.toHaveBeenCalled()

    // The draft saves again, through its check, with the edit it kept.
    const again = edits.save(key)
    answers[1]!(true)
    expect(await again).toMatchObject({ ok: true })
    expect(save).toHaveBeenCalledTimes(1)
    expect(save.mock.calls[0]![1].payload).toMatchObject({ attributes: { title: 'Second' } })
    expect(edits.get(key)).toMatchObject({ status: 'saved', dirty: [] })
  })

  it('sends what canSave() was asked about when it agrees, and keeps an edit made meanwhile as unsaved', async () => {
    const { edits } = setup()
    const answer = deferred<boolean>()
    const save = vi.fn(async (_draft: DruxtDraft, { payload }: { payload: unknown }) => ({ data: { ...pristine, attributes: { ...(payload as DruxtEditResource).attributes } } }))
    edits.addDestination(defineDruxtEditDestination({ name: 'review', canSave: () => answer.promise, save }))
    const key = edits.open(target, pristine, { destination: 'review' })
    edits.edit(key, 'title', 'First')

    const saving = edits.save(key)
    edits.edit(key, 'title', 'Second')
    answer.settle(true)
    expect(await saving).toMatchObject({ ok: true })

    expect(save.mock.calls[0]![1].payload).toMatchObject({ attributes: { title: 'First' } })
    expect(edits.get(key)).toMatchObject({ status: 'saved', pending: null, dirty: ['title'], pristine: { attributes: { title: 'First' } } })
    expect(edits.get(key)!.edits.attributes.title).toBe('Second')
  })

  it('restores the draft as it was when canSave() refuses with no edit meanwhile', async () => {
    const { edits } = setup()
    edits.addDestination(defineDruxtEditDestination({ name: 'review', canSave: async () => false, save: vi.fn() }))
    const key = edits.open(target, pristine, { destination: 'review' })
    edits.edit(key, 'title', 'First')
    const before = edits.get(key)!

    expect(await edits.save(key)).toEqual({ ok: false, key, errors: [], reason: 'refused' })
    expect(edits.get(key)).toMatchObject({ status: before.status, pending: null, dirty: ['title'], edits: before.edits })
    expect(edits.get(key)!.revision).toBeGreaterThan(before.revision)
  })

  it('leaves a draft closed while canSave() decided closed', async () => {
    const { edits } = setup()
    const answer = deferred<boolean>()
    edits.addDestination(defineDruxtEditDestination({ name: 'review', canSave: () => answer.promise, save: vi.fn() }))
    const key = edits.open(target, pristine, { destination: 'review' })
    edits.edit(key, 'title', 'First')
    const saving = edits.save(key)
    edits.close(key)
    answer.settle(false)
    await saving
    expect(edits.get(key)).toBeUndefined()
  })

  it('reports a canSave() that rejects as a failed save, with nothing sent, and saves again', async () => {
    const { edits, hooked } = setup()
    const save = vi.fn(async () => ({}))
    const canSave = vi.fn<() => Promise<boolean>>().mockRejectedValueOnce(new TypeError('fetch failed')).mockResolvedValue(true)
    edits.addDestination(defineDruxtEditDestination({ name: 'review', canSave, save }))
    const key = edits.open(target, pristine, { destination: 'review' })
    edits.edit(key, 'title', 'First')

    expect(await edits.save(key)).toMatchObject({ ok: false, key, errors: [], network: true })
    expect(save).not.toHaveBeenCalled()
    expect(edits.get(key)).toMatchObject({ status: 'failed', pending: null, dirty: ['title'] })
    expect(hooked.at(-1)).toEqual(['druxt:edit:save', expect.objectContaining({ ok: false, destination: 'review', errors: [] })])

    expect(await edits.save(key)).toMatchObject({ ok: true })
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('carries on through saveAll() past a draft whose canSave() rejects', async () => {
    const { edits, hooked } = setup()
    const save = vi.fn(async () => ({}))
    const canSave = vi.fn(async (draft: DruxtDraft) => {
      if (draft.pristine.id === ID) throw new TypeError('fetch failed')
      return true
    })
    edits.addDestination(defineDruxtEditDestination({ name: 'review', canSave, save }))
    const other = 'b0b0b0b0-0000-4000-8000-000000000021'
    const first = edits.open(target, pristine, { destination: 'review' })
    const second = edits.open({ ...target, id: other }, { ...pristine, id: other }, { destination: 'review' })
    edits.edit(first, 'title', 'First')
    edits.edit(second, 'title', 'Second')

    const outcomes = await edits.saveAll()
    expect(outcomes.map((outcome) => outcome.ok)).toEqual([false, true])
    expect(save).toHaveBeenCalledTimes(1)
    expect(hooked.filter(([name]) => name === 'druxt:edit:save')).toHaveLength(2)
  })
})

/** A JSON:API writer, as the Druxt client is to the default destination, answering each write with `reply`. */
const writer = (reply: (payload: DruxtEditResource, prefix?: string) => Promise<unknown> = async (payload) => ({ data: { data: { ...payload, id: payload.id || 'created' } } })) => {
  const createResource = vi.fn(reply)
  return { createResource }
}

describe('useDruxtEditStore()', () => {
  it('opens one draft per entity and language, and keeps its edits over a newer pristine resource unless reset', () => {
    const { edits } = setup()
    const key = edits.open(target, pristine, { prefix: 'en' })
    expect(edits.open({ ...target, langcode: 'es' }, pristine)).not.toBe(key)
    edits.edit(key, 'title', 'Edited')
    expect(edits.open(target, { ...pristine, attributes: { title: 'Newer' } })).toBe(key)
    expect(edits.get(key)).toMatchObject({ dirty: ['title'], pristine: { attributes: { title: 'Newer' } }, edits: { attributes: { title: 'Edited' } } })
    edits.open(target, pristine, { reset: true })
    expect(edits.get(key)).toMatchObject({ dirty: [], status: 'idle' })
    expect(edits.dirty).toEqual([])
  })

  it('fires druxt:edit:start on a draft\'s first change only, and druxt:edit:cancel with the fields a discard dropped', () => {
    const { edits, hooked } = setup()
    const key = edits.open(target, pristine)
    edits.edit(key, 'title', 'One')
    edits.edit(key, 'title', 'Two')
    edits.update(key, { attributes: { title: 'Two', body: 'Text' } })
    expect(hooked.map(([name]) => name)).toEqual(['druxt:edit:start'])
    expect(hooked[0]![1]).toEqual({ key, entity: target, fields: ['title'] })

    edits.discard(key, 'form')
    expect(edits.get(key)).toMatchObject({ dirty: [], status: 'idle', pending: null, errors: {}, origin: 'form' })
    expect(hooked.at(-1)).toEqual(['druxt:edit:cancel', { key, entity: target, fields: ['title', 'body'] }])
    edits.start(key, 'title')
    expect(hooked.at(-1)).toEqual(['druxt:edit:start', { key, entity: target, fields: ['title'] }])
  })

  it('saves through the JSON:API destination with the client it is given, and publishes the saved resource', async () => {
    const { edits, store, hooked } = setup()
    const client = writer()
    const key = edits.open(target, pristine, { prefix: 'en' })
    edits.edit(key, 'title', 'Saved')
    const outcome = await edits.save(key, { client })
    expect(client.createResource).toHaveBeenCalledWith({ type: 'node--page', id: ID, attributes: { title: 'Saved' }, relationships: {} }, 'en')
    expect(outcome).toMatchObject({ ok: true, key, data: { attributes: { title: 'Saved' } }, errors: [] })
    expect(edits.get(key)).toMatchObject({ status: 'saved', dirty: [], pending: null, pristine: { attributes: { title: 'Saved' } } })
    expect(store.peekResource({ type: 'node--page', id: ID, prefix: 'en' })?.attributes?.title).toBe('Saved')
    expect(hooked.at(-1)).toEqual(['druxt:edit:save', expect.objectContaining({ key, destination: 'jsonapi', ok: true, fields: ['title'], errors: [] })])
  })

  it('saves to the site\'s default destination when the draft names none', async () => {
    const { edits } = setup({ destination: 'review' })
    const save = vi.fn(async () => {})
    edits.addDestination(defineDruxtEditDestination({ name: 'review', save }))
    const key = edits.open(target, pristine)
    edits.edit(key, 'title', 'Staged')
    expect(await edits.save(key)).toMatchObject({ ok: true, status: 'staged' })
    expect(save).toHaveBeenCalledTimes(1)
    expect(edits.get(key)).toMatchObject({ status: 'staged', dirty: ['title'] })
  })

  it('refuses through canSave(), with nothing sent, the edits kept and reason refused in the outcome and the hook', async () => {
    const { edits, hooked } = setup()
    // The JSON:API destination refuses a save with no client to write with.
    const key = edits.open(target, pristine)
    edits.edit(key, 'title', 'Kept')
    expect(await edits.save(key)).toEqual({ ok: false, key, errors: [], reason: 'refused' })
    expect(edits.get(key)).toMatchObject({ status: 'idle', pending: null, dirty: ['title'] })
    expect(hooked.at(-1)).toEqual(['druxt:edit:save', expect.objectContaining({ ok: false, reason: 'refused', destination: 'jsonapi' })])
  })

  it('keeps the edits of a failed save, with Drupal\'s errors keyed by their pointer, and saves again', async () => {
    const { edits, hooked } = setup()
    const errors = [{ status: '422', detail: 'title: This value should not be null.', source: { pointer: '/data/attributes/title' } }, { status: '422', detail: 'Something else.' }]
    const client = writer(async () => {
      throw Object.assign(new Error('Unprocessable'), { response: { status: 422, data: { errors } } })
    })
    const key = edits.open(target, pristine)
    edits.edit(key, 'title', '')
    const outcome = await edits.save(key, { client })
    expect(outcome).toMatchObject({ ok: false, key, errors, statusCode: 422, network: false })
    expect(edits.get(key)).toMatchObject({ status: 'failed', pending: null, dirty: ['title'], errors: { '/data/attributes/title': [errors[0]], '': [errors[1]] } })
    expect(edits.errors(key)).toHaveLength(2)
    expect(hooked.at(-1)).toEqual(['druxt:edit:save', expect.objectContaining({ ok: false, errors })])

    // No response at all is a network failure.
    const offline = writer(async () => {
      throw new TypeError('fetch failed')
    })
    expect(await edits.save(key, { client: offline })).toMatchObject({ ok: false, network: true, errors: [] })

    edits.setErrors(key, [])
    expect(edits.get(key)!.status).toBe('idle')
    edits.edit(key, 'title', 'Fixed')
    expect(await edits.save(key, { client: writer() })).toMatchObject({ ok: true })
    expect(edits.get(key)).toMatchObject({ status: 'saved', errors: {} })
  })

  it('runs one save of a draft at a time, and keeps an edit made while the write ran', async () => {
    const { edits } = setup()
    const written = deferred<unknown>()
    const client = writer(() => written.promise)
    const key = edits.open(target, pristine)
    edits.edit(key, 'title', 'Sent')
    const saving = edits.save(key, { client })
    expect(await edits.save(key, { client })).toEqual({ ok: false, key, errors: [], skipped: 'saving' })
    edits.edit(key, 'title', 'Typed meanwhile')
    written.settle({ data: { data: { ...pristine, attributes: { title: 'Sent' } } } })
    expect(await saving).toMatchObject({ ok: true })
    expect(client.createResource).toHaveBeenCalledTimes(1)
    expect(edits.get(key)).toMatchObject({ status: 'saved', dirty: ['title'], edits: { attributes: { title: 'Typed meanwhile' } } })
  })

  it('skips a draft it does not hold and a destination no module added', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { edits } = setup()
    expect(await edits.save('missing')).toEqual({ ok: false, key: 'missing', errors: [], skipped: 'missing' })
    const key = edits.open(target, pristine, { destination: 'nowhere' })
    edits.edit(key, 'title', 'Lost')
    expect(await edits.save(key)).toEqual({ ok: false, key, errors: [], skipped: 'destination' })
    expect(edits.get(key)!.status).toBe('idle')
    error.mockRestore()
  })

  it('moves a new entity\'s draft to its id\'s key once saved, and publishes it', async () => {
    const { edits, store } = setup()
    const key = edits.open({ type: 'node--page', local: 'form-1', langcode: 'en' }, { type: 'node--page' }, { prefix: 'en' })
    edits.hold(key, 'form')
    edits.edit(key, 'title', 'New')
    const outcome = await edits.save(key, { client: writer(async (payload) => ({ data: { data: { ...payload, id: 'created' } } })) })
    const saved = draftKey({ type: 'node--page', id: 'created', langcode: 'en' })
    expect(outcome).toMatchObject({ ok: true, key: saved })
    expect(edits.get(key)).toBeUndefined()
    expect(edits.get(saved)).toMatchObject({ id: 'created', status: 'saved', dirty: [] })
    expect(store.peekResource({ type: 'node--page', id: 'created', prefix: 'en' })?.attributes?.title).toBe('New')
  })

  it('saves in a batch every changed draft but a staged one and a new entity no editor holds', async () => {
    const { edits } = setup()
    const client = writer()
    const changed = edits.open(target, pristine)
    edits.edit(changed, 'title', 'Batch')
    edits.open({ type: 'node--page', id: 'clean' }, { type: 'node--page', id: 'clean' })
    const loose = edits.open({ type: 'node--page', local: 'loose' }, { type: 'node--page' })
    edits.edit(loose, 'title', 'Loose')
    edits.addDestination(defineDruxtEditDestination({ name: 'review', save: async () => {} }))
    const staged = edits.open({ type: 'node--page', id: 'staged' }, { type: 'node--page', id: 'staged' }, { destination: 'review' })
    edits.edit(staged, 'title', 'Staged')
    await edits.save(staged)

    const outcomes = await edits.saveAll(undefined, { client })
    expect(outcomes.map((outcome) => outcome.key)).toEqual([changed])
    edits.hold(loose, 'form')
    expect((await edits.saveAll(undefined, { client })).map((outcome) => outcome.ok)).toEqual([true])
    edits.release(loose, 'form')
  })

  it('keeps a write in flight through a discard, so a new entity is never created twice', async () => {
    const { edits } = setup()
    const written = deferred<unknown>()
    const client = writer(() => written.promise)
    const key = edits.open({ type: 'node--page', local: 'form-1' }, { type: 'node--page' })
    edits.hold(key, 'form')
    edits.edit(key, 'title', 'New')
    const saving = edits.save(key, { client })
    edits.discard(key, 'form')
    expect(edits.get(key)).toMatchObject({ dirty: [], status: 'saving' })
    expect(await edits.save(key, { client })).toEqual({ ok: false, key, errors: [], skipped: 'saving' })
    written.settle({ data: { data: { type: 'node--page', id: 'created', attributes: { title: 'New' } } } })
    expect(await saving).toMatchObject({ ok: true })
    expect(client.createResource).toHaveBeenCalledTimes(1)
    // The entity was created, so the draft is its draft, with no edits.
    expect(edits.get(draftKey({ type: 'node--page', id: 'created' }))).toMatchObject({ status: 'saved', dirty: [], pending: null })
  })

  it('leaves a discarded draft idle, with no errors, when the write it was in fails', async () => {
    const { edits } = setup()
    const written = deferred<unknown>()
    const key = edits.open(target, pristine)
    edits.edit(key, 'title', 'Sent')
    const saving = edits.save(key, { client: writer(() => written.promise.then(() => { throw Object.assign(new Error('422'), { response: { status: 422, data: { errors: [{ detail: 'No.' }] } } }) })) })
    edits.discard(key)
    written.settle(undefined)
    expect(await saving).toMatchObject({ ok: false, statusCode: 422 })
    expect(edits.get(key)).toMatchObject({ status: 'idle', dirty: [], errors: {}, pending: null })
  })

  it('sends a staged draft again in a batch when it was edited while the destination took it', async () => {
    const { edits } = setup()
    const taken: Array<ReturnType<typeof deferred<undefined>>> = []
    const save = vi.fn((_draft: DruxtDraft) => {
      taken.push(deferred<undefined>())
      return taken.at(-1)!.promise
    })
    edits.addDestination(defineDruxtEditDestination({ name: 'review', save }))
    const key = edits.open(target, pristine, { destination: 'review' })
    edits.edit(key, 'title', 'B')
    const first = edits.save(key)
    edits.edit(key, 'title', 'C')
    taken[0]!.settle(undefined)
    expect(await first).toMatchObject({ ok: true, status: 'staged' })
    expect(edits.get(key)).toMatchObject({ status: 'idle', dirty: ['title'] })

    const batch = edits.saveAll()
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(2))
    taken[1]!.settle(undefined)
    expect((await batch).map((outcome) => outcome.status)).toEqual(['staged'])
    expect(save.mock.calls[1]![0].pending!.payload.attributes).toEqual({ title: 'C' })
    // It holds what the destination took, so a batch leaves it be.
    expect(edits.get(key)!.status).toBe('staged')
    expect(await edits.saveAll()).toEqual([])
  })

  it('does not publish a saved resource that a cache clear overtook, as a sign-out\'s does', async () => {
    const { edits, store } = setup()
    const written = deferred<unknown>()
    const key = edits.open(target, pristine, { prefix: 'en' })
    edits.edit(key, 'title', 'Private')
    const saving = edits.save(key, { client: writer(() => written.promise) })
    store.clearCache({ drafts: true })
    written.settle({ data: { data: { ...pristine, attributes: { title: 'Private' } } } })
    expect(await saving).toMatchObject({ ok: true })
    expect(store.peekResource({ type: 'node--page', id: ID, prefix: 'en' })).toBeUndefined()
    expect(store.resources).toEqual({})
    expect(edits.drafts).toEqual({})
  })

  it('drops the stored copy of a saved resource when a flush of something else overtook the save', async () => {
    const { edits, store } = setup()
    const written = deferred<unknown>()
    store.addResource({ prefix: 'en', resource: { data: pristine as never } })
    const key = edits.open(target, pristine, { prefix: 'en' })
    edits.edit(key, 'title', 'Saved')
    const saving = edits.save(key, { client: writer(() => written.promise) })
    store.flushCollection({ type: 'node--article' })
    written.settle({ data: { data: { ...pristine, attributes: { title: 'Saved' } } } })
    expect(await saving).toMatchObject({ ok: true })
    // The copy from before the save is not left for a reader to render.
    expect(store.peekResource({ type: 'node--page', id: ID, prefix: 'en' })).toBeUndefined()
    expect(edits.get(key)).toMatchObject({ status: 'saved', pristine: { attributes: { title: 'Saved' } } })
  })

  it('leaves a draft that was closed and opened again while a save ran as it is, whatever that save answers', async () => {
    const { edits } = setup()
    const first = deferred<unknown>()
    const second = deferred<unknown>()
    const key = edits.open(target, pristine)
    edits.edit(key, 'title', 'Old')
    const old = edits.save(key, { client: writer(() => first.promise) })
    edits.close(key)
    expect(edits.open(target, pristine)).toBe(key)
    edits.edit(key, 'title', 'Newer')
    const newer = edits.save(key, { client: writer(() => second.promise) })
    const before = edits.get(key)!
    expect(before).toMatchObject({ status: 'saving', pending: { payload: { attributes: { title: 'Newer' } } } })

    first.settle({ data: { data: { ...pristine, attributes: { title: 'Old' } } } })
    expect(await old).toMatchObject({ ok: true })
    // The old save's answer is not this draft's: its pristine copy and its own write are untouched.
    expect(edits.get(key)).toBe(before)
    second.settle({ data: { data: { ...pristine, attributes: { title: 'Newer' } } } })
    expect(await newer).toMatchObject({ ok: true })
    expect(edits.get(key)).toMatchObject({ status: 'saved', dirty: [], pristine: { attributes: { title: 'Newer' } } })

    // The same for a save that fails, and for one that canSave() refuses.
    edits.addDestination(defineDruxtEditDestination({ name: 'review', canSave: () => first.promise.then(() => false), save: async () => {} }))
    for (const [destination, client] of [['jsonapi', writer(async () => { throw new Error('offline') })], ['review', undefined]] as const) {
      edits.close(key)
      edits.open(target, pristine, { destination })
      edits.edit(key, 'title', 'Old')
      const ended = edits.save(key, { client })
      edits.close(key)
      edits.open(target, pristine)
      const reopened = edits.get(key)
      expect((await ended).ok).toBe(false)
      expect(edits.get(key)).toBe(reopened)
    }
  })

  it('never sends in a batch a new entity that no editor holds when its turn comes, named or not', async () => {
    const { edits } = setup()
    const written = deferred<unknown>()
    const client = writer((payload) => (payload.id ? written.promise : Promise.resolve({ data: { data: { ...payload, id: 'created' } } })))
    const loose = edits.open({ type: 'node--page', local: 'loose' }, { type: 'node--page' })
    edits.edit(loose, 'title', 'Loose')
    expect(await edits.saveAll([loose], { client })).toEqual([{ ok: false, key: loose, errors: [], skipped: 'unheld' }])
    expect(client.createResource).not.toHaveBeenCalled()

    // Its last editor leaves while an earlier draft of the batch is written.
    const changed = edits.open(target, pristine)
    edits.edit(changed, 'title', 'Batch')
    const later = edits.open({ type: 'node--page', local: 'later' }, { type: 'node--page' })
    edits.edit(later, 'title', 'Later')
    edits.hold(later, 'form')
    const batch = edits.saveAll(undefined, { client })
    edits.release(later, 'form')
    written.settle({ data: { data: { ...pristine, attributes: { title: 'Batch' } } } })
    expect((await batch).map((outcome) => [outcome.key, outcome.ok, outcome.skipped])).toEqual([[changed, true, undefined], [later, false, 'unheld']])
    expect(client.createResource).toHaveBeenCalledTimes(1)

    // Held, it is saved.
    edits.hold(later, 'form')
    expect(await edits.saveAll([later], { client })).toMatchObject([{ ok: true }])
  })

  it('closes a draft, and every draft on a cache clear that asks for them, as a sign-in or sign-out does', () => {
    const { edits, store } = setup()
    const key = edits.open(target, pristine)
    edits.edit(key, 'title', 'Unsaved')
    store.clearCache()
    expect(edits.get(key)).toMatchObject({ dirty: ['title'] })
    store.clearCache({ drafts: true })
    expect(edits.drafts).toEqual({})
    const again = edits.open(target, pristine)
    edits.close(again)
    expect(edits.get(again)).toBeUndefined()
  })

  it('finds the draft an element\'s anchors name', () => {
    const { edits } = setup()
    const key = edits.open(target, pristine)
    edits.edit(key, 'title', 'Inline')
    const match = edits.fromAnchor({ entity: ID, type: 'node--page', langcode: 'en', field: 'title' })
    expect(match?.draft.key).toBe(key)
    expect(match?.field).toMatchObject({ id: 'title', value: 'Inline', dirty: true })
  })
})

describe('what the edit store never holds or serializes', () => {
  it('keeps drafts out of the store\'s state, so no unsaved edit reaches the page payload', () => {
    const { edits } = setup()
    const key = edits.open(target, pristine)
    edits.edit(key, 'title', 'Unsaved secret edit')
    expect(edits.get(key)).toBeDefined()
    expect(JSON.stringify(getActivePinia()!.state.value)).not.toContain('Unsaved secret edit')
  })

  it('drops links, meta and never-loaded relationships from a pristine resource, so no backend URL rides along', () => {
    const { edits } = setup()
    const key = edits.open(target, {
      ...pristine,
      links: { self: { href: 'https://drupal.internal/jsonapi/node/page/x' } },
      meta: { token: 'secret' },
      relationships: { uid: { data: { type: 'user--user', id: 'u1' }, links: { related: { href: 'https://drupal.internal/u1' } } }, tags: { links: { related: { href: 'https://drupal.internal/tags' } } } },
    } as DruxtEditResource)
    const draft = JSON.stringify(edits.get(key))
    expect(draft).not.toContain('drupal.internal')
    expect(draft).not.toContain('secret')
    expect(edits.get(key)!.pristine.relationships).toEqual({ uid: { data: { type: 'user--user', id: 'u1' } } })
  })

  it('holds no credential of the client it writes with, in the write in flight, the payload or the saved draft', async () => {
    const { edits, hooked } = setup()
    const written = deferred<unknown>()
    const client = { token: 'in-flight-secret-token', ...writer(() => written.promise) }
    const key = edits.open(target, pristine)
    edits.edit(key, 'title', 'Once')
    const saving = edits.save(key, { client })
    expect(JSON.stringify(edits.get(key))).not.toContain('in-flight-secret-token')
    written.settle({ data: { data: { ...pristine, attributes: { title: 'Once' } } } })
    await saving
    expect(JSON.stringify(edits.get(key))).not.toContain('in-flight-secret-token')
    expect(JSON.stringify(hooked)).not.toContain('in-flight-secret-token')
  })
})
