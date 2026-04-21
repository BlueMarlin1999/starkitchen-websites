import { NextRequest, NextResponse } from 'next/server'
import { requireAuthenticated } from '@/lib/server/llm-auth'
import {
  buildAllInOneZipArtifact,
  buildExcelArtifact,
  buildPdfHtmlArtifact,
  buildWordArtifact,
} from '@/lib/server/recipe-skill/exporters'
import { readRecipeRecord } from '@/lib/server/recipe-skill/storage'

export const runtime = 'nodejs'

type ExportFormat = 'word' | 'excel' | 'pdf' | 'all'

const isFormat = (value: string): value is ExportFormat =>
  value === 'word' || value === 'excel' || value === 'pdf' || value === 'all'

const buildAttachmentHeader = (fileName: string) =>
  `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

export async function GET(
  request: NextRequest,
  context: {
    params: {
      format: string
      recipeId: string
    }
  }
) {
  const denied = requireAuthenticated(request)
  if (denied) return denied

  const formatInput = (context.params?.format || '').trim().toLowerCase()
  if (!isFormat(formatInput)) {
    return NextResponse.json({ message: 'format 仅支持 word/excel/pdf/all' }, { status: 400 })
  }

  const recipeId = (context.params?.recipeId || '').trim()
  const record = await readRecipeRecord(recipeId)
  if (!record) {
    return NextResponse.json({ message: '菜谱不存在或已过期' }, { status: 404 })
  }

  const artifact =
    formatInput === 'word'
      ? await buildWordArtifact(record)
      : formatInput === 'excel'
        ? await buildExcelArtifact(record)
        : formatInput === 'pdf'
          ? await buildPdfHtmlArtifact(record)
          : await buildAllInOneZipArtifact(record)

  return new NextResponse(new Uint8Array(artifact.buffer), {
    status: 200,
    headers: {
      'Content-Type': artifact.mimeType,
      'Content-Disposition': buildAttachmentHeader(artifact.fileName),
      'Cache-Control': 'no-store',
    },
  })
}
