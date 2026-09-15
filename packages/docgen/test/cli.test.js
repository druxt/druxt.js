jest.mock('consola', () => ({ error: jest.fn() }))

const mockGenerateDocs = jest.fn(() => Promise.resolve())
const MockDruxtDocgen = jest.fn(() => ({ generateDocs: mockGenerateDocs }))
// The CLI imports `..` from src/druxt-docgen, which is src/index.js.
jest.mock('../src', () => ({ DruxtDocgen: MockDruxtDocgen }))

// The CLI runs on import: yargs reads process.argv, the docgen is built
// and generateDocs is awaited. Load it fresh per case.
const run = (args) => {
  process.argv = ['node', 'druxt-docgen', ...args]
  jest.isolateModules(() => {
    require('../src/druxt-docgen')
  })
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe('druxt-docgen CLI', () => {
  const argv = process.argv

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    process.argv = argv
  })

  test('defaults the destination to content', async () => {
    await run([])
    expect(MockDruxtDocgen).toHaveBeenCalledWith({ destination: 'content' })
    expect(mockGenerateDocs).toHaveBeenCalledTimes(1)
  })

  test('passes --destination to the docgen', async () => {
    await run(['--destination', 'site-content'])
    expect(MockDruxtDocgen).toHaveBeenCalledWith({ destination: 'site-content' })
    expect(mockGenerateDocs).toHaveBeenCalledTimes(1)
  })
})
