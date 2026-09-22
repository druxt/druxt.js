import { processCache, resetProcessCache } from '../../src/utils/processCache'

test('processCache is server only', () => {
  resetProcessCache()
  // The default jest environment has a window, as a browser does.
  expect(processCache('index', { ttl: 300, axios: { defaults: { headers: { common: {} } } } })).toBe(null)
})
