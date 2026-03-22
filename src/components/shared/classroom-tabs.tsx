"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { id: string; name: string; href: string };

export function ClassroomTabs({ basePath, tabs }: { basePath: string; tabs: Tab[] }) {
  const pathname = usePathname();
  return (
    <div className="border-b border-border mb-6">
      <nav className="flex gap-1 -mb-px">
        {tabs.map(tab => {
          const href = `${basePath}${tab.href}`;
          const isActive = tab.href === "" ? (pathname === basePath || pathname === basePath + "/") : (pathname === href || pathname.startsWith(href + "/"));
          return (
            <Link key={tab.id} href={href} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`}>
              {tab.name}
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
  { id: "bank", name: "Банк", href: "/bank" },
  { id: "students", name: `Ученики${n != null ? ` (${n})` : ""}`, href: "/students" },
];

export const STUDENT_TABS = [
  { id: "textbook", name: "Учебник", href: "/textbook" },
  { id: "workbook", name: "Тетрадь", href: "/workbook" },
  { id: "diary", name: "Дневник", href: "/diary" },
];
