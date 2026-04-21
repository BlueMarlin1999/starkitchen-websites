#!/usr/bin/env node
const fs = require('node:fs')
const path = require('node:path')
const { getAllCodeFiles, ROOT, isLikelyCommentedCodeLine, toRelative } = require('./quality-lib.cjs')

const maxAgeMs = 24 * 60 * 60 * 1000
const now = Date.now()

const isCommentLine = (line) => /^\s*(\/\/|\/\*)/.test(line)

const shouldDropTodoLine = (line) => {
  if (!isCommentLine(line)) return false
  if (!/(TODO|FIXME|XXX)/.test(line)) return false
  const match = line.match(/(?:TODO|FIXME|XXX)\((\d{4}-\d{2}-\d{2})\)/)
  if (!match) return true
  const timestamp = new Date(`${match[1]}T00:00:00.000Z`).getTime()
  return !Number.isFinite(timestamp) || now - timestamp > maxAgeMs
}

const shouldDropDebugLine = (line) =>
  /\bconsole\.(log|debug|info)\s*\(/.test(line) || /\bprint\s*\(/.test(line)

const shouldSkipFile = (filePath) => {
  const rel = toRelative(filePath)
  return rel.startsWith('scripts/quality-')
}

const collapseExtraBlankLines = (lines) => {
  const normalized = []
  let blankCount = 0
  for (const line of lines) {
    if (line.trim() === '') {
      blankCount += 1
      if (blankCount > 2) continue
      normalized.push(line)
      continue
    }
    blankCount = 0
    normalized.push(line)
  }
  return normalized
}

let updatedFiles = 0
let removedDebugLines = 0
let removedTodoLines = 0
let removedCommentedCodeLines = 0

for (const filePath of getAllCodeFiles()) {
  if (shouldSkipFile(filePath)) continue

  const original = fs.readFileSync(filePath, 'utf8')
  const lines = original.split(/\r?\n/)
  const next = []

  for (const line of lines) {
    if (shouldDropDebugLine(line)) {
      removedDebugLines += 1
      continue
    }

    if (shouldDropTodoLine(line)) {
      removedTodoLines += 1
      continue
    }

    if (isLikelyCommentedCodeLine(line)) {
      removedCommentedCodeLines += 1
      continue
    }

    next.push(line)
  }

  const normalized = collapseExtraBlankLines(next).join('\n')
  const finalText = normalized.endsWith('\n') ? normalized : `${normalized}\n`
  if (finalText !== original) {
    fs.writeFileSync(filePath, finalText, 'utf8')
    updatedFiles += 1
  }
}

process.stdout.write('Quality auto-fix completed.\n')
process.stdout.write(`- Updated files: ${updatedFiles}\n`)
process.stdout.write(`- Removed debug lines: ${removedDebugLines}\n`)
process.stdout.write(`- Removed expired TODO/FIXME/XXX lines: ${removedTodoLines}\n`)
process.stdout.write(`- Removed commented-out code lines: ${removedCommentedCodeLines}\n`)
process.stdout.write(`- Workspace: ${toRelative(path.resolve(ROOT)) || '.'}\n`)
