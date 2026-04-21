'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { BookOpen, FileText, Folder, ImageIcon, Upload } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AccessGuard } from '@/components/access-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type KnowledgeFileType = 'excel' | 'pdf' | 'image' | 'word' | 'csv'

interface KnowledgeFolder {
  id: string
  name: string
}

interface KnowledgeFile {
  id: string
  name: string
  type: KnowledgeFileType
  size: string
  date: string
  folderId: string
}

const folders: KnowledgeFolder[] = [
  { id: 'ops', name: '运营标准 SOP' },
  { id: 'finance', name: '财务与审计资料' },
  { id: 'safety', name: '食安与 EHS 指引' },
  { id: 'training', name: '培训与实战案例' },
]

const files: KnowledgeFile[] = [
  { id: 'f-1', name: '华东区域经营月报_2026-03.xlsx', type: 'excel', size: '245 KB', date: '今天', folderId: 'finance' },
  { id: 'f-2', name: '食安巡检复盘_上海区域.pdf', type: 'pdf', size: '3.2 MB', date: '昨天', folderId: 'safety' },
  { id: 'f-3', name: '后厨动线整改前后对比.jpg', type: 'image', size: '5.1 MB', date: '3天前', folderId: 'ops' },
  { id: 'f-4', name: '团餐项目交付标准V2.docx', type: 'word', size: '156 KB', date: '1周前', folderId: 'training' },
  { id: 'f-5', name: '门店损耗追踪_2026W13.csv', type: 'csv', size: '92 KB', date: '今天', folderId: 'ops' },
  { id: 'f-6', name: '营运利润桥接_华北.xlsx', type: 'excel', size: '198 KB', date: '2天前', folderId: 'finance' },
]

const typeLabel: Record<KnowledgeFileType, string> = {
  excel: 'Excel',
  pdf: 'PDF',
  image: 'Image',
  word: 'Word',
  csv: 'CSV',
}

const getFileIcon = (type: KnowledgeFileType) => {
  if (type === 'image') return <ImageIcon className="h-5 w-5 text-fuchsia-300" />
  return <FileText className="h-5 w-5 text-primary" />
}

export default function DocumentsPage() {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>(
    Object.fromEntries(folders.map((folder) => [folder.id, true]))
  )
  const [activeFolderId, setActiveFolderId] = useState(folders[0].id)
  const [activeFileId, setActiveFileId] = useState(files[0].id)

  const filesByFolder = useMemo(
    () =>
      folders.reduce<Record<string, KnowledgeFile[]>>((acc, folder) => {
        acc[folder.id] = files.filter((file) => file.folderId === folder.id)
        return acc
      }, {}),
    []
  )

  const visibleFiles = filesByFolder[activeFolderId] || []
  const activeFile = files.find((file) => file.id === activeFileId) || visibleFiles[0] || null

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((current) => ({
      ...current,
      [folderId]: !current[folderId],
    }))
  }

  const downloadFile = (file: KnowledgeFile) => {
    const content = `File: ${file.name}\nType: ${typeLabel[file.type]}\nUpdated: ${file.date}\nFolder: ${folderIdToName(file.folderId)}\n`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${file.name}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const folderIdToName = (folderId: string) => folders.find((item) => item.id === folderId)?.name || folderId

  return (
    <DashboardLayout>
      <AccessGuard permission="view_documents" title="当前账号无权进入知识库">
        <div className="space-y-4">
          <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    知识库
                  </CardTitle>
                  <CardDescription>知识沉淀 Knowledge Hub</CardDescription>
                </div>
                <Button asChild className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href="/dashboard/documents/imports/">
                    <Upload className="mr-2 h-4 w-4" />
                    数据导入
                  </Link>
                </Button>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
            {folders.map((folder) => {
              const isExpanded = expandedFolders[folder.id]
              const folderFiles = filesByFolder[folder.id] || []
              const isActive = activeFolderId === folder.id

              return (
                <Card
                  key={folder.id}
                  className={`border bg-white/[0.06] text-white backdrop-blur ${
                    isActive ? 'border-primary/40' : 'border-white/10'
                  }`}
                >
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-h-11 items-center gap-3">
                        <Folder className="h-9 w-9 text-primary" />
                        <div>
                          <p className="font-medium">{folder.name}</p>
                          <p className="text-xs text-slate-400">{folderFiles.length} 个文件</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-11 border-white/15 bg-white/5 text-slate-200 hover:bg-white/[0.10] hover:text-white"
                        onClick={() => toggleFolder(folder.id)}
                      >
                        {isExpanded ? '收起' : '展开'}
                      </Button>
                    </div>
                    {isExpanded && (
                      <Button
                        type="button"
                        className="min-h-11 w-full bg-primary/15 text-primary hover:bg-primary/20"
                        onClick={() => {
                          setActiveFolderId(folder.id)
                          if (folderFiles[0]) {
                            setActiveFileId(folderFiles[0].id)
                          }
                        }}
                      >
                        查看文件
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="grid gap-4 2xl:grid-cols-[1.15fr_0.85fr]">
            <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
              <CardHeader>
                <CardTitle>文件列表</CardTitle>
                <CardDescription>当前目录 Current Folder</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {visibleFiles.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/35 px-4 py-8 text-center text-sm text-slate-400">
                    当前目录为空 Empty Folder
                  </div>
                ) : (
                  visibleFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`rounded-xl border p-3 ${
                        activeFile?.id === file.id
                          ? 'border-primary/35 bg-primary/10'
                          : 'border-white/10 bg-slate-950/35'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06]">
                            {getFileIcon(file.type)}
                          </div>
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-xs text-slate-400">
                              {file.size} · {file.date}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="min-h-11 border-white/15 bg-white/5 text-slate-200 hover:bg-white/[0.10] hover:text-white"
                            onClick={() => setActiveFileId(file.id)}
                          >
                            查看
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="min-h-11 border-white/15 bg-white/5 text-slate-200 hover:bg-white/[0.10] hover:text-white"
                            onClick={() => downloadFile(file)}
                          >
                            下载
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
              <CardHeader>
                <CardTitle>文件详情</CardTitle>
                <CardDescription>详情 Detail</CardDescription>
              </CardHeader>
              <CardContent>
                {activeFile ? (
                  <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                    <p className="text-sm font-semibold text-white">{activeFile.name}</p>
                    <div className="grid gap-2 text-sm text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">类型</span>
                        <Badge className="bg-primary/12 text-primary hover:bg-primary/12">{typeLabel[activeFile.type]}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">大小</span>
                        <span>{activeFile.size}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">更新时间</span>
                        <span>{activeFile.date}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">目录</span>
                        <span>{folderIdToName(activeFile.folderId)}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        type="button"
                        className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => setActiveFileId(activeFile.id)}
                      >
                        打开查看
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-11 border-white/15 bg-white/5 text-slate-200 hover:bg-white/[0.10] hover:text-white"
                        onClick={() => downloadFile(activeFile)}
                      >
                        下载文件
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/35 px-4 py-8 text-center text-sm text-slate-400">
                    请选择文件 Select a file
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
