'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Book, MessageCircle, Video, Mail } from 'lucide-react'

export default function HelpPage() {
  const [keyword, setKeyword] = useState('')
  const faqs = [
    {
      question: '如何重置密码？',
      answer: '登录页点击“忘记密码”即可重置。Reset via Forgot Password.'
    },
    {
      question: '如何添加新用户？',
      answer: '进入用户管理后新建用户。Create in User Management.'
    },
    {
      question: '系统支持哪些文件格式？',
      answer: '支持 PDF/Excel/Word/图片，单文件 50MB。Formats + 50MB limit.'
    },
    {
      question: '如何导出报表？',
      answer: '在报表中心选择模板后下载。Export from Reports.'
    },
  ]

  const resources = [
    { title: '使用文档', icon: Book, desc: 'Docs', href: '/dashboard/documents/' },
    { title: '视频教程', icon: Video, desc: 'Videos', href: '/dashboard/reports/' },
    { title: '在线客服', icon: MessageCircle, desc: 'Chat', href: '/dashboard/chat/' },
    { title: '邮件支持', icon: Mail, desc: 'support@starkitchen.works', href: 'mailto:support@starkitchen.works' },
  ]
  const normalizedKeyword = keyword.trim().toLowerCase()
  const filteredFaqs = faqs.filter((faq) => {
    if (!normalizedKeyword) return true
    return `${faq.question} ${faq.answer}`.toLowerCase().includes(normalizedKeyword)
  })

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">帮助中心</h2>
          <p className="mb-6 text-slate-400">常见问题 FAQ</p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input 
              placeholder="搜索问题..." 
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              className="h-12 border-white/10 bg-white/5 pl-10 text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          {resources.map((resource, i) => {
            const Icon = resource.icon

            const card = (
              <Card className="h-full border-white/10 bg-white/[0.06] text-white backdrop-blur transition-shadow hover:shadow-md hover:shadow-primary/10">
                <CardContent className="flex min-h-[170px] flex-col justify-between p-6 text-center">
                  <div>
                    <Icon className="mx-auto mb-3 h-8 w-8 text-primary" />
                    <h3 className="font-medium mb-1">{resource.title}</h3>
                    <p className="text-sm text-slate-400">{resource.desc}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-4 h-11 border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white"
                  >
                    进入
                  </Button>
                </CardContent>
              </Card>
            )

            if (!resource.href) {
              return <div key={i}>{card}</div>
            }

            return (
              <Link key={i} href={resource.href}>
                {card}
              </Link>
            )
          })}
        </div>

        <Card className="border-white/10 bg-white/[0.06] text-white backdrop-blur">
          <CardHeader>
            <CardTitle>常见问题</CardTitle>
            <CardDescription>快速解答 Quick Answers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredFaqs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/15 bg-slate-950/35 px-4 py-8 text-center text-sm text-slate-400">
                  未命中结果 No matching FAQ.
                </div>
              ) : filteredFaqs.map((faq, i) => (
                <div key={i} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                  <h4 className="font-medium mb-2">{faq.question}</h4>
                  <p className="text-slate-400">{faq.answer}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
