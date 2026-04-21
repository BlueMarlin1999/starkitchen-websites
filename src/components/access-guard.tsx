'use client'

import { LockKeyhole } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Permission, getRoleConfig, hasPermission } from '@/lib/access'
import { useAuthStore } from '@/store/auth'

interface AccessGuardProps {
  permission: Permission
  children: React.ReactNode
  title?: string
}

export function AccessGuard({ permission, children, title }: AccessGuardProps) {
  const { user } = useAuthStore()
  const roleConfig = getRoleConfig(user?.role)

  if (hasPermission(user?.role, permission)) {
    return <>{children}</>
  }

  return (
    <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>{title || '当前账号暂无此权限'}</CardTitle>
            <CardDescription>
              权限受限 Access Restricted
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
            当前角色: {roleConfig.label}
          </Badge>
          <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">
            缺少权限: {permission}
          </Badge>
        </div>
        <p className="text-sm leading-6 text-slate-300">角色说明 Role Profile: {roleConfig.label}</p>
      </CardContent>
    </Card>
  )
}
