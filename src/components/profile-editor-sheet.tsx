'use client'

import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Camera, Save, Upload, XCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useAuthStore } from '@/store/auth'

interface ProfileEditorSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024

export function ProfileEditorSheet({ open, onOpenChange }: ProfileEditorSheetProps) {
  const { user, updateProfile } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [avatar, setAvatar] = useState<string | undefined>(undefined)
  const [isSaving, setIsSaving] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const previewName = nickname.trim() || name.trim() || '用户'
  const previewInitials = previewName.slice(0, 2).toUpperCase()

  const stopCamera = () => {
    if (!streamRef.current) return

    streamRef.current.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setIsCameraActive(false)
  }

  useEffect(() => {
    if (open) {
      setName(user?.name || '')
      setNickname(user?.nickname || '')
      setAvatar(user?.avatar)
      setErrorMessage('')
      return
    }

    stopCamera()
  }, [open, user?.avatar, user?.name, user?.nickname])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const handleOpenCamera = async () => {
    setErrorMessage('')

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('当前浏览器不支持摄像头拍照，请改用上传头像。')
      return
    }

    try {
      stopCamera()

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      streamRef.current = stream
      setIsCameraActive(true)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (error) {
      console.error('Failed to open camera', error)
      setErrorMessage('无法打开摄像头，请检查系统权限后重试。')
      stopCamera()
    }
  }

  const handleCapture = () => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setErrorMessage('摄像头画面尚未就绪，请稍后再拍照。')
      return
    }

    const maxSide = 640
    const sourceW = video.videoWidth
    const sourceH = video.videoHeight
    const scale = Math.min(1, maxSide / Math.max(sourceW, sourceH))
    const targetW = Math.max(1, Math.floor(sourceW * scale))
    const targetH = Math.max(1, Math.floor(sourceH * scale))

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setErrorMessage('拍照失败，请改用上传头像。')
      return
    }

    ctx.drawImage(video, 0, 0, targetW, targetH)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
    setAvatar(dataUrl)
    setErrorMessage('')
    stopCamera()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMessage('只支持图片文件（JPG / PNG / WEBP）。')
      event.target.value = ''
      return
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setErrorMessage('图片超过 5MB，请压缩后再上传。')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setAvatar(typeof reader.result === 'string' ? reader.result : undefined)
      setErrorMessage('')
    }
    reader.onerror = () => {
      setErrorMessage('读取图片失败，请重试。')
    }
    reader.readAsDataURL(file)

    event.target.value = ''
  }

  const handleSave = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setErrorMessage('姓名不能为空。')
      return
    }

    setIsSaving(true)

    try {
      updateProfile({
        name: trimmedName,
        nickname: nickname.trim() || undefined,
        avatar,
      })

      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-white/10 bg-[linear-gradient(180deg,_#07142f_0%,_#0c2249_48%,_#143769_100%)] text-white sm:max-w-xl"
      >
        <SheetHeader className="space-y-2">
          <SheetTitle className="text-white">个人资料</SheetTitle>
          <SheetDescription className="text-slate-300">
            修改资料 Profile Update
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <p className="text-sm text-slate-300">头像预览</p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatar} alt={previewName} />
                <AvatarFallback className="bg-gradient-to-br from-[#081d43] via-[#0f2e63] to-[#1a4a88] text-lg text-white">
                  {previewInitials}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.1] hover:text-white"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  上传头像
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.1] hover:text-white"
                  onClick={isCameraActive ? stopCamera : handleOpenCamera}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {isCameraActive ? '关闭摄像头' : '打开摄像头'}
                </Button>
                {isCameraActive && (
                  <Button
                    type="button"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleCapture}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    拍照并使用
                  </Button>
                )}
              </div>
            </div>

            {isCameraActive && (
              <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
                <video ref={videoRef} autoPlay playsInline muted className="h-56 w-full object-cover" />
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name" className="text-slate-200">
                姓名
              </Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="请输入姓名"
                className="border-white/15 bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:ring-primary"
                maxLength={30}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-nickname" className="text-slate-200">
                昵称
              </Label>
              <Input
                id="profile-nickname"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="请输入昵称（可选）"
                className="border-white/15 bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:ring-primary"
                maxLength={20}
              />
              <p className="text-xs text-slate-400">昵称优先显示 Nickname First</p>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}
        </div>

        <SheetFooter className="mt-8">
          <Button
            type="button"
            variant="ghost"
            className="text-slate-300 hover:bg-white/[0.08] hover:text-white"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button type="button" className="gap-2" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4" />
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
