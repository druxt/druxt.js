'use strict'

/**
 * Minimal argv parser for the druxt-inspect CLI.
 *
 * Intentionally dependency-free: the CLI's argument surface is five
 * commands with a handful of options, and staying dependency-free means the
 * package runs against nothing but its `druxt`/`druxt-schema` workspace
 * links - no registry fetch needed to use it.
 *
 * Supports:
 * - long options: `--baseUrl <url>`, `--baseUrl=<url>`, flags (`--json`)
 * - short options: `-b <url>`, `-l <n>`, grouped flags (`-Vh`)
 * - `--` terminator: everything after it is a positional argument
 */

const OPTIONS = {
  b: { long: 'baseUrl', value: true },
  h: { long: 'help', value: false },
  j: { long: 'json', value: false },
  l: { long: 'limit', value: true },
  m: { long: 'mode', value: true },
  o: { long: 'output', value: true },
  V: { long: 'version', value: false },
}

/**
 * Parses an argv array (excluding node and script path).
 *
 * @param {string[]} [argv] - The arguments to parse.
 *
 * @returns {{ command: string|null, args: string[], options: object }} The
 *   parsed command line. Unknown options throw.
 */
const parseArgs = (argv = []) => {
  const options = {}
  const args = []
  let terminated = false

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]

    if (terminated || arg === '-' || !arg.startsWith('-')) {
      args.push(arg)
      continue
    }

    if (arg === '--') {
      terminated = true
      continue
    }

    if (arg.startsWith('--')) {
      const [name, inline] = arg.slice(2).split('=')
      const opt = Object.values(OPTIONS).find((o) => o.long === name)
      if (!opt) throw new Error(`Unknown option '--${name}'.`)

      if (!opt.value) {
        options[opt.long] = true
      } else if (inline !== undefined) {
        options[opt.long] = inline
      } else if (i + 1 < argv.length) {
        options[opt.long] = argv[++i]
      } else {
        throw new Error(`Option '--${name}' expects a value.`)
      }
      continue
    }

    // Short options, possibly grouped: -Vh, -l 3, -b=http://...
    const chars = arg.slice(1)
    for (let c = 0; c < chars.length; c++) {
      const short = chars[c]
      const opt = OPTIONS[short]
      if (!opt) throw new Error(`Unknown option '-${short}'.`)

      if (!opt.value) {
        options[opt.long] = true
        continue
      }

      const rest = chars.slice(c + 1)
      if (rest.startsWith('=')) {
        options[opt.long] = rest.slice(1)
      } else if (rest) {
        options[opt.long] = rest
      } else if (i + 1 < argv.length) {
        options[opt.long] = argv[++i]
      } else {
        throw new Error(`Option '-${short}' expects a value.`)
      }
      break
    }
  }

  return { command: args[0] || null, args: args.slice(1), options }
}

module.exports = { OPTIONS, parseArgs }
