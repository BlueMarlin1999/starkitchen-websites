'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import { CompanyLogo } from '@/components/company-logo';
import { COMPANY_NAME_EN, COMPANY_NAME_ZH } from '@/lib/brand';
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Zap,
  BarChart3,
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: '首页概览', href: '/dashboard' },
  { icon: MessageSquare, label: '超级助手', href: '/dashboard/chat' },
  { icon: Zap, label: '企业 Skills', href: '/dashboard/skills' },
  { icon: BookOpen, label: '知识库', href: '/dashboard/knowledge' },
  { icon: BarChart3, label: '数据查看', href: '/dashboard/analytics' },
  { icon: Users, label: '用户管理', href: '/dashboard/users' }
];

function SidebarLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="h-16 flex items-center justify-center border-b border-border px-4">
      <div className="flex items-center gap-3">
        <CompanyLogo iconClassName="h-7 w-7 rounded-lg p-0.5" />
        {!collapsed && (
          <div>
            <p className="font-bold text-foreground">{COMPANY_NAME_ZH}</p>
            <p className="text-xs text-muted-foreground">{COMPANY_NAME_EN}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SidebarNav({ collapsed, pathname }: { collapsed: boolean; pathname: string }) {
  return (
    <nav className="flex-1 py-4 px-2 space-y-1">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
            title={collapsed ? item.label : undefined}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarUserInfo({ collapsed, name, role }: { collapsed: boolean; name?: string; role?: string }) {
  return (
    <div className="border-t border-border p-4">
      <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#081d43] via-[#0f2e63] to-[#1a4a88] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-medium">{name?.[0] || 'U'}</span>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{name}</p>
            <p className="text-xs text-muted-foreground truncate">{role}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SidebarCollapseButton({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="absolute -right-3 top-20 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center hover:bg-accent"
    >
      {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
    </button>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user } = useAuthStore();

  return (
    <aside
      className={cn(
        'bg-card border-r border-border flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <SidebarLogo collapsed={collapsed} />
      <SidebarNav collapsed={collapsed} pathname={pathname} />
      <SidebarUserInfo collapsed={collapsed} name={user?.name} role={user?.role} />
      <SidebarCollapseButton collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
    </aside>
  );
}
