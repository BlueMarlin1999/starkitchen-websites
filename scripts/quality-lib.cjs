const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

const ROOT = process.cwd()
const SOURCE_DIRS = ['src', 'scripts']
const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs'])
const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  'coverage',
  'dist',
  'build',
  'out',
  '.vercel',
])

const walkFiles = (targetDir) => {
  const fullPath = path.resolve(ROOT, targetDir)
  if (!fs.existsSync(fullPath)) return []

  const result = []
  const queue = [fullPath]

  while (queue.length > 0) {
    const current = queue.pop()
    const stats = fs.statSync(current)
    if (stats.isDirectory()) {
      const basename = path.basename(current)
      if (EXCLUDED_DIRS.has(basename)) continue
      const entries = fs.readdirSync(current)
      for (const entry of entries) {
        queue.push(path.join(current, entry))
      }
      continue
    }

    const ext = path.extname(current)
    if (CODE_EXTENSIONS.has(ext)) {
      result.push(current)
    }
  }

  return result
}

const toRelative = (targetPath) => path.relative(ROOT, targetPath).replace(/\\/g, '/')

const getAllCodeFiles = () => SOURCE_DIRS.flatMap((dir) => walkFiles(dir)).sort()

const getSourceFilesForFunctionScan = () =>
  walkFiles('src').filter((file) => ['.ts', '.tsx', '.js', '.jsx'].includes(path.extname(file)))

