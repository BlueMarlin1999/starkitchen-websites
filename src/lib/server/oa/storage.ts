import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'
import {
  OaAuditAction,
  OaAuditEvent,
  OaAuditGeo,
  OaAttachment,
  OaCallMode,
  OaCallProvider,
  OaCallSession,
  OaContact,
  OaContactStatus,
  OaFileRecord,
  OaMessage,
  OaMeetingProvider,
  OaMeetingSession,
  OaMeetingStatus,
  OaOrgUnit,
  OaRoom,
  OaRoomType,
  OaStateSnapshot,
} from '@/lib/server/oa/types'
import {
  isPersistentJsonStoreEnabled,
  readPersistentJsonState,
  writePersistentJsonState,
} from '@/lib/server/persistent-json-store'
import { GaiaEmployeeRecord } from '@/lib/hr-workforce'

const DEFAULT_OA_DATA_DIR = '/tmp/starkitchen-oa'
const STATE_FILE_NAME = 'state.json'
const UPLOAD_DIR_NAME = 'uploads'
const OA_STATE_NAMESPACE = 'oa/state'

const MAX_ROOMS = 200
const MAX_MESSAGES = 15000
const MAX_FILES = 8000
const MAX_CALLS = 3000
const MAX_MEETINGS = 3000
const MAX_ORG_UNITS = 500
const MAX_CONTACTS = 30000
const MAX_AUDITS = 30000

const nowIso = () => new Date().toISOString()

const clip = (value: unknown, fallback = '', max = 200) => {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim()
  return normalized ? normalized.slice(0, max) : fallback
}

const normalizeArray = (value: unknown) =>
  Array.isArray(value) ? value.map((item) => clip(item, '', 80)).filter(Boolean) : []

const safeEntityId = (value: string) => {
  const normalized = clip(value, '', 80)
  return /^[a-zA-Z0-9_-]{4,80}$/.test(normalized) ? normalized : ''
}

const buildId = (prefix: string) => `${prefix}-${Date.now()}-${randomBytes(3).toString('hex')}`
const sanitizeMeetingCode = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
const buildMeetingCode = (prefix = 'sk-oa') =>
  sanitizeMeetingCode(`${prefix}-${Date.now().toString(36)}-${randomBytes(2).toString('hex')}`) || buildId('meeting')
const buildJitsiJoinUrl = (meetingCode: string) => `https://meet.jit.si/${encodeURIComponent(meetingCode)}`

const getDataDir = () => (process.env.OA_DATA_DIR || DEFAULT_OA_DATA_DIR).trim() || DEFAULT_OA_DATA_DIR

const ensureDataDir = async () => {
  const target = getDataDir()
  await mkdir(target, { recursive: true })
  return target
}

export const ensureOaUploadDir = async () => {
  const dataDir = await ensureDataDir()
  const uploadDir = join(dataDir, UPLOAD_DIR_NAME)
  await mkdir(uploadDir, { recursive: true })
  return uploadDir
}

const getStateFilePath = async () => {
  const dataDir = await ensureDataDir()
  return join(dataDir, STATE_FILE_NAME)
}

const buildSeedRoom = (): OaRoom => {
  const now = nowIso()
  return {
    id: 'room-hq-announcement',
    name: '总部协同群',
    type: 'group',
    members: ['all'],
    createdAt: now,
    updatedAt: now,
    lastMessageAt: now,
  }
}

const buildSeedOrgUnits = (): OaOrgUnit[] => {
  const now = nowIso()
  return [
    {
      id: 'org-hq',
      name: '集团总部',
      parentId: '',
      managerEmployeeId: 'Marlins',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'org-ops',
      name: '运营中心',
      parentId: 'org-hq',
      managerEmployeeId: 'coo001',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'org-supply',
      name: '供应链中心',
      parentId: 'org-hq',
      managerEmployeeId: 'supply001',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'org-hr',
      name: '人力中心',
      parentId: 'org-hq',
      managerEmployeeId: 'hr001',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'org-finance',
      name: '财务中心',
      parentId: 'org-hq',
      managerEmployeeId: 'finance001',
      createdAt: now,
      updatedAt: now,
    },
  ]
}

const SEED_CONTACT_PROFILES = [
  {
    employeeId: 'Marlins',
    name: '林总',
    title: 'CEO',
    orgUnitId: 'org-hq',
    mobile: '13800000001',
    email: 'ceo@starkitchen.example',
    wecomUserId: 'Marlins',
    feishuUserId: 'marlins',
    feishuOpenId: '',
  },
  {
    employeeId: 'coo001',
    name: '舒尔茨',
    title: 'COO',
    orgUnitId: 'org-ops',
    mobile: '13800000002',
    email: 'ops@starkitchen.example',
    wecomUserId: 'coo001',
    feishuUserId: 'coo001',
    feishuOpenId: '',
  },
  {
    employeeId: 'supply001',
    name: '雷克洛克',
    title: 'CSCO',
    orgUnitId: 'org-supply',
    mobile: '13800000003',
    email: 'supply@starkitchen.example',
    wecomUserId: 'supply001',
    feishuUserId: 'supply001',
    feishuOpenId: '',
  },
  {
    employeeId: 'hr001',
    name: '人力经理',
    title: 'HRBP',
    orgUnitId: 'org-hr',
    mobile: '13800000004',
    email: 'hr@starkitchen.example',
    wecomUserId: 'hr001',
    feishuUserId: 'hr001',
    feishuOpenId: '',
  },
  {
    employeeId: 'finance001',
    name: '财务经理',
    title: 'Finance Lead',
    orgUnitId: 'org-finance',
    mobile: '13800000005',
    email: 'finance@starkitchen.example',
    wecomUserId: 'finance001',
    feishuUserId: 'finance001',
    feishuOpenId: '',
  },
] as const

