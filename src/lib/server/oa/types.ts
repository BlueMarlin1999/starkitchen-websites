export type OaRoomType = 'group' | 'direct' | 'project'
export type OaCallMode = 'voice' | 'video'
export type OaCallProvider = 'jitsi'
export type OaMeetingProvider = 'jitsi'
export type OaMeetingStatus = 'scheduled' | 'live' | 'completed'
export type OaContactStatus = 'active' | 'inactive'

export interface OaRoom {
  id: string
  name: string
  type: OaRoomType
  members: string[]
  createdAt: string
  updatedAt: string
  lastMessageAt: string
}

export interface OaAttachment {
  fileId: string
  fileName: string
}

export interface OaMessage {
  id: string
  roomId: string
  senderId: string
  senderName: string
  content: string
  attachments: OaAttachment[]
  createdAt: string
}

export interface OaFileRecord {
  id: string
  roomId: string
  uploaderId: string
  uploaderName: string
  originalName: string
  storedName: string
  mimeType: string
  size: number
  uploadedAt: string
}

export interface OaCallSession {
  id: string
  mode: OaCallMode
  title: string
  roomId: string
  participants: string[]
  createdBy: string
  createdByName: string
  provider: OaCallProvider
  meetingCode: string
  joinUrl: string
  startedAt: string
}

export interface OaMeetingSession {
  id: string
  title: string
  agenda: string
  roomId: string
  participants: string[]
  createdBy: string
  createdByName: string
  provider: OaMeetingProvider
  meetingCode: string
  joinUrl: string
  startsAt: string
  durationMinutes: number
  createdAt: string
  updatedAt: string
  status: OaMeetingStatus
}

export interface OaOrgUnit {
  id: string
  name: string
  parentId: string
  managerEmployeeId: string
  createdAt: string
  updatedAt: string
}

export interface OaContact {
  employeeId: string
  name: string
  title: string
  orgUnitId: string
  mobile: string
  email: string
  wecomUserId: string
  feishuUserId: string
  feishuOpenId: string
  status: OaContactStatus
  createdAt: string
  updatedAt: string
}

export type OaAuditAction =
  | 'room.create'
  | 'room.read'
  | 'chat.read'
  | 'chat.message.send'
  | 'contacts.read'
  | 'contacts.create'
  | 'contacts.sync'
  | 'contacts.delete'
  | 'org.read'
  | 'org.create'
  | 'org.delete'
  | 'file.upload'
  | 'file.read'
  | 'file.download'
  | 'call.create'
  | 'call.read'
  | 'meeting.create'
  | 'meeting.read'
  | 'im.channels.read'
  | 'im.channels.bootstrap'
  | 'im.webhook.receive'
  | 'im.history.read'
  | 'audit.read'

export interface OaAuditGeo {
  country: string
  region: string
  city: string
}

export interface OaAuditEvent {
  id: string
  timestamp: string
  action: OaAuditAction
  actorId: string
  actorName: string
  ipAddress: string
  geo: OaAuditGeo
  userAgent: string
  path: string
  entityId: string
  success: boolean
  message: string
}

export interface OaStateSnapshot {
  rooms: OaRoom[]
  messages: OaMessage[]
  files: OaFileRecord[]
  calls: OaCallSession[]
  meetings: OaMeetingSession[]
  orgUnits: OaOrgUnit[]
  contacts: OaContact[]
  audits: OaAuditEvent[]
}
