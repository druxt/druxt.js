'use strict'

const { parseArgs } = require('../src/args')

describe('parseArgs', () => {
  test('parses command and positional args', () => {
    expect(parseArgs(['types'])).toEqual({ command: 'types', args: [], options: {} })
    expect(parseArgs(['schema', 'node--recipe'])).toEqual({ command: 'schema', args: ['node--recipe'], options: {} })
  })

  test('parses long options with values and flags', () => {
    const out = parseArgs(['schema', 'node--recipe', '--mode', 'card', '--json'])
    expect(out.command).toBe('schema')
    expect(out.args).toEqual(['node--recipe'])
    expect(out.options).toEqual({ mode: 'card', json: true })
  })

  test('supports --opt=value and negative-looking values', () => {
    expect(parseArgs(['--baseUrl=http://127.0.0.1:8888', 'types']).options.baseUrl).toBe('http://127.0.0.1:8888')
  })

  test('parses short options, grouping and attached values', () => {
    expect(parseArgs(['-Vh']).options).toEqual({ version: true, help: true })
    expect(parseArgs(['-l', '5', 'sample']).options.limit).toBe('5')
    expect(parseArgs(['-l5', 'sample']).options.limit).toBe('5')
    expect(parseArgs(['-b=http://x', 'types']).options.baseUrl).toBe('http://x')
  })

  test('treats everything after -- as positional', () => {
    const out = parseArgs(['sample', '--', '--json'])
    expect(out.args).toEqual(['--json'])
    expect(out.options.json).toBeUndefined()
  })

  test('throws on unknown options and missing values', () => {
    expect(() => parseArgs(['--nope'])).toThrow("Unknown option '--nope'")
    expect(() => parseArgs(['-z'])).toThrow("Unknown option '-z'")
    expect(() => parseArgs(['--mode'])).toThrow("Option '--mode' expects a value")
  })
})