const buildSeedContacts = (): OaContact[] => {
  const now = nowIso()
  return SEED_CONTACT_PROFILES.map((seed) => ({
    ...seed,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  }))
}

const buildInitialState = (): OaStateSnapshot => ({
  rooms: [buildSeedRoom()],
  messages: [],
  files: [],
  calls: [],
  meetings: [],
  orgUnits: buildSeedOrgUnits(),
  contacts: buildSeedContacts(),
  audits: [],
})

const normalizeRoom = (value: unknown): OaRoom | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Partial<OaRoom>
  const id = safeEntityId(clip(record.id, '', 80))
  if (!id) return null

  const type: OaRoomType =
    record.type === 'direct' || record.type === 'project' || record.type === 'group'
      ? record.type
      : 'group'

  const members = normalizeArray(record.members)
  const createdAt = clip(record.createdAt, nowIso(), 80)
  const updatedAt = clip(record.updatedAt, createdAt, 80)
  const lastMessageAt = clip(record.lastMessageAt, updatedAt, 80)

  return {
    id,
    name: clip(record.name, '未命名会话', 120),
    type,
    members: members.length ? members : ['all'],
    createdAt,
    updatedAt,
    lastMessageAt,
  }
}

const normalizeAttachment = (value: unknown): OaAttachment | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Partial<OaAttachment>
  const fileId = safeEntityId(clip(record.fileId, '', 80))
  if (!fileId) return null
  return {
    fileId,
    fileName: clip(record.fileName, '未命名文件', 220),
  }
}

const normalizeMessage = (value: unknown): OaMessage | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Partial<OaMessage>
  const id = safeEntityId(clip(record.id, '', 80))
  const roomId = safeEntityId(clip(record.roomId, '', 80))
  if (!id || !roomId) return null
  return {
    id,
    roomId,
    senderId: clip(record.senderId, 'unknown', 80),
    senderName: clip(record.senderName, '未知用户', 80),
    content: clip(record.content, '', 5000),
    attachments: Array.isArray(record.attachments)
      ? record.attachments.map((item) => normalizeAttachment(item)).filter(Boolean) as OaAttachment[]
      : [],
    createdAt: clip(record.createdAt, nowIso(), 80),
  }
}

const normalizeFile = (value: unknown): OaFileRecord | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Partial<OaFileRecord>
  const id = safeEntityId(clip(record.id, '', 80))
  if (!id) return null
  return {
    id,
    roomId: safeEntityId(clip(record.roomId, '', 80)),
    uploaderId: clip(record.uploaderId, 'unknown', 80),
    uploaderName: clip(record.uploaderName, '未知用户', 80),
    originalName: clip(record.originalName, 'unnamed.bin', 260),
    storedName: clip(record.storedName, `${id}.bin`, 260),
    mimeType: clip(record.mimeType, 'application/octet-stream', 180),
    size:
      typeof record.size === 'number' && Number.isFinite(record.size)
        ? Math.max(0, Math.round(record.size))
        : 0,
    uploadedAt: clip(record.uploadedAt, nowIso(), 80),
  }
}

const normalizeCallMode = (value: unknown): OaCallMode => {
  const normalized = clip(value, '', 40)
  return normalized === 'voice' ? 'voice' : 'video'
}

const normalizeCallProvider = (_value: unknown): OaCallProvider => 'jitsi'

const normalizeMeetingProvider = (_value: unknown): OaMeetingProvider => 'jitsi'

const normalizeMeetingStatus = (value: unknown): OaMeetingStatus => {
  const normalized = clip(value, '', 40)
  if (normalized === 'live' || normalized === 'completed' || normalized === 'scheduled') {
    return normalized
  }
  return 'scheduled'
}

const normalizeCall = (value: unknown): OaCallSession | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Partial<OaCallSession>
  const id = safeEntityId(clip(record.id, '', 80))
  if (!id) return null
  const meetingCode = sanitizeMeetingCode(clip(record.meetingCode, '', 80)) || sanitizeMeetingCode(id)
  return {
    id,
    mode: normalizeCallMode(record.mode),
    title: clip(record.title, '即时通话', 160),
    roomId: safeEntityId(clip(record.roomId, '', 80)),
    participants: normalizeArray(record.participants),
    createdBy: clip(record.createdBy, 'anonymous', 80),
    createdByName: clip(record.createdByName, '匿名用户', 80),
    provider: normalizeCallProvider(record.provider),
    meetingCode,
    joinUrl: clip(record.joinUrl, buildJitsiJoinUrl(meetingCode), 320),
    startedAt: clip(record.startedAt, nowIso(), 80),
  }
}

const normalizeMeeting = (value: unknown): OaMeetingSession | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Partial<OaMeetingSession>
  const id = safeEntityId(clip(record.id, '', 80))
  if (!id) return null
  const createdAt = clip(record.createdAt, nowIso(), 80)
  const updatedAt = clip(record.updatedAt, createdAt, 80)
  const startsAt = clip(record.startsAt, createdAt, 80)
  const durationMinutes =
    typeof record.durationMinutes === 'number' && Number.isFinite(record.durationMinutes)
      ? Math.max(15, Math.min(480, Math.round(record.durationMinutes)))
      : 30
  const meetingCode = sanitizeMeetingCode(clip(record.meetingCode, '', 80)) || sanitizeMeetingCode(id)
  return {
    id,
    title: clip(record.title, '未命名会议', 160),
    agenda: clip(record.agenda, '', 6000),
    roomId: safeEntityId(clip(record.roomId, '', 80)),
    participants: normalizeArray(record.participants),
    createdBy: clip(record.createdBy, 'anonymous', 80),
    createdByName: clip(record.createdByName, '匿名用户', 80),
    provider: normalizeMeetingProvider(record.provider),
    meetingCode,
    joinUrl: clip(record.joinUrl, buildJitsiJoinUrl(meetingCode), 320),
    startsAt,
    durationMinutes,
    createdAt,
    updatedAt,
    status: normalizeMeetingStatus(record.status),
  }
}

