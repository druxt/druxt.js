export function parseArgs(argv) {
  const opts = { examples: null, skipLighthouse: false, updateBaseline: false, outDir: null }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const [flag, inline] = arg.split('=')
    const next = () => (inline !== undefined ? inline : argv[++i])
    if (flag === '--example') (opts.examples ||= []).push(next())
    else if (flag === '--skip-lighthouse') opts.skipLighthouse = true
    else if (flag === '--update-baseline') opts.updateBaseline = true
    else if (flag === '--out') opts.outDir = next()
    else throw new Error(`Unknown option: ${arg}`)
  }
  return opts
}
