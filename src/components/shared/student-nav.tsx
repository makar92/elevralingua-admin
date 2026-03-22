// ===========================================
// Файл: src/components/shared/student-nav.tsx
// Описание: Верхняя навигация кабинета ученика.
// ===========================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { name: "Главная",        href: "/student" },
  { name: "Мои классы",     href: "/student/classrooms" },
  { name: "Найти класс",    href: "/student/search" },
  { name: "Приглашения",    href: "/student/invitations" },
  { name: "Расписание",     href: "/student/schedule" },
];

export function StudentNav({ user }: { user: any }) {
  const pathname = usePathname();
  const initials = user.name?.[0] || user.email?.[0] || "S";

  return (
    <header className="bg-card border-b-2 border-border sticky top-0 z-50">
      <div className="px-6 flex items-center justify-between h-14">
        <div className="flex items-center gap-8">
          <Link href="/student" className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">LinguaMethod</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-blue-600 border-blue-300">
              ученик
            </Badge>
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/student" && pathname.startsWith(item.href));
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
                <AvatarImage src={user.image || undefined} />
                <AvatarFallback className="text-xs bg-blue-100 text-blue-700">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-foreground">{user.name || "Ученик"}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{user.name || "Ученик"}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-red-600 focus:text-red-600 cursor-pointer">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
