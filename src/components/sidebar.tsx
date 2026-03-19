// ===========================================
// Файл: src/components/sidebar.tsx
// Путь:  linguamethod-admin/src/components/sidebar.tsx
//
// Описание:
//   Боковое меню приложения.
//   Навигация по разделам, информация о пользователе,
//   кнопка выхода.
//   Все цвета через CSS-переменные (не хардкод).
// ===========================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

// Пункты навигации
const nav = [
  { name: "Главная",         href: "/dashboard",          icon: "📊" },
  { name: "Курсы",           href: "/dashboard/courses",   icon: "📚" },
  { name: "Банк упражнений", href: "/dashboard/exercises", icon: "📝" },
];

export function Sidebar({ user }: { user: { name?: string | null; email?: string | null } }) {
  // Текущий путь для подсветки активного пункта
  const pathname = usePathname();

  return (
    <aside
      className="w-64 flex-shrink-0 flex flex-col border-r border-border"
      style={{ background: "var(--sidebar)" }}
    >
      {/* Логотип */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-primary">LinguaMethod</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Admin Panel</p>
      </div>

      {/* Навигация */}
      <nav className="flex-1 p-4 space-y-1">
        {nav.map((item) => {
          // Определяем активный пункт меню
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Блок пользователя */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          {/* Аватар — первая буква имени */}
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">
            {user.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user.name || "Admin"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        {/* Кнопка выхода */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors"
        >
          Выйти
        </button>
      </div>
    </aside>
  );
}
