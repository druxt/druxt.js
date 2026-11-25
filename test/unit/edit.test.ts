// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import {
  anchorOf,
  applySaved,
  createDraft,
  defineDruxtEditDestination,
  discardDraft,
  draftErrors,
  draftField,
  draftKey,
  draftPayload,
  draftResource,
  DRUXT_JSONAPI_DESTINATION,
  editDraft,
  editPermission,
  editResource,
  findDraft,
  isDirty,
  jsonApiDestination,
  keyErrors,
  rebaseDraft,
  setDraftErrors,
  startSave,
  updateDraft,
} from '../../packages/core/src/edit'
import type { DruxtDraft } from '../../packages/core/src/edit'
import { entityAnchors, fieldAnchors } from '../../packages/core/src/anchors'

const ID = 'b0b0b0b0-0000-4000-8000-000000000010'
const USER = 'b0b0b0b0-0000-4000-8000-000000000001'

// A page as JSON:API returns it: links, meta and included resources beside its fields.
const page = {
  type: 'node--page',
  id: ID,
  links: { self: { href: 'https://drupal.test/jsonapi/node/page/x' } },
  meta: { omitted: {} },
  attributes: { title: 'About', status: true, field_keywords: ['pastry', 'egg'] },
  relationships: {
    uid: { data: { type: 'user--user', id: USER }, links: { self: { href: 'https://drupal.test/secret' } } },
    field_tags: { links: { related: { href: 'https://drupal.test/tags' } } },
  },
  included: [{ type: 'user--user', id: USER, attributes: { name: 'druxt' } }],
}

const draftOf = (): DruxtDraft => createDraft({ type: 'node--page', id: ID, langcode: 'en' }, page, { prefix: 'en' })

