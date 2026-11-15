import { describe, expect, it, vi } from 'vitest'
import { reportUnknownModule } from '../../packages/core/src/runtime/utils/unknown'

describe('reportUnknownModule()', () => {
  it('logs each unknown module name once', () => {
    const warn = vi.fn()
    reportUnknownModule('not-a-real-module', 'DruxtNotARealModule', warn)
    reportUnknownModule('not-a-real-module', 'DruxtNotARealModule', warn)
    reportUnknownModule('another-typo', 'DruxtAnotherTypo', warn)
    expect(warn.mock.calls).toEqual([
      ["No Druxt module named 'not-a-real-module': DruxtNotARealModule is not registered."],
      ["No Druxt module named 'another-typo': DruxtAnotherTypo is not registered."],
    ])
  })

  it('stops remembering names at 100, logging a later name each time instead of growing without end', () => {
    const warn = vi.fn()
    for (let i = 0; i < 120; i++) reportUnknownModule(`typo-${i}`, `DruxtTypo${i}`, warn)
    expect(warn).toHaveBeenCalledTimes(120)
    warn.mockClear()
    reportUnknownModule('typo-0', 'DruxtTypo0', warn)
    reportUnknownModule('typo-119', 'DruxtTypo119', warn)
    reportUnknownModule('typo-119', 'DruxtTypo119', warn)
    // typo-0 was remembered; typo-119 came after the limit.
    expect(warn.mock.calls.map(([message]) => message)).toEqual([
      "No Druxt module named 'typo-119': DruxtTypo119 is not registered.",
      "No Druxt module named 'typo-119': DruxtTypo119 is not registered.",
    ])
  })
})
