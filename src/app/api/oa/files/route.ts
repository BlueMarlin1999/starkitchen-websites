import { randomBytes } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuthenticated } from '@/lib/server/llm-auth'
import { parsePlainObjectWithSchema, parseQueryWithSchema } from '@/lib/server/input-validation'
import {
  appendOaAuditByRequest,
  resolveOaActorId,
  resolveOaActorName,
} from '@/lib/server/oa/context'
import {
  appendOaMessage,
  canActorAccessOaRoom,
  ensureOaUploadDir,
  listOaFileRecords,
  saveOaFileRecord,
} from '@/lib/server/oa/storage'

export const runtime = 'nodejs'

const MAX_UPLOAD_SIZE = 25 * 1024 * 1024
const fileListQuerySchema = z.object({
  roomId: z.string().trim().max(80).optional().default(''),
})
const fileUploadMetaSchema = z.object({
  roomId: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => (typeof value === 'string' ? value.trim().slice(0, 80) : '')),
})

const clip = (value: unknown, fallback = '', max = 200) => {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim()
  return normalized ? normalized.slice(0, max) : fallback
}

const safeFileSegment = (value: string) =>
  value
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120)

const extensionFromName = (name: string) => {
  const normalized = clip(name, '', 260)
  const index = normalized.lastIndexOf('.')
  if (index < 0) return ''
  return normalized.slice(index).slice(0, 20)
}

export async function GET(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const actorId = resolveOaActorId(request)
  const parsedQuery = parseQueryWithSchema(request, fileListQuerySchema, '文件列表查询参数不合法。')
  if (!parsedQuery.ok) {
    return parsedQuery.response
  }
  const roomId = parsedQuery.data.roomId
  const items = await listOaFileRecords(actorId, roomId)

  await appendOaAuditByRequest(request, {
    action: 'file.read',
    success: true,
    entityId: roomId,
    message: `读取文件列表 ${items.length} 条`,
  })

  return NextResponse.json({
    items,
    total: items.length,
  })
}

export async function POST(request: NextRequest) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const actorId = resolveOaActorId(request)
  const actorName = resolveOaActorName(request)

  const formData = await request.formData()
  const parsedMeta = parsePlainObjectWithSchema(
    { roomId: formData.get('roomId') },
    fileUploadMetaSchema,
    '文件上传参数不合法。'
  )
  if (!parsedMeta.ok) {
    await appendOaAuditByRequest(request, {
      action: 'file.upload',
      success: false,
      message: '上传失败：参数校验未通过',
    })
    return parsedMeta.response
  }

  const roomId = parsedMeta.data.roomId
  const fileInput = formData.get('file')
  if (!(fileInput instanceof File)) {
    await appendOaAuditByRequest(request, {
      action: 'file.upload',
      success: false,
      entityId: roomId,
      message: '上传失败：未选择文件',
    })
    return NextResponse.json({ message: '请先选择文件' }, { status: 400 })
  }

  if (fileInput.size <= 0 || fileInput.size > MAX_UPLOAD_SIZE) {
    await appendOaAuditByRequest(request, {
      action: 'file.upload',
      success: false,
      entityId: roomId,
      message: `上传失败：文件大小不合法 ${fileInput.size}`,
    })
    return NextResponse.json(
      {
        message: `文件大小必须在 1B - ${Math.round(MAX_UPLOAD_SIZE / 1024 / 1024)}MB`,
      },
      { status: 400 }
    )
  }

  if (roomId) {
    const allowed = await canActorAccessOaRoom(roomId, actorId)
    if (!allowed) {
      await appendOaAuditByRequest(request, {
        action: 'file.upload',
        success: false,
        entityId: roomId,
        message: '上传失败：无权访问会话',
      })
      return NextResponse.json({ message: '无权访问该会话' }, { status: 403 })
    }
  }

  const extension = extensionFromName(fileInput.name)
  const random = randomBytes(4).toString('hex')
  const safeName = safeFileSegment(fileInput.name || 'unnamed')
  const storedName = `${Date.now()}-${random}-${safeName || 'file'}${extension && !safeName.endsWith(extension) ? extension : ''}`
  const uploadDir = await ensureOaUploadDir()
  const targetPath = join(uploadDir, storedName)

  const buffer = Buffer.from(await fileInput.arrayBuffer())
  await writeFile(targetPath, buffer)

  const fileRecord = await saveOaFileRecord({
    roomId,
    uploaderId: actorId,
    uploaderName: actorName,
    originalName: fileInput.name || 'unnamed.bin',
    storedName,
    mimeType: clip(fileInput.type, 'application/octet-stream', 180),
    size: fileInput.size,
  })

  let linkedMessageId = ''
  if (roomId) {
    const message = await appendOaMessage({
      roomId,
      actorId,
      actorName,
      content: `上传文件：${fileRecord.originalName}`,
      attachments: [
        {
          fileId: fileRecord.id,
          fileName: fileRecord.originalName,
        },
      ],
    })
    linkedMessageId = message.id
  }

  await appendOaAuditByRequest(request, {
    action: 'file.upload',
    success: true,
    entityId: fileRecord.id,
    message: `上传文件成功：${fileRecord.originalName}`,
  })

  return NextResponse.json(
    {
      file: fileRecord,
      linkedMessageId,
    },
    { status: 201 }
  )
}