describe('@druxt/core/edit', () => {
  it('keys a draft by its type, id and language, and a new entity by its local name', () => {
    expect(draftKey({ type: 'node--page', id: ID, langcode: 'en' })).toBe(`node--page:${ID}:en`)
    expect(draftKey({ type: 'node--page', id: ID })).toBe(`node--page:${ID}:`)
    expect(draftKey({ type: 'node--page', local: '3' })).toBe('node--page:new-3:')
    // An id wins over a local name, so a saved entity's draft is everyone's.
    expect(draftKey({ type: 'node--page', id: ID, local: '3' })).toBe(`node--page:${ID}:`)
  })

  it('holds field values only: no links, no meta, no included resources, and no relationship never loaded', () => {
    const draft = draftOf()
    expect(draft.pristine).toEqual({
      type: 'node--page',
      id: ID,
      attributes: { title: 'About', status: true, field_keywords: ['pastry', 'egg'] },
      relationships: { uid: { data: { type: 'user--user', id: USER } } },
    })
    expect(JSON.stringify(draft)).not.toMatch(/drupal\.test|included|omitted/)
    expect(draft).toMatchObject({ key: `node--page:${ID}:en`, status: 'idle', dirty: [], errors: {}, pending: null, prefix: 'en', revision: 0 })
    // A copy: changing the resource later never changes the draft.
    expect(editResource(page).attributes).not.toBe(page.attributes)
  })

  it('tracks the changed fields, and a field set back to its pristine value is clean again', () => {
    let draft = editDraft(draftOf(), 'title', 'About us', { origin: 'form' })
    expect(draft.dirty).toEqual(['title'])
    expect(isDirty(draft)).toBe(true)
    expect(isDirty(draft, 'title')).toBe(true)
    expect(isDirty(draft, 'status')).toBe(false)
    expect(draft.origin).toBe('form')
    expect(draft.revision).toBe(1)
    draft = editDraft(draft, 'field_tags', { data: [{ type: 'taxonomy_term--tags', id: 't1' }] }, { relationship: true })
    expect(draft.dirty).toEqual(['title', 'field_tags'])
    draft = editDraft(draft, 'title', 'About')
    expect(draft.dirty).toEqual(['field_tags'])
    expect(draft.edits.attributes).toEqual({})
    expect(draftResource(draft).relationships).toEqual({ uid: { data: { type: 'user--user', id: USER } }, field_tags: { data: [{ type: 'taxonomy_term--tags', id: 't1' }] } })
  })

  it('sets a whole resource, as a form does, and leaves the draft as it was when nothing changed', () => {
    const draft = draftOf()
    expect(updateDraft(draft, page)).toBe(draft)
    const next = updateDraft(draft, { attributes: { ...page.attributes, title: 'Edited' }, relationships: page.relationships }, 'form')
    expect(next.dirty).toEqual(['title'])
    expect(next.edits).toEqual({ attributes: { title: 'Edited' }, relationships: {} })
  })

  it('sends the changed fields of a saved entity, an emptied one as null, and nothing a never loaded relationship holds', () => {
    let draft = editDraft(draftOf(), 'title', undefined)
    draft = editDraft(draft, 'field_keywords', ['pastry'])
    draft = editDraft(draft, 'uid', { data: null }, { relationship: true })
    expect(draftPayload(draft)).toEqual({
      type: 'node--page',
      id: ID,
      attributes: { title: null, field_keywords: ['pastry'] },
      relationships: { uid: { data: null } },
    })
    // Only the fields a save may send, such as a form display's.
    expect(draftPayload(draft, ['field_keywords'])).toEqual({ type: 'node--page', id: ID, attributes: { field_keywords: ['pastry'] }, relationships: {} })
    expect(draftPayload({ ...draft, fields: ['uid'] })).toEqual({ type: 'node--page', id: ID, attributes: {}, relationships: { uid: { data: null } } })
  })

  it('keeps an attribute emptied to undefined as null, so a save sends it', () => {
    const draft = updateDraft(draftOf(), { attributes: { ...page.attributes, title: undefined }, relationships: page.relationships })
    expect(draft.edits.attributes).toEqual({ title: null })
    expect(draft.dirty).toEqual(['title'])
    expect(draftPayload(draft).attributes).toEqual({ title: null })
    expect(editDraft(draftOf(), 'title', undefined).edits.attributes).toEqual({ title: null })
  })

  it('sends every field of a new entity', () => {
    const draft = editDraft(createDraft({ type: 'node--page', local: '1' }, { type: 'node--page', attributes: { status: true } }), 'title', 'New')
    expect(draft.key).toBe('node--page:new-1:')
    expect(draftPayload(draft)).toEqual({ type: 'node--page', attributes: { status: true, title: 'New' }, relationships: {} })
  })

  it('keys errors by their pointer, and reads each field\'s, its parts included', () => {
    const errors = [
      { status: '422', detail: 'title: This value should not be null.', source: { pointer: '/data/attributes/title' } },
      { status: '422', detail: 'Bad link.', source: { pointer: '/data/attributes/field_link/uri' } },
      { status: '403', detail: 'Forbidden.' },
      { status: '422', detail: 'Bad user.', source: { pointer: '/data/relationships/uid' } },
    ]
    expect(Object.keys(keyErrors(errors))).toEqual(['/data/attributes/title', '/data/attributes/field_link/uri', '', '/data/relationships/uid'])
    const draft = setDraftErrors(editDraft(draftOf(), 'field_link', { uri: 'x' }), errors)
    expect(draft.status).toBe('failed')
    expect(draftErrors(draft)).toHaveLength(4)
    expect(draftField(draft, 'title')).toMatchObject({ id: 'title', relationship: false, pristine: 'About', value: 'About', dirty: false, errors: [errors[0]] })
    expect(draftField(draft, 'field_link')).toMatchObject({ dirty: true, value: { uri: 'x' }, errors: [errors[1]] })
    expect(draftField(draft, 'uid')).toMatchObject({ relationship: true, errors: [errors[3]] })
    expect(draftField(draft, 'nothing')).toBeUndefined()
  })

  it('takes the saved resource as pristine, clears what was sent and keeps an edit made while it saved', () => {
    const draft = editDraft(draftOf(), 'title', 'Sent')
    const sent = draftPayload(draft)
    // The user typed on while the write ran.
    const during = editDraft(editDraft(draft, 'status', false), 'title', 'Sent')
    const saved = applySaved({ ...during, status: 'saving' }, sent, { ...page, attributes: { ...page.attributes, title: 'Sent' } })
    expect(saved).toMatchObject({ status: 'saved', pending: null, errors: {}, dirty: ['status'] })
    expect(saved.pristine.attributes!.title).toBe('Sent')
    expect(JSON.stringify(saved)).not.toMatch(/drupal\.test/)
  })

  it('gives a saved new entity its id and key, and keeps a staged change\'s edits when the destination answers no resource', () => {
    const draft = editDraft(createDraft({ type: 'node--page', local: '1' }, { type: 'node--page' }), 'title', 'New')
    const saved = applySaved(draft, draftPayload(draft), { type: 'node--page', id: 'new-id', attributes: { title: 'New' } })
    expect(saved).toMatchObject({ key: 'node--page:new-id:', id: 'new-id', dirty: [] })
    const staged = applySaved(draft, draftPayload(draft))
    expect(staged).toMatchObject({ key: draft.key, status: 'staged', dirty: ['title'] })
    // Changed again, it is idle, to be sent again.
    expect(editDraft(staged, 'title', 'Again').status).toBe('idle')
  })

  it('discards the edits and errors, and keeps edits over a newer pristine copy', () => {
    const draft = setDraftErrors(editDraft(draftOf(), 'title', 'Edited'), [{ detail: 'No.' }])
    expect(discardDraft(draft, 'form')).toMatchObject({ dirty: [], errors: {}, status: 'idle', origin: 'form', edits: { attributes: {}, relationships: {} } })
    const rebased = rebaseDraft(editDraft(draftOf(), 'title', 'Edited'), { ...page, attributes: { ...page.attributes, status: false } })
    expect(draftResource(rebased).attributes).toMatchObject({ title: 'Edited', status: false })
    // An edit the newer copy already holds is clean.
    expect(rebaseDraft(editDraft(draftOf(), 'title', 'Edited'), { ...page, attributes: { ...page.attributes, title: 'Edited' } }).dirty).toEqual([])
    const same = draftOf()
    expect(rebaseDraft(same, page)).toBe(same)
  })

  it('keeps a write in flight through a discard, and leaves the draft with no edits when that write ends', () => {
    const draft = editDraft(draftOf(), 'title', 'Sent')
    const sent = draftPayload(draft)
    const discarded = discardDraft(startSave(draft, 'jsonapi', sent), 'form')
    // The edits are gone, and the write still holds the draft.
    expect(discarded).toMatchObject({ dirty: [], errors: {}, status: 'saving', pending: { destination: 'jsonapi', payload: sent }, origin: 'form' })
    const saved = applySaved(discarded, sent, { ...page, attributes: { ...page.attributes, title: 'Sent' } })
    expect(saved).toMatchObject({ status: 'saved', pending: null, dirty: [], pristine: { attributes: { title: 'Sent' } } })
  })

  it('stages a draft only when the destination took what it holds now', () => {
    const draft = editDraft(draftOf(), 'title', 'B')
    const sent = draftPayload(draft)
    const saving = startSave(draft, 'review', sent)
    expect(applySaved(saving, sent)).toMatchObject({ status: 'staged', dirty: ['title'] })
    // The user typed on while the destination took the change, so it never got this value.
    expect(applySaved(editDraft(saving, 'title', 'C'), sent)).toMatchObject({ status: 'idle', pending: null, dirty: ['title'], edits: { attributes: { title: 'C' } } })
    // The same for another field, and for a field set back to what Drupal holds.
    expect(applySaved(editDraft(saving, 'status', false), sent)).toMatchObject({ status: 'idle', dirty: ['title', 'status'] })
    expect(applySaved(editDraft(saving, 'title', 'About'), sent)).toMatchObject({ status: 'idle', dirty: [] })
    // A field the save may not send was never the destination's to take.
    const limited = startSave(editDraft(draft, 'status', false), 'review', sent)
    expect(applySaved(limited, sent, undefined, ['title'])).toMatchObject({ status: 'staged', dirty: ['title', 'status'] })
  })

  it('keeps a field set back to its old value while its save ran, as an edit over the saved one', () => {
    const draft = editDraft(editDraft(draftOf(), 'title', 'B'), 'uid', { data: null }, { relationship: true })
    const sent = draftPayload(draft)
    const saving = startSave(draft, 'jsonapi', sent)
    const answer = { ...page, attributes: { ...page.attributes, title: 'B' }, relationships: { uid: { data: null } } }
    // With no change meanwhile, the draft is clean.
    expect(applySaved(saving, sent, answer)).toMatchObject({ status: 'saved', dirty: [] })
    // The title and the author went back to what they were, which Drupal no longer holds.
    const reverted = editDraft(editDraft(saving, 'title', 'About'), 'uid', { data: { type: 'user--user', id: USER } }, { relationship: true })
    expect(reverted.dirty).toEqual([])
    const saved = applySaved(reverted, sent, answer)
    expect(saved).toMatchObject({ status: 'saved', pristine: { attributes: { title: 'B' } }, edits: { attributes: { title: 'About' }, relationships: { uid: { data: { type: 'user--user', id: USER } } } } })
    expect(saved.dirty.sort()).toEqual(['title', 'uid'])
    // A new entity sends every field. One that was never edited stays clean.
    const fresh = editDraft(createDraft({ type: 'node--page', local: '1' }, { type: 'node--page', attributes: { title: '', status: true } }), 'title', 'New')
    const created = applySaved(editDraft(startSave(fresh, 'jsonapi', draftPayload(fresh)), 'title', ''), draftPayload(fresh), { type: 'node--page', id: 'new-id', attributes: { title: 'New', status: true } })
    expect(created).toMatchObject({ id: 'new-id', dirty: ['title'], edits: { attributes: { title: '' } } })
  })

  it('finds a draft by the anchors on the page, with the field and the item they name', () => {
    const drafts = { [draftOf().key]: editDraft(draftOf(), 'field_keywords', ['pie', 'egg']) }
    expect(findDraft(drafts, {})).toBeUndefined()
    expect(findDraft(drafts, { entity: 'other' })).toBeUndefined()
    expect(findDraft(drafts, { entity: ID, type: 'node--article' })).toBeUndefined()
    expect(findDraft(drafts, { entity: ID, langcode: 'es' })).toBeUndefined()
    expect(findDraft(drafts, { entity: ID })?.draft.key).toBe(`node--page:${ID}:en`)
    const match = findDraft(drafts, { entity: ID, type: 'node--page', langcode: 'en', field: 'field_keywords', delta: 0 })
    expect(match?.field).toMatchObject({ pristine: ['pastry', 'egg'], value: ['pie', 'egg'], dirty: true })
    expect(match?.item).toBe('pie')
    // A single value is its own item 0.
    expect(findDraft(drafts, { entity: ID, field: 'uid', delta: 0 })?.item).toEqual({ type: 'user--user', id: USER })
    expect(findDraft(drafts, { entity: ID, field: 'uid', delta: 1 })?.item).toBeUndefined()
  })

  it('reads the anchors around an element, so a click inside a field names its draft', () => {
    const root = document.createElement('article')
    Object.entries(entityAnchors('node--page', ID, 'en')).forEach(([name, value]) => root.setAttribute(name, value))
    root.innerHTML = '<div><ul data-druxt-field="field_keywords"><li data-druxt-field="field_keywords" data-druxt-delta="1"><b>egg</b></li></ul></div>'
    expect(anchorOf(root.querySelector('b'))).toEqual({ entity: ID, type: 'node--page', langcode: 'en', field: 'field_keywords', delta: 1 })
    expect(anchorOf(root)).toEqual({ entity: ID, type: 'node--page', langcode: 'en' })
    expect(Object.keys(fieldAnchors('x'))).toEqual(['data-druxt-field'])
    expect(anchorOf(null)).toEqual({})
  })

  it('defines a destination, refusing one with no name or no save', () => {
    expect(() => defineDruxtEditDestination({ name: '', save: async () => {} })).toThrow(TypeError)
    expect(() => defineDruxtEditDestination({ name: 'x' } as never)).toThrow(TypeError)
    const destination = defineDruxtEditDestination({ name: 'review', save: async () => {} })
    expect(Object.isFrozen(destination)).toBe(true)
    expect(jsonApiDestination.name).toBe(DRUXT_JSONAPI_DESTINATION)
  })

  it('writes through the JSON:API destination with the client it is given, and holds no token afterwards', async () => {
    const token = 'secret-token-value'
    const client = {
      auth: { token },
      createResource: vi.fn(async (resource: { attributes: object }) => ({ data: { data: { ...page, attributes: { ...page.attributes, ...resource.attributes } } } })),
    }
    const draft = editDraft(draftOf(), 'title', 'Saved')
    const payload = draftPayload(draft)
    expect(jsonApiDestination.canSave!(draft, { payload })).toBe(false)
    expect(jsonApiDestination.canSave!(draft, { payload, client })).toBe(true)
    await expect(jsonApiDestination.save(draft, { payload })).rejects.toThrow(TypeError)
    const result = await jsonApiDestination.save(draft, { payload, client, prefix: 'en' })
    expect(client.createResource).toHaveBeenCalledWith(payload, 'en')
    const saved = applySaved(draft, payload, result!.data)
    expect(saved.pristine.attributes!.title).toBe('Saved')
    expect(JSON.stringify(saved)).not.toContain(token)
    // The draft as the store holds it while the write runs.
    const saving = startSave(draft, 'jsonapi', payload, 'form')
    expect(saving).toMatchObject({ status: 'saving', origin: 'form', pending: { destination: 'jsonapi', payload } })
    expect(Object.keys(saving.pending!)).toEqual(['destination', 'payload'])
    expect(JSON.stringify(saving)).not.toContain(token)
  })

  it('reports permission denied without editing or a signed-in user, allowed on an update link, and unknown otherwise', () => {
    expect(editPermission({ enabled: false, signedIn: true })).toBe('denied')
    expect(editPermission({ signedIn: false, links: { update: { href: 'x' } } })).toBe('denied')
    expect(editPermission({ signedIn: true })).toBe('unknown')
    expect(editPermission({ signedIn: true, links: { self: { href: 'x' } } })).toBe('unknown')
    expect(editPermission({ signedIn: true, links: { update: { href: 'x' } } })).toBe('allowed')
    expect(editPermission({ signedIn: true, links: { 'edit-form': { href: 'x' } } })).toBe('allowed')
  })
})
