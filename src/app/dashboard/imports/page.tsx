'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Camera,
  DatabaseZap,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Film,
  Mic,
  RefreshCcw,
  ShieldCheck,
  Upload,
  Waves,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AccessGuard } from '@/components/access-guard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getRoleConfig, hasPermission } from '@/lib/access'
import { fetchOaFiles, OaActorContext, OaFileRecord, uploadOaFile } from '@/lib/oa'
import { useAuthStore } from '@/store/auth'
import { useToast } from '@/hooks/use-toast'

interface QueuedFile {
  id: string
  name: string
  type: string
  sizeLabel: string
  status: 'uploading' | 'ready' | 'failed'
  progress: number
  category: 'document' | 'spreadsheet' | 'pdf'
  uploadedAt?: string
  uploaderName?: string
  errorMessage?: string
}

const formatSize = (size: number) => {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(size / 1024))} KB`
}

const formatTime = (value?: string) => {
  if (!value) return '--'
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) return '--'
  return new Date(timestamp).toLocaleString('zh-CN', { hour12: false })
}

const inferCategory = (name: string): QueuedFile['category'] => {
  const lowerName = name.toLowerCase()
  if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv')) {
    return 'spreadsheet'
  }
  if (lowerName.endsWith('.pdf')) {
    return 'pdf'
  }
  return 'document'
}

const toQueuedFileFromRecord = (record: OaFileRecord): QueuedFile => ({
  id: record.id,
  name: record.originalName,
  type: record.mimeType || 'application/octet-stream',
  sizeLabel: formatSize(record.size),
  status: 'ready',
  progress: 100,
  category: inferCategory(record.originalName),
  uploadedAt: record.uploadedAt,
  uploaderName: record.uploaderName,
})

const buildActor = (
  user: {
    employeeId: string
    nickname?: string
    name: string
    role: string
  } | null
): OaActorContext | undefined => {
  if (!user) return undefined
  return {
    employeeId: user.employeeId,
    displayName: user.nickname || user.name || user.employeeId,
    role: user.role,
  }
}

export default function ImportsPage() {
  const { user, token } = useAuthStore()
  const { toast } = useToast()
  const roleConfig = getRoleConfig(user?.role)
  const actor = useMemo(() => buildActor(user || null), [user])
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([])
  const [categoryFilter, setCategoryFilter] = useState<'all' | QueuedFile['category']>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const canUseFutureSources = hasPermission(user?.role, 'import_multimodal_sources')

  const ingestionChannels = useMemo(
    () => [
      { title: 'Word / 文档', description: '经营文档 Operating Docs', icon: FileText, status: '已上线' },
      { title: 'Excel / 表格', description: '结构化数据 Structured Data', icon: FileSpreadsheet, status: '已上线' },
      { title: 'PDF / 报表', description: '经营报表 Business Reports', icon: FileArchive, status: '已上线' },
      {
        title: '视频 / 巡检影像',
        description: '视频源 Video Streams',
        icon: Film,
        status: canUseFutureSources ? '待接入' : '需更高权限',
      },
      {
        title: '音频 / 录音',
        description: '音频源 Audio Streams',
        icon: Mic,
        status: canUseFutureSources ? '待接入' : '需更高权限',
      },
      {
        title: '摄像头 / 实时信号',
        description: '实时画面 Camera Feed',
        icon: Camera,
        status: canUseFutureSources ? '待接入' : '需更高权限',
      },
      {
        title: '业务接口 / API',
        description: '业务接口 API Sources',
        icon: DatabaseZap,
        status: canUseFutureSources ? '待接入' : '需更高权限',
      },
      {
        title: 'IoT / 设备信号',
        description: '设备信号 IoT Signals',
        icon: Waves,
        status: canUseFutureSources ? '待接入' : '需更高权限',
      },
    ],
    [canUseFutureSources]
  )

  const loadServerQueue = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const items = await fetchOaFiles(token, actor)
      setQueuedFiles(items.map((item) => toQueuedFileFromRecord(item)))
    } catch (error) {
      const message = error instanceof Error ? error.message : '读取导入队列失败'
      toast({
        title: '读取失败',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [actor, toast, token])

  useEffect(() => {
    void loadServerQueue()
  }, [loadServerQueue])

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const fileList = Array.from(files)
    const provisional = fileList.map((file, index) => ({
      id: `uploading-${Date.now()}-${index}-${file.name}`,
      name: file.name,
      type: file.type || 'application/octet-stream',
      sizeLabel: formatSize(file.size),
      status: 'uploading' as const,
      progress: 0,
      category: inferCategory(file.name),
    }))
    setQueuedFiles((current) => [...provisional, ...current])

    for (let index = 0; index < fileList.length; index += 1) {
      const file = fileList[index]
      const tempId = provisional[index]?.id
      try {
        const payload = await uploadOaFile({ file }, token, actor)
        setQueuedFiles((current) =>
          current.map((item) =>
            item.id === tempId ? toQueuedFileFromRecord(payload.file) : item
          )
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : '上传失败'
        setQueuedFiles((current) =>
          current.map((item) =>
            item.id === tempId
              ? {
                  ...item,
                  status: 'failed',
                  progress: 0,
                  errorMessage: message,
                }
              : item
          )
        )
      }
    }
  }

  const filteredQueuedFiles =
    categoryFilter === 'all'
      ? queuedFiles
      : queuedFiles.filter((file) => file.category === categoryFilter)

  return (
    <DashboardLayout>
      <AccessGuard permission="import_documents" title="当前账号无法进入知识库 / 数据导入中心">
        <div className="space-y-6">
          <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    权限已匹配 Access Synced
                  </div>
                  <div>
                    <CardTitle>知识库数据导入中心</CardTitle>
                    <CardDescription>文件接入 File Ingestion</CardDescription>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-300">
                  <div>当前角色: {roleConfig.label}</div>
                  <div className="mt-1 text-xs text-slate-500">Scope: {roleConfig.dataGranularity}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 2xl:grid-cols-[1.2fr_0.8fr]">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-primary/35 bg-primary/5 px-6 py-10 text-center transition-colors hover:bg-primary/10">
                  <Upload className="h-10 w-10 text-primary" />
                  <p className="mt-4 text-lg font-medium text-white">上传经营文件</p>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">
                    支持 `.doc` `.docx` `.xls` `.xlsx` `.csv` `.pdf`，上传后进入真实文件中枢。
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    {['Word', 'Excel', 'CSV', 'PDF'].map((item) => (
                      <Badge key={item} className="bg-white/10 text-slate-200 hover:bg-white/10">
                        {item}
                      </Badge>
                    ))}
                  </div>
                  <input
                    type="file"
                    multiple
                    accept=".doc,.docx,.xls,.xlsx,.csv,.pdf"
                    className="sr-only"
                    onChange={(event) => void handleFilesSelected(event.target.files)}
                  />
                </label>

                <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
                  <p className="text-sm font-medium text-white">导入后的真实流程</p>
                  <div className="mt-4 space-y-3 text-sm text-slate-300">
                    <div>1. 上传落库 Upload to secure storage</div>
                    <div>2. 审计记账 Audit trail</div>
                    <div>3. 数据映射准备 Data mapping ready</div>
                    <div>4. 可追溯下载 Traceable download</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
                {ingestionChannels.map((channel) => {
                  const Icon = channel.icon
                  return (
                    <Card key={channel.title} className="border-white/10 bg-slate-950/35 text-white">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
                            <Icon className="h-5 w-5" />
                          </div>
                          <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">{channel.status}</Badge>
                        </div>
                        <p className="mt-4 font-medium">{channel.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-400">{channel.description}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>导入队列</CardTitle>
                  <CardDescription>真实上传记录 Import Queue</CardDescription>
                </div>
                <Button
                  variant="outline"
                  className="border-white/20 bg-white/[0.04] text-slate-100 hover:bg-white/[0.1]"
                  onClick={() => void loadServerQueue()}
                  disabled={isRefreshing}
                >
                  <RefreshCcw className="mr-1 h-3.5 w-3.5" />
                  {isRefreshing ? '刷新中...' : '刷新'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: '全部' },
                  { key: 'document', label: '文档' },
                  { key: 'spreadsheet', label: '表格' },
                  { key: 'pdf', label: 'PDF' },
                ].map((item) => (
                  <Button
                    key={item.key}
                    type="button"
                    variant="outline"
                    onClick={() => setCategoryFilter(item.key as 'all' | QueuedFile['category'])}
                    className={`min-h-11 border-white/15 px-3 ${
                      categoryFilter === item.key
                        ? 'bg-primary/15 text-primary hover:bg-primary/20'
                        : 'bg-white/5 text-slate-200 hover:bg-white/[0.10] hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>

              {filteredQueuedFiles.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/35 px-4 py-8 text-center text-sm text-slate-400">
                  当前无文件 No Pending Files
                </div>
              ) : (
                filteredQueuedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3">
                    <div>
                      <p className="font-medium text-white">{file.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {file.sizeLabel} · {file.category} · {file.type}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        上传时间: {formatTime(file.uploadedAt)} {file.uploaderName ? `· 上传人 ${file.uploaderName}` : ''}
                      </p>
                      <div className="mt-2 h-1.5 w-48 rounded-full bg-white/10">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-[#4f7ceb] to-[#8cb4ff] transition-all"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                      {file.errorMessage ? (
                        <p className="mt-1 text-xs text-red-200">{file.errorMessage}</p>
                      ) : null}
                    </div>
                    <Badge
                      className={
                        file.status === 'ready'
                          ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15'
                          : file.status === 'failed'
                            ? 'bg-red-500/15 text-red-200 hover:bg-red-500/15'
                            : 'bg-primary/15 text-primary hover:bg-primary/15'
                      }
                    >
                      {file.status === 'ready' ? '已入库' : file.status === 'failed' ? '上传失败' : '上传中'}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
