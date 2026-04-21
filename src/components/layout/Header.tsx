'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Search, Bell, LogOut, User, Settings } from 'lucide-react';

function SearchInput({
  searchQuery,
  onChange,
}: {
  searchQuery: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex-1 max-w-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="搜索..."
          value={searchQuery}
          onChange={(event) => onChange(event.target.value)}
          className="pl-10 w-full max-w-md"
        />
      </div>
    </div>
  );
}

function NotificationButton() {
  return (
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="w-5 h-5" />
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[10px] text-white flex items-center justify-center">
        3
      </span>
    </Button>
  );
}

function UserMenu({ name, onLogout }: { name?: string; onLogout: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#081d43] via-[#0f2e63] to-[#1a4a88] flex items-center justify-center">
            <span className="text-white text-sm font-medium">{name?.[0] || 'U'}</span>
          </div>
          <span className="hidden sm:inline text-sm">{name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>我的账户</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="w-4 h-4 mr-2" />
          个人资料
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="w-4 h-4 mr-2" />
          设置
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="text-destructive">
          <LogOut className="w-4 h-4 mr-2" />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header() {
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      <SearchInput searchQuery={searchQuery} onChange={setSearchQuery} />
      <div className="flex items-center gap-4">
        <NotificationButton />
        <UserMenu name={user?.name} onLogout={logout} />
      </div>
    </header>
  );
}