const detectLongFunctions = (filePath, maxLines = 50) => {
  const text = fs.readFileSync(filePath, 'utf8')
  const ext = path.extname(filePath)
  const scriptKind =
    ext === '.tsx'
      ? ts.ScriptKind.TSX
      : ext === '.jsx'
        ? ts.ScriptKind.JSX
        : ext === '.js'
          ? ts.ScriptKind.JS
          : ts.ScriptKind.TS
  const sourceFile = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, scriptKind)

  const rows = []

  const readFunctionName = (node) => {
    if (node.name && node.name.escapedText) return String(node.name.escapedText)
    if (
      node.parent &&
      ts.isVariableDeclaration(node.parent) &&
      node.parent.name &&
      node.parent.name.escapedText
    ) {
      return String(node.parent.name.escapedText)
    }
    if (node.parent && ts.isPropertyAssignment(node.parent) && node.parent.name) {
      return node.parent.name.getText(sourceFile)
    }
    return '(anonymous)'
  }

  const visit = (node) => {
    const isFunctionLike =
      ts.isFunctionDeclaration(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isArrowFunction(node) ||
      ts.isFunctionExpression(node)

    if (isFunctionLike && node.body) {
      const start = sourceFile.getLineAndCharacterOfPosition(node.body.getStart(sourceFile)).line + 1
      const end = sourceFile.getLineAndCharacterOfPosition(node.body.getEnd()).line + 1
      const length = end - start + 1
      if (length > maxLines) {
        rows.push({
          rule: 'function-max-lines',
          file: toRelative(filePath),
          line: start,
          detail: `${readFunctionName(node)} has ${length} lines (limit ${maxLines})`,
        })
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return rows
}

const isLikelyCommentedCodeLine = (line) => {
  if (!/^\s*\/\//.test(line)) return false
  const body = line.replace(/^\s*\/\/\s?/, '')
  if (!body || body.length < 4) return false

  const patterns = [
    /^(const|let|var)\s+[A-Za-z_$][\w$]*\s*=/,
    /^(if|for|while|switch|try|catch|return|throw)\b/,
    /^(import|export)\b/,
    /^(async\s+)?function\b/,
    /^[A-Za-z_$][\w$]*\([^)]*\)\s*\{/,
    /;\s*$/,
    /^\{.*\}\s*$/,
  ]
  return patterns.some((pattern) => pattern.test(body))
}

const findLineViolations = (filePath) => {
  const text = fs.readFileSync(filePath, 'utf8')
  const lines = text.split(/\r?\n/)
  const rows = []
  const now = Date.now()
  const maxAgeMs = 24 * 60 * 60 * 1000

  const push = (line, rule, detail) => {
    rows.push({
      rule,
      file: toRelative(filePath),
      line,
      detail,
    })
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const lineNo = index + 1

    if (/\bconsole\.(log|debug|info)\s*\(/.test(line) || /\bprint\s*\(/.test(line)) {
      push(lineNo, 'no-debug-output', 'Debug output detected (console.log/debug/info or print)')
    }

    if (isLikelyCommentedCodeLine(line)) {
      push(lineNo, 'no-commented-code', 'Commented-out code detected')
    }

    if (/^\s*(\/\/|\/\*)/.test(line) && /(TODO|FIXME|XXX)/.test(line)) {
      const match = line.match(/(?:TODO|FIXME|XXX)\((\d{4}-\d{2}-\d{2})\)/)
      if (!match) {
        push(
          lineNo,
          'todo-expired',
          'TODO/FIXME/XXX must include date in TODO(YYYY-MM-DD). Undated items are treated as expired.'
        )
        continue
      }
      const dueDate = new Date(`${match[1]}T00:00:00.000Z`).getTime()
      if (!Number.isFinite(dueDate) || now - dueDate > maxAgeMs) {
        push(lineNo, 'todo-expired', `TODO/FIXME/XXX expired (>24h): ${match[1]}`)
      }
    }

    if (/sk-[A-Za-z0-9]{20,}/.test(line)) {
      push(lineNo, 'no-secrets', 'Potential API key literal detected (sk-*)')
    }

    if (
      /(api[_-]?key|secret|token|password)\s*[:=]\s*['"`][^'"`\n]{8,}['"`]/i.test(line) &&
      !/process\.env/.test(line)
    ) {
      push(lineNo, 'no-secrets', 'Potential secret literal assignment detected')
    }
  }

  return rows
}

const getApiRouteFiles = () =>
  walkFiles('src/app/api').filter((file) => /\/route\.ts$/.test(file) || /\\route\.ts$/.test(file))

const findExternalInputValidationViolations = () => {
  const rows = []
  for (const routeFile of getApiRouteFiles()) {
    const text = fs.readFileSync(routeFile, 'utf8')
    const readsExternalInput =
      /request\.json\s*\(/.test(text) ||
      /request\.formData\s*\(/.test(text) ||
      /searchParams\.get\s*\(/.test(text)
    if (!readsExternalInput) continue

    const hasZod =
      /from ['"]zod['"]/.test(text) ||
      /z\.object\s*\(/.test(text) ||
      /\.safeParse\s*\(/.test(text) ||
      /z\.[A-Za-z]+\s*\(/.test(text)
    if (!hasZod) {
      rows.push({
        rule: 'external-input-validation',
        file: toRelative(routeFile),
        line: 1,
        detail: 'External input detected but Zod validation not found',
      })
    }
  }
  return rows
}

const listModuleFilesForTests = () =>
  walkFiles('src').filter((file) => {
    const rel = toRelative(file)
    if (rel.includes('/__tests__/')) return false
    if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(rel)) return false
    if (!/\.(ts|tsx)$/.test(rel)) return false
    if (rel.startsWith('src/lib/')) return true
    if (rel.startsWith('src/store/')) return true
    if (rel.startsWith('src/app/api/')) return /\/route\.ts$/.test(rel)
    return false
  })

const candidateTestFiles = (moduleFile) => {
  const rel = toRelative(moduleFile)
  const noExt = rel.replace(/\.(ts|tsx)$/, '')
  const ext = path.extname(rel)
  const tests = [
    `${noExt}.test${ext}`,
    `${noExt}.spec${ext}`,
    `${noExt}.test.ts`,
    `${noExt}.spec.ts`,
    `tests/${noExt}.test.ts`,
    `tests/${noExt}.spec.ts`,
    `tests/${noExt}.test.tsx`,
    `tests/${noExt}.spec.tsx`,
  ]
  return tests.map((target) => path.resolve(ROOT, target))
}

const findMissingUnitTests = () => {
  const rows = []
  const modules = listModuleFilesForTests()
  for (const moduleFile of modules) {
    const tests = candidateTestFiles(moduleFile)
    const exists = tests.some((testFile) => fs.existsSync(testFile))
    if (!exists) {
      rows.push({
        rule: 'module-unit-test',
        file: toRelative(moduleFile),
        line: 1,
        detail: 'Missing unit test file for module',
      })
    }
  }
  return rows
}

const readCoverageSummary = () => {
  const target = path.resolve(ROOT, 'coverage/coverage-summary.json')
  if (!fs.existsSync(target)) return null
  try {
    return JSON.parse(fs.readFileSync(target, 'utf8'))
  } catch {
    return null
  }
}

const findCoverageViolations = (threshold = 80) => {
  const rows = []
  const summary = readCoverageSummary()
  if (!summary || typeof summary !== 'object') {
    rows.push({
      rule: 'coverage-threshold',
      file: 'coverage/coverage-summary.json',
      line: 1,
      detail: 'Coverage summary missing. Run unit tests with coverage output first.',
    })
    return rows
  }

  const moduleFiles = listModuleFilesForTests().map((file) => toRelative(file))
  const seen = new Set()

  for (const [key, value] of Object.entries(summary)) {
    if (key === 'total') continue
    const normalized = key.replace(/\\/g, '/')
    const rel = normalized.startsWith(ROOT.replace(/\\/g, '/'))
      ? normalized.slice(ROOT.length + 1)
      : normalized

    if (!moduleFiles.includes(rel)) continue
    seen.add(rel)

    const metrics = value || {}
    const items = [
      ['lines', metrics.lines?.pct],
      ['statements', metrics.statements?.pct],
      ['functions', metrics.functions?.pct],
      ['branches', metrics.branches?.pct],
    ]
    for (const [name, pct] of items) {
      if (typeof pct !== 'number' || pct < threshold) {
        rows.push({
          rule: 'coverage-threshold',
          file: rel,
          line: 1,
          detail: `${name} coverage ${typeof pct === 'number' ? pct.toFixed(1) : 'N/A'}% < ${threshold}%`,
        })
      }
    }
  }

  for (const moduleFile of moduleFiles) {
    if (!seen.has(moduleFile)) {
      rows.push({
        rule: 'coverage-threshold',
        file: moduleFile,
        line: 1,
        detail: `Coverage record missing for module (required >= ${threshold}%)`,
      })
    }
  }

  return rows
}

const collectQualityViolations = () => {
  const rows = []

  for (const sourceFile of getSourceFilesForFunctionScan()) {
    rows.push(...detectLongFunctions(sourceFile, 50))
  }
  for (const file of getAllCodeFiles()) {
    rows.push(...findLineViolations(file))
  }
  rows.push(...findExternalInputValidationViolations())
  rows.push(...findMissingUnitTests())
  rows.push(...findCoverageViolations(80))

  return rows
}

const groupViolations = (rows) => {
  const grouped = new Map()
  for (const row of rows) {
    if (!grouped.has(row.rule)) grouped.set(row.rule, [])
    grouped.get(row.rule).push(row)
  }
  return grouped
}

module.exports = {
  ROOT,
  getAllCodeFiles,
  getSourceFilesForFunctionScan,
  toRelative,
  collectQualityViolations,
  groupViolations,
  isLikelyCommentedCodeLine,
}
