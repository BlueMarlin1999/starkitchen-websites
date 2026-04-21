'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AccessGuard } from '@/components/access-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  downloadOaFile,
  fetchOaFiles,
  fetchOaRooms,
  OaActorContext,
  OaFileRecord,
  OaRoom,
  uploadOaFile,
} from '@/lib/oa'
import { useAuthStore } from '@/store/auth'
import { Download, Files, RefreshCw, UploadCloud } from 'lucide-react'

const panelClassName =
  'rounded-3xl border border-white/10 bg-[linear-gradient(150deg,rgba(27,48,96,0.78)_0%,rgba(14,31,71,0.86)_48%,rgba(8,19,47,0.88)_100%)] text-white shadow-[0_18px_50px_rgba(2,8,26,0.42)] backdrop-blur-xl'

const formatTime = (value?: string) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN')
}

const formatSize = (size: number) => {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${size} B`
}

export default function OaFilesPage() {
  const { token, user } = useAuthStore()
  const actor = useMemo<OaActorContext>(
    () => ({
      employeeId: user?.employeeId || 'anonymous',
      displayName: user?.nickname?.trim() || user?.name || user?.employeeId || '匿名用户',
      role: user?.role || '',
    }),
    [user]
  )

  const [files, setFiles] = useState<OaFileRecord[]>([])
  const [rooms, setRooms] = useState<OaRoom[]>([])
  const [filterRoomId, setFilterRoomId] = useState('')
  const [uploadRoomId, setUploadRoomId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  const loadRooms = useCallback(async () => {
    const items = await fetchOaRooms(token, actor)
    setRooms(items)
    setUploadRoomId((currentRoomId) => {
      if (!currentRoomId && items.length > 0) return items[0].id
      return currentRoomId
    })
  }, [actor, token])

  const loadFiles = useCallback(async (roomId = '') => {
    setIsLoading(true)
    setError('')
    try {
      const items = await fetchOaFiles(token, actor, roomId || undefined)
      setFiles(items)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '读取文件失败')
    } finally {
      setIsLoading(false)
    }
  }, [actor, token])

  useEffect(() => {
    let disposed = false
    const bootstrap = async () => {
      try {
        await loadRooms()
        if (!disposed) {
          await loadFiles('')
        }
      } catch (bootstrapError) {
        if (!disposed) {
          setError(bootstrapError instanceof Error ? bootstrapError.message : '读取文件模块失败')
        }
      }
    }
    void bootstrap()
    return () => {
      disposed = true
    }
  }, [loadFiles, loadRooms])

  useEffect(() => {
    void loadFiles(filterRoomId)
  }, [filterRoomId, loadFiles])

  const handleUpload = async (file: File | null) => {
    if (!file) return
    setIsUploading(true)
    setError('')
    try {
      await uploadOaFile({ file, roomId: uploadRoomId || undefined }, token, actor)
      await loadFiles(filterRoomId)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '上传失败')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = async (file: OaFileRecord) => {
    try {
      await downloadOaFile(file.id, file.originalName, token, actor)
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : '下载失败')
    }
  }

  return (
    <DashboardLayout>
      <AccessGuard permission="view_dashboard" title="当前账号无权访问 OA 文件中枢">
        <div className="space-y-4">
          <Card className={panelClassName}>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>OA 文件中枢</CardTitle>
                  <CardDescription>Secure File Transfer & Traceability</CardDescription>
                </div>
                <Button
                  variant="outline"
                  className="min-h-11 border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
                  onClick={() => {
                    void loadRooms()
                    void loadFiles(filterRoomId)
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  刷新
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Card className="border-white/10 bg-slate-950/35 text-white">
                <CardContent className="grid gap-3 p-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                  <label className="space-y-1 text-xs text-slate-400">
                    上传到会话
                    <select
                      value={uploadRoomId}
                      onChange={(event) => setUploadRoomId(event.target.value)}
                      className="h-11 w-full rounded-lg border border-white/15 bg-white/10 px-3 text-sm text-white outline-none"
                    >
                      <option value="">不绑定会话（仅文件库）</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-xs text-slate-400">
                    文件筛选
                    <select
                      value={filterRoomId}
                      onChange={(event) => setFilterRoomId(event.target.value)}
                      className="h-11 w-full rounded-lg border border-white/15 bg-white/10 px-3 text-sm text-white outline-none"
                    >
                      <option value="">全部会话</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-primary/30 bg-primary/15 px-4 text-sm text-primary transition hover:bg-primary/25">
                    <UploadCloud className="mr-2 h-4 w-4" />
                    {isUploading ? '上传中...' : '上传文件'}
                    <input
                      type="file"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null
                        void handleUpload(file)
                        event.currentTarget.value = ''
                      }}
                    />
                  </label>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-slate-950/35 text-white">
                <CardContent className="space-y-2 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-200">
                      <Files className="h-4 w-4 text-primary" />
                      文件列表
                    </div>
                    <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">
                      {isLoading ? '同步中...' : `${files.length} 个文件`}
                    </Badge>
                  </div>

                  <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-100">{file.originalName}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            上传人 {file.uploaderName} · {formatSize(file.size)} · {formatTime(file.uploadedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-white/10 text-slate-300 hover:bg-white/10">
                            {file.roomId ? `会话 ${file.roomId}` : '文件库'}
                          </Badge>
                          <Button
                            className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => void handleDownload(file)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            下载
                          </Button>
                        </div>
                      </div>
                    ))}
                    {files.length === 0 && !isLoading ? (
                      <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
                        暂无文件，先上传一个试试
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {error ? (
            <Card className="border-red-400/25 bg-red-500/10 text-red-100">
              <CardContent className="p-4 text-sm">{error}</CardContent>
            </Card>
          ) : null}
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
