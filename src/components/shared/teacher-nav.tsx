// ===========================================
// Файл: src/components/shared/teacher-nav.tsx
// Описание: Верхняя навигация кабинета учителя.
// ===========================================

"use client";

import { useState, useEffect } from "react";
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
  { name: "Главная",        href: "/teacher" },
  { name: "Мои классы",     href: "/teacher/classrooms" },
  { name: "Каталог курсов", href: "/teacher/courses" },
  { name: "Приглашения",    href: "/teacher/invitations" },
];

export function TeacherNav({ user }: { user: any }) {
  const pathname = usePathname();
  const [pendingInvCount, setPendingInvCount] = useState(0);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    await fetch("/api/auth/set-role", { method: "DELETE" });
    signOut({ callbackUrl: "/login" });
  };

  useEffect(() => {
    fetch("/api/invitations?direction=received&type=STUDENT_REQUESTS")
      .then(r => r.ok ? r.json() : [])
      .then(d => setPendingInvCount(Array.isArray(d) ? d.filter((i: any) => i.status === "PENDING").length : 0))
      .catch(() => {});
  }, [pathname]);

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="px-6 flex items-center justify-between h-14">
        <div className="flex items-center gap-8">
          <Link href="/teacher">
            <Logo height={36} showSlogan={false} />
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/teacher" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors relative ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent"
                  }`}>
                  {item.name}
                  {item.href === "/teacher/invitations" && pendingInvCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{pendingInvCount}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="px-2 py-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer">
              <UserBadge user={user} role="TEACHER" size="sm" showStatus={false} showRole={true} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-2">
              <UserBadge user={user} role="TEACHER" size="md" showStatus={false} showRole={true} />
              <p className="text-xs text-muted-foreground truncate mt-1 pl-10">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-red-600 focus:text-red-600 cursor-pointer">
              Sign out
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {!["sarah.chen@demo.com", "emma.wilson@demo.com", "ksenia@elevralingua.com"].includes(user.email) && (
              <>
                {!showDelete ? (
                  <DropdownMenuItem onClick={(e) => { e.preventDefault(); setShowDelete(true); }}
                    className="text-muted-foreground text-xs cursor-pointer">
                    Delete account
                  </DropdownMenuItem>
                ) : (
                  <div className="px-2 py-2 space-y-2">
                    <p className="text-xs text-red-600">Delete account permanently?</p>
                    <div className="flex gap-1">
                      <button onClick={handleDeleteAccount} disabled={deleting}
                        className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                        {deleting ? "..." : "Delete"}
                      </button>
                      <button onClick={() => setShowDelete(false)}
                        className="text-xs px-2 py-1 rounded hover:bg-accent">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