const normalizeContactStatus = (value: unknown): OaContactStatus => {
  const normalized = clip(value, '', 20).toLowerCase()
  return normalized === 'inactive' ? 'inactive' : 'active'
}

const safeEmail = (value: unknown) => {
  const normalized = clip(value, '', 160).toLowerCase()
  if (!normalized) return ''
  if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized)) return normalized
  return ''
}

const safeMobile = (value: unknown) => {
  const normalized = clip(value, '', 40)
  if (!normalized) return ''
  if (/^[0-9+\-() ]{6,40}$/.test(normalized)) return normalized
  return ''
}

const safePlatformIdentity = (value: unknown) => {
  const normalized = clip(value, '', 120)
  if (!normalized) return ''
  if (/^[a-zA-Z0-9._:@-]{2,120}$/.test(normalized)) return normalized
  return ''
}

const normalizeOrgUnit = (value: unknown): OaOrgUnit | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Partial<OaOrgUnit>
  const id = safeEntityId(clip(record.id, '', 80))
  if (!id) return null
  const createdAt = clip(record.createdAt, nowIso(), 80)
  return {
    id,
    name: clip(record.name, '未命名组织', 120),
    parentId: safeEntityId(clip(record.parentId, '', 80)),
    managerEmployeeId: clip(record.managerEmployeeId, '', 80),
    createdAt,
    updatedAt: clip(record.updatedAt, createdAt, 80),
  }
}

const normalizeContact = (value: unknown): OaContact | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Partial<OaContact>
  const employeeId = clip(record.employeeId, '', 80)
  if (!employeeId) return null
  const createdAt = clip(record.createdAt, nowIso(), 80)
  return {
    employeeId,
    name: clip(record.name, '未命名联系人', 120),
    title: clip(record.title, '', 120),
    orgUnitId: safeEntityId(clip(record.orgUnitId, '', 80)),
    mobile: safeMobile(record.mobile),
    email: safeEmail(record.email),
    wecomUserId: safePlatformIdentity((record as Partial<OaContact>).wecomUserId),
    feishuUserId: safePlatformIdentity((record as Partial<OaContact>).feishuUserId),
    feishuOpenId: safePlatformIdentity((record as Partial<OaContact>).feishuOpenId),
    status: normalizeContactStatus(record.status),
    createdAt,
    updatedAt: clip(record.updatedAt, createdAt, 80),
  }
}

const normalizeGeo = (value: unknown): OaAuditGeo => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { country: '未知', region: '未知', city: '未知' }
  }
  const record = value as Partial<OaAuditGeo>
  return {
    country: clip(record.country, '未知', 80),
    region: clip(record.region, '未知', 80),
    city: clip(record.city, '未知', 80),
  }
}

const normalizeAction = (value: unknown): OaAuditAction => {
  const normalized = clip(value, '', 60)
  const allowed: OaAuditAction[] = [
    'room.create',
    'room.read',
    'chat.read',
    'chat.message.send',
    'contacts.read',
    'contacts.create',
    'contacts.sync',
    'contacts.delete',
    'org.read',
    'org.create',
    'org.delete',
    'file.upload',
    'file.read',
    'file.download',
    'call.create',
    'call.read',
    'meeting.create',
    'meeting.read',
    'im.channels.read',
    'im.channels.bootstrap',
    'im.webhook.receive',
    'im.history.read',
    'audit.read',
  ]
  return allowed.includes(normalized as OaAuditAction) ? (normalized as OaAuditAction) : 'chat.read'
}

const normalizeAudit = (value: unknown): OaAuditEvent | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Partial<OaAuditEvent>
  const id = safeEntityId(clip(record.id, '', 80))
  if (!id) return null
  return {
    id,
    timestamp: clip(record.timestamp, nowIso(), 80),
    action: normalizeAction(record.action),
    actorId: clip(record.actorId, 'anonymous', 80),
    actorName: clip(record.actorName, '匿名用户', 80),
    ipAddress: clip(record.ipAddress, '0.0.0.0', 120),
    geo: normalizeGeo(record.geo),
    userAgent: clip(record.userAgent, 'unknown', 260),
    path: clip(record.path, '/api/oa', 280),
    entityId: clip(record.entityId, '', 80),
    success: record.success !== false,
    message: clip(record.message, '', 240),
  }
}

const normalizeState = (value: unknown): OaStateSnapshot => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return buildInitialState()
  }
  const snapshot = value as Partial<OaStateSnapshot>
  const rooms = Array.isArray(snapshot.rooms)
    ? snapshot.rooms.map((item) => normalizeRoom(item)).filter(Boolean) as OaRoom[]
    : []
  const messages = Array.isArray(snapshot.messages)
    ? snapshot.messages.map((item) => normalizeMessage(item)).filter(Boolean) as OaMessage[]
    : []
  const files = Array.isArray(snapshot.files)
    ? snapshot.files.map((item) => normalizeFile(item)).filter(Boolean) as OaFileRecord[]
    : []
  const calls = Array.isArray(snapshot.calls)
    ? snapshot.calls.map((item) => normalizeCall(item)).filter(Boolean) as OaCallSession[]
    : []
  const meetings = Array.isArray(snapshot.meetings)
    ? snapshot.meetings.map((item) => normalizeMeeting(item)).filter(Boolean) as OaMeetingSession[]
    : []
  const orgUnits = Array.isArray((snapshot as Partial<OaStateSnapshot>).orgUnits)
    ? ((snapshot as Partial<OaStateSnapshot>).orgUnits || [])
        .map((item) => normalizeOrgUnit(item))
        .filter(Boolean) as OaOrgUnit[]
    : []
  const contacts = Array.isArray((snapshot as Partial<OaStateSnapshot>).contacts)
    ? ((snapshot as Partial<OaStateSnapshot>).contacts || [])
        .map((item) => normalizeContact(item))
        .filter(Boolean) as OaContact[]
    : []
  const audits = Array.isArray(snapshot.audits)
    ? snapshot.audits.map((item) => normalizeAudit(item)).filter(Boolean) as OaAuditEvent[]
    : []

  const normalizedRooms = rooms.length ? rooms : [buildSeedRoom()]
  const normalizedOrgUnits = orgUnits.length ? orgUnits : buildSeedOrgUnits()
  const normalizedContacts = contacts.length ? contacts : buildSeedContacts()
  return {
    rooms: normalizedRooms.slice(0, MAX_ROOMS),
    messages: messages.slice(0, MAX_MESSAGES),
    files: files.slice(0, MAX_FILES),
    calls: calls.slice(0, MAX_CALLS),
    meetings: meetings.slice(0, MAX_MEETINGS),
    orgUnits: normalizedOrgUnits.slice(0, MAX_ORG_UNITS),
    contacts: normalizedContacts.slice(0, MAX_CONTACTS),
    audits: audits.slice(0, MAX_AUDITS),
  }
}

