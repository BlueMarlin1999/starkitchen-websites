import postgres from 'postgres'
import { z } from 'zod'

const STATE_TABLE_NAME = 'sk_state_store'
const databaseUrl = (process.env.DATABASE_URL || '').trim()
const blobReadWriteToken = (process.env.BLOB_READ_WRITE_TOKEN || '').trim()
const blobFallbackEnabled = process.env.PERSISTENT_JSON_BLOB_ENABLED === '1'
const blobNamespacePrefix = ((process.env.PERSISTENT_STATE_BLOB_PREFIX || 'sk-state').trim() || 'sk-state').replace(
  /[^a-zA-Z0-9/_-]+/g,
  '-'
)

const namespaceSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-zA-Z0-9/_-]+$/)

let sqlClient: postgres.Sql | null = null
let ensureTablePromise: Promise<void> | null = null

const getSqlClient = () => {
  if (!databaseUrl) return null
  if (!sqlClient) {
    sqlClient = postgres(databaseUrl, {
      prepare: true,
      ssl: 'require',
      max: 1,
      idle_timeout: 20,
      connect_timeout: 15,
    })
  }
  return sqlClient
}

const requireSqlClient = () => {
  const client = getSqlClient()
  if (!client) {
    throw new Error('DATABASE_URL_NOT_CONFIGURED')
  }
  return client
}

const ensureStateTable = async () => {
  const sql = requireSqlClient()
  if (!ensureTablePromise) {
    ensureTablePromise = (async () => {
      try {
        await sql`
          create table if not exists sk_state_store (
            namespace text primary key,
            payload jsonb not null,
            updated_at timestamptz not null default now()
          )
        `
      } catch (error) {
        // Allow a future retry if database connectivity is temporarily unavailable.
        ensureTablePromise = null
        throw error
      }
    })()
  }
  await ensureTablePromise
}

const normalizeNamespace = (namespace: string) => namespaceSchema.parse(namespace)
const serializePayload = (payload: unknown) => JSON.stringify(payload ?? null)
const isBlobStoreEnabled = () => blobFallbackEnabled && Boolean(blobReadWriteToken)
const resolveBlobStoreId = (token: string) => {
  const parts = token.split('_')
  return parts[3] || ''
}
const encodeBlobPathname = (pathname: string) => pathname.split('/').map((part) => encodeURIComponent(part)).join('/')
const buildPrivateBlobUrl = (pathname: string) => {
  const storeId = resolveBlobStoreId(blobReadWriteToken)
  if (!storeId) throw new Error('BLOB_TOKEN_STORE_ID_INVALID')
  return `https://${storeId}.private.blob.vercel-storage.com/${encodeBlobPathname(pathname)}`
}
const buildBlobApiUrl = (pathname: string) => {
  const params = new URLSearchParams({ pathname })
  return `https://vercel.com/api/blob/?${params.toString()}`
}
const namespaceToBlobPath = (namespace: string) => {
  const normalizedNamespace = normalizeNamespace(namespace).replaceAll('/', '__')
  return `${blobNamespacePrefix}/${normalizedNamespace}.json`
}

const readBlobState = async <T>(namespace: string): Promise<T | null> => {
  if (!isBlobStoreEnabled()) return null
  try {
    const pathname = namespaceToBlobPath(namespace)
    const response = await fetch(buildPrivateBlobUrl(pathname), {
      method: 'GET',
      headers: {
        authorization: `Bearer ${blobReadWriteToken}`,
        'cache-control': 'no-cache',
      },
      cache: 'no-store',
    })
    if (response.status === 404) return null
    if (!response.ok) return null
    const raw = await response.text()
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

const writeBlobState = async (namespace: string, payload: unknown) => {
  if (!isBlobStoreEnabled()) {
    throw new Error('BLOB_READ_WRITE_TOKEN_NOT_CONFIGURED')
  }
  const pathname = namespaceToBlobPath(namespace)
  const response = await fetch(buildBlobApiUrl(pathname), {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${blobReadWriteToken}`,
      'x-api-version': '12',
      'x-vercel-blob-access': 'private',
      'x-add-random-suffix': '0',
      'x-allow-overwrite': '1',
      'x-content-type': 'application/json',
      'x-cache-control-max-age': '60',
      'content-type': 'application/json',
    },
    body: serializePayload(payload),
  })
  if (!response.ok) {
    throw new Error(`BLOB_WRITE_FAILED_${response.status}`)
  }
}

export const isPersistentJsonStoreEnabled = () => Boolean(getSqlClient()) || isBlobStoreEnabled()

export const readPersistentJsonState = async <T>(namespace: string): Promise<T | null> => {
  const sql = getSqlClient()
  if (sql) {
    try {
      await ensureStateTable()
      const normalizedNamespace = normalizeNamespace(namespace)
      const rows = await sql<{ payload: T }[]>`
        select payload
        from sk_state_store
        where namespace = ${normalizedNamespace}
        limit 1
      `
      const payload = rows[0]?.payload || null
      if (payload) return payload
    } catch {
      // Fallback to blob store below if available.
    }
  }
  return readBlobState<T>(namespace)
}

export const writePersistentJsonState = async (namespace: string, payload: unknown) => {
  const sql = getSqlClient()
  if (sql) {
    try {
      await ensureStateTable()
      const normalizedNamespace = normalizeNamespace(namespace)
      const serializedPayload = serializePayload(payload)
      await sql`
        insert into sk_state_store (namespace, payload, updated_at)
        values (${normalizedNamespace}, ${serializedPayload}::jsonb, now())
        on conflict (namespace)
        do update set
          payload = excluded.payload,
          updated_at = excluded.updated_at
      `
      return
    } catch {
      // Fallback to blob store below if available.
    }
  }

  if (isBlobStoreEnabled()) {
    try {
      await writeBlobState(namespace, payload)
      return
    } catch {
      // Gracefully degrade to in-memory/disk callers instead of breaking request flow.
    }
  }
}

export const persistentJsonStoreTableName = () => STATE_TABLE_NAME
