import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuthenticated } from '@/lib/server/llm-auth'
import { appendOaAuditByRequest, resolveOaActorId } from '@/lib/server/oa/context'
import { ensureOaUploadDir, getOaFileRecord } from '@/lib/server/oa/storage'

export const runtime = 'nodejs'

const clip = (value: unknown, fallback = '', max = 260) => {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim()
  return normalized ? normalized.slice(0, max) : fallback
}

const buildDisposition = (fileName: string) =>
  `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

export async function GET(
  request: NextRequest,
  context: {
    params: {
      fileId: string
    }
  }
) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const fileId = clip(context.params?.fileId, '', 80)
  const actorId = resolveOaActorId(request)
  if (!fileId) {
    return NextResponse.json({ message: 'fileId 不能为空' }, { status: 400 })
  }

  const record = await getOaFileRecord(fileId, actorId)
  if (!record) {
    await appendOaAuditByRequest(request, {
      action: 'file.download',
      success: false,
      entityId: fileId,
      message: '下载失败：文件不存在或无权限',
    })
    return NextResponse.json({ message: '文件不存在或无权限' }, { status: 404 })
  }

  const uploadDir = await ensureOaUploadDir()
  const targetPath = join(uploadDir, record.storedName)

  try {
    const buffer = await readFile(targetPath)
    await appendOaAuditByRequest(request, {
      action: 'file.download',
      success: true,
      entityId: fileId,
      message: `下载文件：${record.originalName}`,
    })
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': record.mimeType || 'application/octet-stream',
        'Content-Length': String(buffer.byteLength),
        'Content-Disposition': buildDisposition(record.originalName),
      },
    })
  } catch {
    await appendOaAuditByRequest(request, {
      action: 'file.download',
      success: false,
      entityId: fileId,
      message: '下载失败：文件已丢失',
    })
    return NextResponse.json({ message: '文件已丢失，请重新上传' }, { status: 410 })
  }
}
