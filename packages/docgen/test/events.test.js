/**
 * @jest-environment node
 */
// vue-docgen-api's resolver only exports under the `node` condition.
import path from 'path'

import { DruxtDocgen } from '../src'

// Unlike index.test.js, nothing is mocked: the real DruxtEntityForm goes
// through vue-docgen-api and processVue, inherited DruxtEntity events included.
describe('DruxtDocgen events', () => {
  test('documents DruxtEntityForm events with their descriptions', async () => {
    const docgen = new DruxtDocgen()
    const templateData = [{ id: 'module:DruxtEntityForm', memberof: null }]

    // Absolute, as jest's resolver reads a relative `extends` import against it.
    await docgen.processVue(path.resolve('packages/entity/src/components/DruxtEntityForm.vue'), templateData)

    const events = Object.fromEntries(templateData
      .filter((item) => item.memberof === 'module:DruxtEntityForm.events')
      .map((item) => [item.name, item]))

    expect(Object.keys(events).sort()).toStrictEqual(['error', 'input', 'reset', 'submit'])
    expect(events.input.description).toBe('Emitted with the updated entity when one of its fields changes, so `v-model` stays in step.')
    expect(events.reset.description).toBe("Emitted when the form is reset, after the last submission's response is cleared.")
    expect(events.submit.description).toBe('Emitted with the saved JSON:API resource once Drupal accepts the submission.')
    expect(events.error.description).toBe("Emitted when the submission fails, with Drupal's JSON:API error document, or `undefined` when no response arrived.")
    expect(events.submit.type).toStrictEqual({ names: ['object'] })
    expect(events.reset.type).toBeUndefined()
    expect(templateData.find((item) => item.id === 'module:DruxtEntityForm.events')).toBeDefined()
  })
})
