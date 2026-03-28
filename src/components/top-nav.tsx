// ===========================================
// Файл: src/components/top-nav.tsx
// Описание: Навигация админки.
// ===========================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Logo } from "@/components/shared/logo";
import { UserBadge } from "@/components/shared/user-badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { name: "Dashboard",      href: "/dashboard" },
  { name: "Courses",        href: "/dashboard/courses" },
  { name: "Roadmap",      href: "/dashboard/roadmap" },
];

export function TopNav({ user }: { user: { name?: string | null; email?: string | null; role?: string | null; image?: string | null } }) {
  const pathname = usePathname();

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="px-6 flex items-center justify-between h-14">
        <div className="flex items-center gap-8">
          <Link href="/dashboard">
            <Logo height={36} showSlogan={false} />
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
            <button className="px-2 py-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer">
              <UserBadge user={user} size="sm" showStatus={false} showRole={true} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-2">
              <UserBadge user={user} size="md" showStatus={false} showRole={true} />
              <p className="text-xs text-muted-foreground truncate mt-1 pl-10">{user.email}</p>
            </div>
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
