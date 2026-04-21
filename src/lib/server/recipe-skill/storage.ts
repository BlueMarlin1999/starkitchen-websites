import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'
import {
  RecipePromptType,
  RecipeSkillData,
  RecipeSkillRecord,
} from '@/lib/server/recipe-skill/types'
import {
  isPersistentJsonStoreEnabled,
  readPersistentJsonState,
  writePersistentJsonState,
} from '@/lib/server/persistent-json-store'

const DEFAULT_RECIPE_DATA_DIR = '/tmp/starkitchen-recipes'
const MAX_LIST_SIZE = 100
const RECIPE_STATE_NAMESPACE = 'recipe/records'

type RecipeStatePayload = {
  records: RecipeSkillRecord[]
}

const clip = (value: unknown, fallback = '', max = 300) => {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim()
  return normalized ? normalized.slice(0, max) : fallback
}

const parseInteger = (value: string | null, fallback: number, min: number, max: number) => {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(min, Math.min(max, parsed))
}

const ensureDataDir = async () => {
  const targetDir = (process.env.RECIPE_DATA_DIR || DEFAULT_RECIPE_DATA_DIR).trim() || DEFAULT_RECIPE_DATA_DIR
  await mkdir(targetDir, { recursive: true })
  return targetDir
}

const safeRecipeId = (value: string) => (/^[a-zA-Z0-9_-]{6,80}$/.test(value) ? value : '')

const buildRecipeFilePath = async (recipeId: string) => {
  const dataDir = await ensureDataDir()
  return join(dataDir, `${recipeId}.json`)
}

const nowTimestamp = () => new Date().toISOString()

const buildRecipeId = () => {
  const now = new Date()
  const yyyy = now.getFullYear().toString()
  const mm = `${now.getMonth() + 1}`.padStart(2, '0')
  const dd = `${now.getDate()}`.padStart(2, '0')
  const hh = `${now.getHours()}`.padStart(2, '0')
  const mi = `${now.getMinutes()}`.padStart(2, '0')
  const ss = `${now.getSeconds()}`.padStart(2, '0')
  const random = randomBytes(3).toString('hex')
  return `${yyyy}${mm}${dd}${hh}${mi}${ss}-${random}`
}

const normalizeRecord = (value: unknown): RecipeSkillRecord | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Partial<RecipeSkillRecord>
  const normalizedId = safeRecipeId(clip(record.id, '', 80))
  if (!normalizedId) return null
  if (!record.recipeJson || typeof record.recipeJson !== 'object') return null

  return {
    id: normalizedId,
    name: clip(record.name, '未命名菜品', 120),
    cuisine: clip(record.cuisine, '未分类', 80),
    version: clip(record.version, 'v1.0', 20),
    promptType:
      record.promptType === 'recipe' || record.promptType === 'menu_copy' || record.promptType === 'costing'
        ? record.promptType
        : 'recipe',
    userInput: clip(record.userInput, '', 4000),
    validationStatus:
      record.validationStatus === '通过' || record.validationStatus === '失败' || record.validationStatus === '草稿'
        ? record.validationStatus
        : '草稿',
    tokensUsed:
      typeof record.tokensUsed === 'number' && Number.isFinite(record.tokensUsed)
        ? Math.max(0, Math.round(record.tokensUsed))
        : 0,
    createdBy: clip(record.createdBy, 'manager', 80),
    createdAt: clip(record.createdAt, nowTimestamp(), 60),
    updatedAt: clip(record.updatedAt, nowTimestamp(), 60),
    recipeJson: record.recipeJson as RecipeSkillData,
  }
}

const sortRecipeRecords = (records: RecipeSkillRecord[]) =>
  [...records].sort((left, right) => right.createdAt.localeCompare(left.createdAt))

const normalizeRecordCollection = (value: unknown) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []
  const payload = value as Partial<RecipeStatePayload>
  if (!Array.isArray(payload.records)) return []

  return sortRecipeRecords(
    payload.records
      .map((item) => normalizeRecord(item))
      .filter(Boolean) as RecipeSkillRecord[]
  )
}

const saveRecipeRecordToDisk = async (record: RecipeSkillRecord) => {
  const target = await buildRecipeFilePath(record.id)
  await writeFile(target, JSON.stringify(record, null, 2), 'utf8')
  return record
}

const readRecipeRecordFromDisk = async (recipeId: string) => {
  const safeId = safeRecipeId(recipeId)
  if (!safeId) return null
  const target = await buildRecipeFilePath(safeId)
  try {
    const raw = await readFile(target, 'utf8')
    return normalizeRecord(JSON.parse(raw))
  } catch {
    return null
  }
}