const readStateFileFromDisk = async () => {
  const target = await getStateFilePath()
  try {
    const raw = await readFile(target, 'utf8')
    return normalizeState(JSON.parse(raw))
  } catch {
    const initialState = buildInitialState()
    await writeFile(target, JSON.stringify(initialState, null, 2), 'utf8')
    return initialState
  }
}

const writeStateFileToDisk = async (snapshot: OaStateSnapshot) => {
  const target = await getStateFilePath()
  await writeFile(target, JSON.stringify(snapshot, null, 2), 'utf8')
  return snapshot
}

const readStateSnapshotFromStore = async () => {
  const payload = await readPersistentJsonState<OaStateSnapshot>(OA_STATE_NAMESPACE)
  if (payload) return normalizeState(payload)

  const seeded = await readStateFileFromDisk()
  await writePersistentJsonState(OA_STATE_NAMESPACE, seeded)
  return seeded
}

const readStateSnapshot = async () => {
  if (!isPersistentJsonStoreEnabled()) {
    return readStateFileFromDisk()
  }

  try {
    return await readStateSnapshotFromStore()
  } catch {
    return readStateFileFromDisk()
  }
}

const writeStateSnapshot = async (snapshot: OaStateSnapshot) => {
  if (!isPersistentJsonStoreEnabled()) {
    return writeStateFileToDisk(snapshot)
  }

  try {
    await writePersistentJsonState(OA_STATE_NAMESPACE, snapshot)
    return snapshot
  } catch {
    return writeStateFileToDisk(snapshot)
  }
}

const canAccessRoom = (room: OaRoom, actorId: string) => {
  if (!actorId) return false
  if (room.members.includes('all')) return true
  return room.members.includes(actorId)
}

const canAccessParticipants = (participants: string[], actorId: string) => {
  if (!actorId) return false
  if (participants.includes('all')) return true
  return participants.includes(actorId)
}

const sortRooms = (items: OaRoom[]) =>
  [...items].sort((left, right) => right.lastMessageAt.localeCompare(left.lastMessageAt))

const sortMessages = (items: OaMessage[]) =>
  [...items].sort((left, right) => left.createdAt.localeCompare(right.createdAt))

const sortFiles = (items: OaFileRecord[]) =>
  [...items].sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt))

const sortCalls = (items: OaCallSession[]) =>
  [...items].sort((left, right) => right.startedAt.localeCompare(left.startedAt))

const sortMeetingsByStart = (items: OaMeetingSession[]) =>
  [...items].sort((left, right) => left.startsAt.localeCompare(right.startsAt))

const sortOrgUnits = (items: OaOrgUnit[]) => [...items].sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))

const sortContacts = (items: OaContact[]) => [...items].sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))

const sortAudits = (items: OaAuditEvent[]) =>
  [...items].sort((left, right) => right.timestamp.localeCompare(left.timestamp))

const resolveMeetingStatus = (meeting: OaMeetingSession): OaMeetingStatus => {
  const startAtMs = Date.parse(meeting.startsAt)
  if (!Number.isFinite(startAtMs)) return meeting.status
  const endAtMs = startAtMs + meeting.durationMinutes * 60_000
  const nowMs = Date.now()
  if (nowMs < startAtMs - 120_000) return 'scheduled'
  if (nowMs <= endAtMs) return 'live'
  return 'completed'
}

const mutateState = async <T>(
  updater: (state: OaStateSnapshot) => { state: OaStateSnapshot; result: T }
) => {
  const snapshot = await readStateSnapshot()
  const updated = updater(snapshot)
  await writeStateSnapshot(updated.state)
  return updated.result
}

export const listOaRooms = async (actorId: string) => {
  const snapshot = await readStateSnapshot()
  return sortRooms(snapshot.rooms.filter((room) => canAccessRoom(room, actorId)))
}

export const canActorAccessOaRoom = async (roomId: string, actorId: string) => {
  const safeRoomId = safeEntityId(roomId)
  if (!safeRoomId) return false
  const snapshot = await readStateSnapshot()
  const room = snapshot.rooms.find((item) => item.id === safeRoomId)
  if (!room) return false
  return canAccessRoom(room, actorId)
}

export const listOaOrgUnits = async () => {
  const snapshot = await readStateSnapshot()
  return sortOrgUnits(snapshot.orgUnits)
}

export const createOaOrgUnit = async (input: {
  name: string
  parentId?: string
  managerEmployeeId?: string
}) =>
  mutateState((snapshot) => {
    const parentId = safeEntityId(input.parentId || '')
    if (parentId && snapshot.orgUnits.every((item) => item.id !== parentId)) {
      throw new Error('ORG_PARENT_NOT_FOUND')
    }

    const now = nowIso()
    const orgUnit: OaOrgUnit = {
      id: buildId('org'),
      name: clip(input.name, '未命名组织', 120),
      parentId,
      managerEmployeeId: clip(input.managerEmployeeId, '', 80),
      createdAt: now,
      updatedAt: now,
    }

    return {
      state: {
        ...snapshot,
        orgUnits: sortOrgUnits([orgUnit, ...snapshot.orgUnits]).slice(0, MAX_ORG_UNITS),
      },
      result: orgUnit,
    }
  })

