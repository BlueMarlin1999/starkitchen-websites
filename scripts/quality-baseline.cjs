#!/usr/bin/env node
const fs = require('node:fs')
const path = require('node:path')
const { ROOT, collectQualityViolations, groupViolations } = require('./quality-lib.cjs')

const BASELINE_PATH = path.resolve(ROOT, 'scripts/quality-baseline.json')
const CRITICAL_RULES = new Set([
  'no-secrets',
  'no-debug-output',
  'todo-expired',
  'no-commented-code',
  'external-input-validation',
])

const rows = collectQualityViolations()
const grouped = groupViolations(rows)
const criticalHits = Array.from(grouped.entries())
  .filter(([rule, issues]) => CRITICAL_RULES.has(rule) && issues.length > 0)
  .map(([rule, issues]) => ({ rule, count: issues.length }))

if (criticalHits.length > 0) {
  process.stdout.write('Cannot update baseline because critical violations exist.\n')
  for (const hit of criticalHits) {
    process.stdout.write(`- ${hit.rule}: ${hit.count}\n`)
  }
  process.exit(1)
}

const rules = {}
for (const [rule, issues] of grouped.entries()) {
  rules[rule] = issues.length
}

const snapshot = {
  version: 1,
  generatedAt: new Date().toISOString(),
  totalViolations: rows.length,
  rules,
}

fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')

process.stdout.write('Quality baseline updated.\n')
process.stdout.write(`- file: ${path.relative(ROOT, BASELINE_PATH).replace(/\\\\/g, '/')}\n`)
process.stdout.write(`- total violations tracked: ${rows.length}\n`)
for (const [rule, count] of Object.entries(rules).sort((left, right) => left[0].localeCompare(right[0]))) {
  process.stdout.write(`  - ${rule}: ${count}\n`)
}