export const createAndSaveRecipeRecord = async (input: {
  promptType: RecipePromptType
  userInput: string
  data: RecipeSkillData
  validationStatus: RecipeSkillRecord['validationStatus']
  tokensUsed: number
  createdBy: string
}) => {
  const now = nowTimestamp()
  const record: RecipeSkillRecord = {
    id: buildRecipeId(),
    name: clip(input.data.recipe_meta.recipe_name, '未命名菜品', 120),
    cuisine: clip(input.data.recipe_meta.cuisine, '未分类', 80),
    version: clip(input.data.recipe_meta.version, 'v1.0', 20),
    promptType: input.promptType,
    userInput: clip(input.userInput, '', 4000),
    validationStatus: input.validationStatus,
    tokensUsed: Math.max(0, Math.round(input.tokensUsed)),
    createdBy: clip(input.createdBy, 'manager', 80),
    createdAt: now,
    updatedAt: now,
    recipeJson: input.data,
  }
  return saveRecipeRecord(record)
}

const listRecipeFiles = async () => {
  const dataDir = await ensureDataDir()
  try {
    const names = await readdir(dataDir)
    return names.filter((name) => name.endsWith('.json'))
  } catch {
    return []
  }
}

const readRecipeRecordsFromDisk = async () => {
  const dataDir = await ensureDataDir()
  const files = await listRecipeFiles()
  const records = await Promise.all(
    files.map(async (name) => {
      try {
        const raw = await readFile(join(dataDir, name), 'utf8')
        return normalizeRecord(JSON.parse(raw))
      } catch {
        return null
      }
    })
  )
  return sortRecipeRecords(records.filter(Boolean) as RecipeSkillRecord[])
}

const readRecipeRecordsFromStore = async () => {
  const payload = await readPersistentJsonState<RecipeStatePayload>(RECIPE_STATE_NAMESPACE)
  if (payload !== null) {
    return normalizeRecordCollection(payload)
  }

  const seeded = await readRecipeRecordsFromDisk()
  await writePersistentJsonState(RECIPE_STATE_NAMESPACE, {
    records: seeded,
  } satisfies RecipeStatePayload)
  return seeded
}

const readRecipeRecords = async () => {
  if (!isPersistentJsonStoreEnabled()) {
    return readRecipeRecordsFromDisk()
  }

  try {
    return await readRecipeRecordsFromStore()
  } catch {
    return readRecipeRecordsFromDisk()
  }
}

const writeRecipeRecordsToStore = async (records: RecipeSkillRecord[]) => {
  await writePersistentJsonState(RECIPE_STATE_NAMESPACE, {
    records: sortRecipeRecords(records),
  } satisfies RecipeStatePayload)
}

export const saveRecipeRecord = async (record: RecipeSkillRecord) => {
  const normalized = normalizeRecord(record)
  if (!normalized) {
    throw new Error('INVALID_RECIPE_RECORD')
  }

  if (!isPersistentJsonStoreEnabled()) {
    return saveRecipeRecordToDisk(normalized)
  }

  try {
    const current = await readRecipeRecordsFromStore()
    const next = sortRecipeRecords([normalized, ...current.filter((item) => item.id !== normalized.id)])
    await writeRecipeRecordsToStore(next)
    return normalized
  } catch {
    return saveRecipeRecordToDisk(normalized)
  }
}

export const readRecipeRecord = async (recipeId: string) => {
  const safeId = safeRecipeId(recipeId)
  if (!safeId) return null

  if (!isPersistentJsonStoreEnabled()) {
    return readRecipeRecordFromDisk(safeId)
  }

  try {
    const records = await readRecipeRecords()
    return records.find((item) => item.id === safeId) || null
  } catch {
    return readRecipeRecordFromDisk(safeId)
  }
}

export const listRecipeRecords = async (page = 1, size = 20) => {
  const normalizedPage = Math.max(1, Math.round(page))
  const normalizedSize = Math.max(1, Math.min(MAX_LIST_SIZE, Math.round(size)))
  const records = await readRecipeRecords()

  const total = records.length
  const start = (normalizedPage - 1) * normalizedSize
  const pageItems = records.slice(start, start + normalizedSize)

  return {
    total,
    page: normalizedPage,
    size: normalizedSize,
    recipes: pageItems,
  }
}

export const parseRecipeListPagination = (searchParams: URLSearchParams) => ({
  page: parseInteger(searchParams.get('page'), 1, 1, 9999),
  size: parseInteger(searchParams.get('size'), 20, 1, MAX_LIST_SIZE),
})
