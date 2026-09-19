export function parseArgs(argv) {
  const opts = { examples: null, skipLighthouse: false, skipHydration: false, updateBaseline: false, outDir: null }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const [flag, inline] = arg.split('=')
    const next = () => {
      const value = inline !== undefined ? inline : argv[i + 1]
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`)
      if (inline === undefined) i++
      return value
    }
    if (flag === '--example') (opts.examples ||= []).push(next())
    else if (flag === '--skip-lighthouse') opts.skipLighthouse = true
    else if (flag === '--skip-hydration') opts.skipHydration = true
    else if (flag === '--update-baseline') opts.updateBaseline = true
    else if (flag === '--out') opts.outDir = next()
    else throw new Error(`Unknown option: ${arg}`)
  }
  return opts
}
