// ===========================================
// Файл: src/components/top-nav.tsx
// Описание: Навигация. Все цвета для тёмной темы.
// ===========================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { name: "Главная",         href: "/dashboard" },
  { name: "Курсы",           href: "/dashboard/courses" },
  { name: "Банк упражнений", href: "/dashboard/exercises" },
  { name: "Медиа",           href: "/dashboard/media" },
  { name: "Пользователи",    href: "/dashboard/users" },
];

export function TopNav({ user }: { user: { name?: string | null; email?: string | null } }) {
  const pathname = usePathname();
  const initials = user.name?.[0] || user.email?.[0] || "A";

  return (
    <header className="bg-card border-b-2 border-border sticky top-0 z-50">
      <div className="px-6 flex items-center justify-between h-14">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">LinguaMethod</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">admin</Badge>
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent"
                  }`}>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-foreground">{user.name || "Админ"}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <p className="text-sm font-medium text-foreground">{user.name || "Админ"}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-red-600 focus:text-red-600 cursor-pointer">
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