export const deleteOaOrgUnit = async (orgUnitId: string) =>
  mutateState((snapshot) => {
    const targetId = safeEntityId(orgUnitId)
    if (!targetId) throw new Error('ORG_NOT_FOUND')
    if (snapshot.orgUnits.every((item) => item.id !== targetId)) throw new Error('ORG_NOT_FOUND')
    if (snapshot.orgUnits.some((item) => item.parentId === targetId)) throw new Error('ORG_HAS_CHILDREN')
    if (snapshot.contacts.some((item) => item.orgUnitId === targetId)) throw new Error('ORG_HAS_CONTACTS')

    return {
      state: {
        ...snapshot,
        orgUnits: snapshot.orgUnits.filter((item) => item.id !== targetId),
      },
      result: targetId,
    }
  })

export interface OaGaiaSyncResult {
  total: number
  imported: number
  created: number
  updated: number
  skipped: number
  orgCreated: number
}

interface OaGaiaSyncMutableState {
  now: string
  orgUnits: OaOrgUnit[]
  contacts: OaContact[]
  orgByName: Map<string, OaOrgUnit>
  usedOrgIds: Set<string>
  contactIndex: Map<string, number>
  created: number
  updated: number
  skipped: number
  orgCreated: number
}

const normalizeSlug = (value: string, max = 32) =>
  value
    .toLowerCase()
    .replace(/[\s/]+/g, '-')
    .replace(/[^a-z0-9_-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, max)

const buildGaiaOrgUnitId = (orgName: string, usedIds: Set<string>) => {
  const seed = normalizeSlug(orgName)
  const safeSeed = seed || randomBytes(2).toString('hex')
  const baseId = `org-gaia-${safeSeed}`
  let candidate = safeEntityId(baseId)
  if (!candidate) candidate = buildId('org')
  if (!usedIds.has(candidate)) return candidate

  let index = 2
  while (index < 1000) {
    const nextCandidate = safeEntityId(`${baseId}-${index}`)
    if (nextCandidate && !usedIds.has(nextCandidate)) return nextCandidate
    index += 1
  }
  return buildId('org')
}

const getGaiaOrgParentId = (snapshot: OaStateSnapshot) => {
  const opsOrg = snapshot.orgUnits.find((item) => item.id === 'org-ops')
  if (opsOrg) return opsOrg.id
  const hqOrg = snapshot.orgUnits.find((item) => item.id === 'org-hq')
  if (hqOrg) return hqOrg.id
  return ''
}

const buildGaiaSyncMutableState = (snapshot: OaStateSnapshot): OaGaiaSyncMutableState => ({
  now: nowIso(),
  orgUnits: [...snapshot.orgUnits],
  contacts: [...snapshot.contacts],
  orgByName: new Map(snapshot.orgUnits.map((item) => [item.name.trim().toLowerCase(), item])),
  usedOrgIds: new Set(snapshot.orgUnits.map((item) => item.id)),
  contactIndex: new Map(snapshot.contacts.map((item, index) => [item.employeeId, index])),
  created: 0,
  updated: 0,
  skipped: 0,
  orgCreated: 0,
})

const addGaiaContact = (input: {
  state: OaGaiaSyncMutableState
  employeeId: string
  name: string
  roleTitle: string
  orgUnitId: string
  status: OaContactStatus
}) => {
  input.state.contacts.push({
    employeeId: input.employeeId,
    name: input.name,
    title: input.roleTitle,
    orgUnitId: input.orgUnitId,
    mobile: '',
    email: '',
    wecomUserId: '',
    feishuUserId: '',
    feishuOpenId: '',
    status: input.status,
    createdAt: input.state.now,
    updatedAt: input.state.now,
  })
  input.state.contactIndex.set(input.employeeId, input.state.contacts.length - 1)
  input.state.created += 1
}

const updateGaiaContact = (input: {
  state: OaGaiaSyncMutableState
  existingIndex: number
  name: string
  roleTitle: string
  orgUnitId: string
  status: OaContactStatus
}) => {
  const existing = input.state.contacts[input.existingIndex]
  input.state.contacts[input.existingIndex] = {
    ...existing,
    name: input.name,
    title: input.roleTitle,
    orgUnitId: input.orgUnitId || existing.orgUnitId,
    status: input.status,
    updatedAt: input.state.now,
  }
  input.state.updated += 1
}

const applyGaiaRecord = (
  record: GaiaEmployeeRecord,
  state: OaGaiaSyncMutableState,
  snapshot: OaStateSnapshot
) => {
  const employeeId = clip(record.employeeId, '', 80)
  const name = clip(record.name, '', 120)
  if (!employeeId || !name) {
    state.skipped += 1
    return
  }

  const ensuredOrg = ensureGaiaOrgUnit({
    snapshot,
    orgUnits: state.orgUnits,
    orgName: record.gaiaOrgUnit || `${record.city}运营单元`,
    now: state.now,
    usedIds: state.usedOrgIds,
    orgByName: state.orgByName,
  })
  if (ensuredOrg.created) state.orgCreated += 1

  const roleTitle = clip(record.roleTitle, '', 120)
  const status: OaContactStatus = record.status === '在岗' ? 'active' : 'inactive'
  const existingIndex = state.contactIndex.get(employeeId)
  if (typeof existingIndex !== 'number') {
    addGaiaContact({
      state,
      employeeId,
      name,
      roleTitle,
      orgUnitId: ensuredOrg.orgUnitId,
      status,
    })
    return
  }
  updateGaiaContact({
    state,
    existingIndex,
    name,
    roleTitle,
    orgUnitId: ensuredOrg.orgUnitId,
    status,
  })
}

const normalizeGaiaSyncSource = (
  records: GaiaEmployeeRecord[],
  options?: { onlyActive?: boolean; limit?: number }
) => {
  const sourceRecords = Array.isArray(records) ? records : []
  const limit = Math.max(1, Math.min(5000, Math.round(options?.limit || sourceRecords.length || 1)))
  const filteredRecords = sourceRecords
    .filter((item) => (options?.onlyActive ? item.status === '在岗' : true))
    .slice(0, limit)
  return { sourceRecords, filteredRecords }
}

const ensureGaiaOrgUnit = (input: {
  snapshot: OaStateSnapshot
  orgUnits: OaOrgUnit[]
  orgName: string
  now: string
  usedIds: Set<string>
  orgByName: Map<string, OaOrgUnit>
}) => {
  const normalizedOrgName = clip(input.orgName, '', 120)
  if (!normalizedOrgName) return { orgUnitId: '', created: false }

  const orgNameKey = normalizedOrgName.toLowerCase()
  const existing = input.orgByName.get(orgNameKey)
  if (existing) return { orgUnitId: existing.id, created: false }

  const orgUnit: OaOrgUnit = {
    id: buildGaiaOrgUnitId(normalizedOrgName, input.usedIds),
    name: normalizedOrgName,
    parentId: getGaiaOrgParentId(input.snapshot),
    managerEmployeeId: '',
    createdAt: input.now,
    updatedAt: input.now,
  }

  input.usedIds.add(orgUnit.id)
  input.orgUnits.push(orgUnit)
  input.orgByName.set(orgNameKey, orgUnit)
  return { orgUnitId: orgUnit.id, created: true }
}

export const listOaContacts = async (query?: {
  search?: string
  orgUnitId?: string
  status?: OaContactStatus
}) => {
  const snapshot = await readStateSnapshot()
  const search = clip(query?.search, '', 120).toLowerCase()
  const orgUnitId = safeEntityId(query?.orgUnitId || '')
  const status = query?.status === 'inactive' ? 'inactive' : query?.status === 'active' ? 'active' : ''

  return sortContacts(snapshot.contacts.filter((item) => {
    if (orgUnitId && item.orgUnitId !== orgUnitId) return false
    if (status && item.status !== status) return false
    if (!search) return true
    const merged = [
      item.employeeId,
      item.name,
      item.title,
      item.email,
      item.mobile,
      item.wecomUserId,
      item.feishuUserId,
      item.feishuOpenId,
    ]
      .join(' ')
      .toLowerCase()
    return merged.includes(search)
  }))
}

export const findOaContactByEmployeeId = async (employeeId: string) => {
  const normalized = clip(employeeId, '', 80)
  if (!normalized) return null
  const snapshot = await readStateSnapshot()
  return snapshot.contacts.find((item) => item.employeeId === normalized) || null
}

export const findOaContactByPlatformIdentity = async (input: {
  platform: 'wecom' | 'feishu'
  identity: string
}) => {
  const normalizedIdentity = clip(input.identity, '', 120).toLowerCase()
  if (!normalizedIdentity) return null
  const snapshot = await readStateSnapshot()
  if (input.platform === 'wecom') {
    return (
      snapshot.contacts.find(
        (item) =>
          item.wecomUserId.toLowerCase() === normalizedIdentity ||
          item.employeeId.toLowerCase() === normalizedIdentity
      ) || null
    )
  }
  return (
    snapshot.contacts.find(
      (item) =>
        item.feishuOpenId.toLowerCase() === normalizedIdentity ||
        item.feishuUserId.toLowerCase() === normalizedIdentity
    ) || null
  )
}

export const createOaContact = async (input: {
  employeeId: string
  name: string
  title?: string
  orgUnitId?: string
  mobile?: string
  email?: string
  wecomUserId?: string
  feishuUserId?: string
  feishuOpenId?: string
  status?: OaContactStatus
}) =>
  mutateState((snapshot) => {
    const employeeId = clip(input.employeeId, '', 80)
    if (!employeeId) throw new Error('CONTACT_EMPLOYEE_ID_REQUIRED')
    if (snapshot.contacts.some((item) => item.employeeId === employeeId)) {
      throw new Error('CONTACT_ALREADY_EXISTS')
    }

    const orgUnitId = safeEntityId(input.orgUnitId || '')
    if (orgUnitId && snapshot.orgUnits.every((item) => item.id !== orgUnitId)) {
      throw new Error('ORG_NOT_FOUND')
    }

    const now = nowIso()
    const contact: OaContact = {
      employeeId,
      name: clip(input.name, '未命名联系人', 120),
      title: clip(input.title, '', 120),
      orgUnitId,
      mobile: safeMobile(input.mobile),
      email: safeEmail(input.email),
      wecomUserId: safePlatformIdentity(input.wecomUserId),
      feishuUserId: safePlatformIdentity(input.feishuUserId),
      feishuOpenId: safePlatformIdentity(input.feishuOpenId),
      status: normalizeContactStatus(input.status),
      createdAt: now,
      updatedAt: now,
    }

    return {
      state: {
        ...snapshot,
        contacts: sortContacts([contact, ...snapshot.contacts]).slice(0, MAX_CONTACTS),
      },
      result: contact,
    }
  })

export const syncOaContactsFromGaia = async (
  records: GaiaEmployeeRecord[],
  options?: {
    onlyActive?: boolean
    limit?: number
  }
) =>
  mutateState((snapshot) => {
    const { sourceRecords, filteredRecords } = normalizeGaiaSyncSource(records, options)
    const state = buildGaiaSyncMutableState(snapshot)
    for (const record of filteredRecords) {
      applyGaiaRecord(record, state, snapshot)
    }

    return {
      state: {
        ...snapshot,
        orgUnits: sortOrgUnits(state.orgUnits).slice(0, MAX_ORG_UNITS),
        contacts: sortContacts(state.contacts).slice(0, MAX_CONTACTS),
      },
      result: {
        total: sourceRecords.length,
        imported: filteredRecords.length,
        created: state.created,
        updated: state.updated,
        skipped: state.skipped,
        orgCreated: state.orgCreated,
      } satisfies OaGaiaSyncResult,
    }
  })

export const deleteOaContact = async (employeeId: string) =>
  mutateState((snapshot) => {
    const normalized = clip(employeeId, '', 80)
    if (!normalized) throw new Error('CONTACT_NOT_FOUND')
    if (snapshot.contacts.every((item) => item.employeeId !== normalized)) throw new Error('CONTACT_NOT_FOUND')
    return {
      state: {
        ...snapshot,
        contacts: snapshot.contacts.filter((item) => item.employeeId !== normalized),
      },
      result: normalized,
    }
  })

export const listOaCalls = async (actorId: string) => {
  const snapshot = await readStateSnapshot()
  return sortCalls(snapshot.calls.filter((call) => canAccessParticipants(call.participants, actorId)))
}

export const createOaCallSession = async (input: {
  mode: OaCallMode
  title: string
  roomId?: string
  participants: string[]
  actorId: string
  actorName: string
}) =>
  mutateState((snapshot) => {
    const roomId = safeEntityId(input.roomId || '')
    if (roomId) {
      const room = snapshot.rooms.find((item) => item.id === roomId)
      if (!room || !canAccessRoom(room, input.actorId)) {
        throw new Error('ROOM_ACCESS_DENIED')
      }
    }

    const participants = Array.from(new Set([...normalizeArray(input.participants), input.actorId])).slice(0, 100)
    const meetingCode = buildMeetingCode(input.mode === 'voice' ? 'sk-voice' : 'sk-video')
    const call: OaCallSession = {
      id: buildId('call'),
      mode: input.mode,
      title: clip(input.title, input.mode === 'voice' ? '语音通话' : '视频通话', 160),
      roomId,
      participants: participants.length ? participants : [input.actorId],
      createdBy: clip(input.actorId, 'anonymous', 80),
      createdByName: clip(input.actorName, '匿名用户', 80),
      provider: 'jitsi',
      meetingCode,
      joinUrl: buildJitsiJoinUrl(meetingCode),
      startedAt: nowIso(),
    }

    return {
      state: {
        ...snapshot,
        calls: sortCalls([call, ...snapshot.calls]).slice(0, MAX_CALLS),
      },
      result: call,
    }
  })

export const listOaMeetings = async (actorId: string) => {
  const snapshot = await readStateSnapshot()
  const visible = snapshot.meetings
    .filter((meeting) => canAccessParticipants(meeting.participants, actorId))
    .map((meeting) => ({
      ...meeting,
      status: resolveMeetingStatus(meeting),
    }))
  return sortMeetingsByStart(visible)
}

export const createOaMeetingSession = async (input: {
  title: string
  agenda: string
  roomId?: string
  participants: string[]
  actorId: string
  actorName: string
  startsAt: string
  durationMinutes: number
}) =>
  mutateState((snapshot) => {
    const roomId = safeEntityId(input.roomId || '')
    if (roomId) {
      const room = snapshot.rooms.find((item) => item.id === roomId)
      if (!room || !canAccessRoom(room, input.actorId)) {
        throw new Error('ROOM_ACCESS_DENIED')
      }
    }

    const startsAtMs = Date.parse(input.startsAt)
    const startsAt = Number.isFinite(startsAtMs)
      ? new Date(startsAtMs).toISOString()
      : new Date(Date.now() + 15 * 60_000).toISOString()
    const durationMinutes = Math.max(15, Math.min(480, Math.round(input.durationMinutes || 30)))
    const participants = Array.from(new Set([...normalizeArray(input.participants), input.actorId])).slice(0, 120)
    const meetingCode = buildMeetingCode('sk-meeting')
    const now = nowIso()
    const draftMeeting: OaMeetingSession = {
      id: buildId('meeting'),
      title: clip(input.title, '经营例会', 160),
      agenda: clip(input.agenda, '', 6000),
      roomId,
      participants: participants.length ? participants : [input.actorId],
      createdBy: clip(input.actorId, 'anonymous', 80),
      createdByName: clip(input.actorName, '匿名用户', 80),
      provider: 'jitsi',
      meetingCode,
      joinUrl: buildJitsiJoinUrl(meetingCode),
      startsAt,
      durationMinutes,
      createdAt: now,
      updatedAt: now,
      status: 'scheduled',
    }
    const meeting = {
      ...draftMeeting,
      status: resolveMeetingStatus(draftMeeting),
    } satisfies OaMeetingSession

    return {
      state: {
        ...snapshot,
        meetings: sortMeetingsByStart([meeting, ...snapshot.meetings]).slice(0, MAX_MEETINGS),
      },
      result: meeting,
    }
  })

export const createOaRoom = async (input: {
  name: string
  type: OaRoomType
  members: string[]
  actorId: string
}) =>
  mutateState((snapshot) => {
    const now = nowIso()
    const members = Array.from(new Set([...normalizeArray(input.members), input.actorId])).slice(0, 100)
    const room: OaRoom = {
      id: buildId('room'),
      name: clip(input.name, '新建会话', 120),
      type: input.type,
      members: members.length ? members : ['all'],
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
    }
    return {
      state: {
        ...snapshot,
        rooms: sortRooms([room, ...snapshot.rooms]).slice(0, MAX_ROOMS),
      },
      result: room,
    }
  })

export const listOaMessages = async (roomId: string, actorId: string, limit = 120) => {
  const safeRoomId = safeEntityId(roomId)
  if (!safeRoomId) return []
  const snapshot = await readStateSnapshot()
  const room = snapshot.rooms.find((item) => item.id === safeRoomId)
  if (!room || !canAccessRoom(room, actorId)) return []
  const normalizedLimit = Math.max(1, Math.min(300, Math.round(limit)))
  const scoped = snapshot.messages.filter((message) => message.roomId === safeRoomId)
  return sortMessages(scoped).slice(-normalizedLimit)
}

export const appendOaMessage = async (input: {
  roomId: string
  actorId: string
  actorName: string
  content: string
  attachments?: OaAttachment[]
}) =>
  mutateState((snapshot) => {
    const safeRoomId = safeEntityId(input.roomId)
    const room = snapshot.rooms.find((item) => item.id === safeRoomId)
    if (!room || !canAccessRoom(room, input.actorId)) {
      throw new Error('ROOM_ACCESS_DENIED')
    }

    const now = nowIso()
    const message: OaMessage = {
      id: buildId('msg'),
      roomId: safeRoomId,
      senderId: clip(input.actorId, 'anonymous', 80),
      senderName: clip(input.actorName, '匿名用户', 80),
      content: clip(input.content, '', 5000),
      attachments: Array.isArray(input.attachments)
        ? input.attachments.map((item) => normalizeAttachment(item)).filter(Boolean) as OaAttachment[]
        : [],
      createdAt: now,
    }

    const rooms = snapshot.rooms.map((item) =>
      item.id === room.id
        ? {
            ...item,
            updatedAt: now,
            lastMessageAt: now,
          }
        : item
    )

    return {
      state: {
        ...snapshot,
        rooms: sortRooms(rooms),
        messages: [...snapshot.messages, message].slice(-MAX_MESSAGES),
      },
      result: message,
    }
  })

export const saveOaFileRecord = async (input: {
  roomId: string
  uploaderId: string
  uploaderName: string
  originalName: string
  storedName: string
  mimeType: string
  size: number
}) =>
  mutateState((snapshot) => {
    const roomId = safeEntityId(input.roomId)
    const record: OaFileRecord = {
      id: buildId('file'),
      roomId,
      uploaderId: clip(input.uploaderId, 'anonymous', 80),
      uploaderName: clip(input.uploaderName, '匿名用户', 80),
      originalName: clip(input.originalName, 'unnamed.bin', 260),
      storedName: clip(input.storedName, 'unknown.bin', 260),
      mimeType: clip(input.mimeType, 'application/octet-stream', 180),
      size: Math.max(0, Math.round(input.size || 0)),
      uploadedAt: nowIso(),
    }
    return {
      state: {
        ...snapshot,
        files: [record, ...snapshot.files].slice(0, MAX_FILES),
      },
      result: record,
    }
  })

export const listOaFileRecords = async (actorId: string, roomId = '') => {
  const snapshot = await readStateSnapshot()
  const safeRoomId = safeEntityId(roomId)
  if (!safeRoomId) {
    const actorRooms = new Set(
      snapshot.rooms.filter((room) => canAccessRoom(room, actorId)).map((room) => room.id)
    )
    const visible = snapshot.files.filter((file) => !file.roomId || actorRooms.has(file.roomId))
    return sortFiles(visible)
  }

  const room = snapshot.rooms.find((item) => item.id === safeRoomId)
  if (!room || !canAccessRoom(room, actorId)) return []
  return sortFiles(snapshot.files.filter((file) => file.roomId === safeRoomId))
}

export const getOaFileRecord = async (fileId: string, actorId: string) => {
  const safeFileId = safeEntityId(fileId)
  if (!safeFileId) return null
  const snapshot = await readStateSnapshot()
  const record = snapshot.files.find((item) => item.id === safeFileId)
  if (!record) return null
  if (!record.roomId) return record
  const room = snapshot.rooms.find((item) => item.id === record.roomId)
  if (!room || !canAccessRoom(room, actorId)) return null
  return record
}

export const appendOaAuditEvent = async (input: {
  action: OaAuditAction
  actorId: string
  actorName: string
  ipAddress: string
  geo: OaAuditGeo
  userAgent: string
  path: string
  entityId?: string
  success: boolean
  message: string
}) =>
  mutateState((snapshot) => {
    const event: OaAuditEvent = {
      id: buildId('audit'),
      timestamp: nowIso(),
      action: input.action,
      actorId: clip(input.actorId, 'anonymous', 80),
      actorName: clip(input.actorName, '匿名用户', 80),
      ipAddress: clip(input.ipAddress, '0.0.0.0', 120),
      geo: {
        country: clip(input.geo.country, '未知', 80),
        region: clip(input.geo.region, '未知', 80),
        city: clip(input.geo.city, '未知', 80),
      },
      userAgent: clip(input.userAgent, 'unknown', 260),
      path: clip(input.path, '/api/oa', 280),
      entityId: clip(input.entityId, '', 80),
      success: input.success,
      message: clip(input.message, '', 240),
    }
    return {
      state: {
        ...snapshot,
        audits: [event, ...snapshot.audits].slice(0, MAX_AUDITS),
      },
      result: event,
    }
  })

export const listOaAuditEvents = async (query?: {
  actorId?: string
  action?: OaAuditAction
  page?: number
  size?: number
}) => {
  const snapshot = await readStateSnapshot()
  const page = Math.max(1, Math.round(query?.page || 1))
  const size = Math.max(1, Math.min(200, Math.round(query?.size || 50)))
  const actorId = clip(query?.actorId, '', 80)
  const action = query?.action

  const filtered = snapshot.audits.filter((item) => {
    if (actorId && item.actorId !== actorId) return false
    if (action && item.action !== action) return false
    return true
  })

  const sorted = sortAudits(filtered)
  const start = (page - 1) * size
  const scoped = sorted.slice(start, start + size)
  return {
    items: scoped,
    total: sorted.length,
    page,
    size,
  }
}
