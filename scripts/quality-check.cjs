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

const readBaseline = () => {
  if (!fs.existsSync(BASELINE_PATH)) {
    return {
      rules: {},
      found: false,
    }
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'))
    if (!parsed || typeof parsed !== 'object' || typeof parsed.rules !== 'object') {
      return {
        rules: {},
        found: false,
      }
    }
    return {
      rules: parsed.rules,
      found: true,
    }
  } catch {
    return {
      rules: {},
      found: false,
    }
  }
}

const sortRulesByName = (rows) => [...rows].sort((left, right) => left.rule.localeCompare(right.rule))

const rows = collectQualityViolations()
const grouped = groupViolations(rows)
const baseline = readBaseline()

if (rows.length === 0) {
  process.stdout.write('Quality gate passed: no violations found.\n')
  process.exit(0)
}

const currentRuleCounts = sortRulesByName(
  Array.from(grouped.entries()).map(([rule, issues]) => ({
    rule,
    count: issues.length,
  }))
)

const evaluation = currentRuleCounts.map((item) => {
  const baselineCount = Number.isFinite(Number(baseline.rules[item.rule]))
    ? Number(baseline.rules[item.rule])
    : 0
  const isCritical = CRITICAL_RULES.has(item.rule)
  const exceedsBaseline = item.count > baselineCount
  const isNewRule = baselineCount === 0 && item.count > 0 && !Object.prototype.hasOwnProperty.call(baseline.rules, item.rule)
  const shouldFail = isCritical ? item.count > 0 : exceedsBaseline || isNewRule
  return {
    ...item,
    baselineCount,
    isCritical,
    shouldFail,
    exceedsBaseline,
    isNewRule,
  }
})

const failedRules = evaluation.filter((item) => item.shouldFail)

if (!baseline.found) {
  process.stdout.write('\nQuality gate failed.\n')
  process.stdout.write(`Total violations: ${rows.length}\n`)
  process.stdout.write(`Rules impacted: ${grouped.size}\n\n`)
  process.stdout.write(`Missing baseline file: ${BASELINE_PATH}\n`)
  process.stdout.write('Run `npm run quality:baseline` once to capture legacy debt baseline.\n')
  process.exit(1)
}

if (failedRules.length === 0) {
  process.stdout.write('\nQuality gate passed with baseline guard.\n')
  process.stdout.write(`Total legacy violations tracked: ${rows.length}\n`)
  process.stdout.write('No critical violations and no baseline regressions detected.\n\n')
  for (const item of evaluation) {
    process.stdout.write(
      `- ${item.rule}: current ${item.count}, baseline ${item.baselineCount}${item.count < item.baselineCount ? ' (improved)' : ''}\n`
    )
  }
  process.exit(0)
}

process.stdout.write('\nQuality gate failed.\n')
process.stdout.write(`Total violations: ${rows.length}\n`)
process.stdout.write(`Rules impacted: ${grouped.size}\n`)
process.stdout.write(`Failed rules: ${failedRules.length}\n\n`)

for (const item of failedRules) {
  const issues = grouped.get(item.rule) || []
  process.stdout.write(`[${item.rule}] ${issues.length} issue(s)`)
  if (item.isCritical) {
    process.stdout.write(' [critical: must be zero]\n')
  } else if (item.isNewRule) {
    process.stdout.write(` [new rule; baseline had 0]\n`)
  } else {
    process.stdout.write(` [baseline ${item.baselineCount}]\n`)
  }
  const limit = 30
  for (const issue of issues.slice(0, limit)) {
    process.stdout.write(`- ${issue.file}:${issue.line} ${issue.detail}\n`)
  }
  if (issues.length > limit) {
    process.stdout.write(`- ... ${issues.length - limit} more issue(s)\n`)
  }
  process.stdout.write('\n')
}

process.exit(1)
