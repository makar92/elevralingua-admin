"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { id: string; name: string; href: string; badge?: string | number | null };

export function ClassroomTabs({ basePath, tabs }: { basePath: string; tabs: Tab[] }) {
  const pathname = usePathname();
  return (
    <div className="border-b border-border mb-6">
      <nav className="flex gap-1 -mb-px">
        {tabs.map(tab => {
          const href = `${basePath}${tab.href}`;
          const isActive = tab.href === "" ? (pathname === basePath || pathname === basePath + "/") : (pathname === href || pathname.startsWith(href + "/"));
          return (
            <Link key={tab.id} href={href} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors relative ${isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`}>
              {tab.name}
              {tab.badge != null && Number(tab.badge) > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export const TEACHER_TABS = (n?: number) => [
  { id: "journal", name: "Журнал", href: "" },
  { id: "textbook", name: "Учебник", href: "/textbook" },
  { id: "workbook", name: "Тетрадь", href: "/workbook" },
  { id: "bank", name: "Банк упражнений", href: "/bank" },
  { id: "students", name: `Ученики${n != null ? ` (${n})` : ""}`, href: "/students" },
];

export const STUDENT_TABS = (textbookBadge?: number, workbookBadge?: number) => [
  { id: "diary", name: "Дневник", href: "/diary" },
  { id: "textbook", name: "Учебник", href: "/textbook", badge: textbookBadge },
  { id: "workbook", name: "Тетрадь", href: "/workbook", badge: workbookBadge },
];
