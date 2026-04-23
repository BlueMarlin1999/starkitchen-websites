'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { AccessGuard } from '@/components/access-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { COMPANY_NAME_ZH } from '@/lib/brand'
import { useToast } from '@/hooks/use-toast'

export default function SettingsPage() {
  const { toast } = useToast()

  return (
    <DashboardLayout>
      <AccessGuard permission="manage_settings" title="当前账号无权修改系统设置">
      <div className="max-w-2xl">
        <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
          <CardHeader>
            <CardTitle>系统设置</CardTitle>
            <CardDescription>参数配置 System Config</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">基本设置</h3>
              
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="company">公司名称</Label>
                  <Input id="company" defaultValue={COMPANY_NAME_ZH} className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary" />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="email">系统邮箱</Label>
                  <Input id="email" type="email" defaultValue="" className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary" />
                </div>
              </div>
            </div>

            <Separator className="bg-white/10" />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">通知设置</h3>
              
              <div className="flex min-h-11 items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notify">邮件通知</Label>
                  <p className="text-sm text-slate-400">邮件通知 Email Alerts</p>
                </div>
                <Switch id="email-notify" defaultChecked />
              </div>
              
              <div className="flex min-h-11 items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <Label htmlFor="sms-notify">短信通知</Label>
                  <p className="text-sm text-slate-400">短信通知 SMS Alerts</p>
                </div>
                <Switch id="sms-notify" />
              </div>
            </div>

            <Separator className="bg-white/10" />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">安全设置</h3>
              
              <div className="flex min-h-11 items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <Label htmlFor="two-factor-auth">双重验证</Label>
                  <p className="text-sm text-slate-400">双重验证 Two-factor Auth</p>
                </div>
                <Switch id="two-factor-auth" defaultChecked />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                onClick={() =>
                  toast({
                    title: '设置已重置',
                    description: '页面参数已恢复默认值，请确认后再次保存。',
                  })
                }
              >
                重置
              </Button>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() =>
                  toast({
                    title: '设置已保存',
                    description: '系统配置已提交，预计 10 秒内生效。',
                  })
                }
              >
                保存设置
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      </AccessGuard>
    </DashboardLayout>
  )
}
