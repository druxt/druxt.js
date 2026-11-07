import { vi } from 'vitest'
import { drupal, index } from '../unit/fake-drupal'

// Every component test starts with a Drupal that has an index and nothing else.
vi.stubGlobal('fetch', drupal({ 'GET /jsonapi': index() }).fetch)
