// Renders a comparison as JSON and as the Markdown printed to the log.
const cell = (value) => (value === null || value === undefined ? 'n/a' : String(value))

export function toMarkdown({ rows, breaches }, meta) {
  const lines = [`# Performance audit`, '', `Generated ${meta.generatedAt} at ${meta.commit}. ${breaches} budget breach${breaches === 1 ? '' : 'es'}.`, '']
  const examples = [...new Set(rows.map((row) => row.example))]
  for (const example of examples) {
    lines.push(`## ${example}`, '', '| Route | Metric | Current | Baseline | Delta | Breach |', '| --- | --- | --- | --- | --- | --- |')
    for (const row of rows.filter((r) => r.example === example)) {
      const breachCell = row.breach || ''
      lines.push(`| ${row.route} | ${row.metric} | ${cell(row.current)} | ${cell(row.baseline)} |${row.delta === null ? ' ' : ` ${row.delta} `}|${breachCell ? ` ${breachCell} ` : ' '}|`)
    }
    lines.push('')
  }
  return lines.join('\n')
}

export function toJson(run, comparison, meta) {
  return { meta, breaches: comparison.breaches, rows: comparison.rows, run }
}
