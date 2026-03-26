"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { id: string; name: string; href: string; badge?: string | number | null };

export function ClassroomTabs({ basePath, tabs }: { basePath: string; tabs: Tab[] }) {
  const pathname = usePathname();
  return (
    <div className="mb-6">
      <div className="flex items-end">
        {tabs.map((tab, i) => {
          const href = `${basePath}${tab.href}`;
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={tab.id}
              href={href}
              className={`relative px-6 py-2.5 text-sm font-semibold transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground z-10"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent z-0"
              }`}
              style={{
                clipPath: "polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)",
                marginLeft: i > 0 ? "-8px" : "0",
              }}
            >
              {tab.name}
              {tab.badge != null && Number(tab.badge) > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
      <div className="h-[3px] bg-primary" />
    </div>
  );
}

export const TEACHER_TABS = (n?: number) => [
  { id: "journal", name: "Журнал", href: "/journal" },
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
