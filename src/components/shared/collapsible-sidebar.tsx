// ===========================================
// Файл: src/components/shared/collapsible-sidebar.tsx
// Описание: Сворачиваемый сайдбар для учебника/тетради/банка.
//   Кнопка на границе сайдбара. В свёрнутом виде — скрыт,
//   контент занимает 100%. Ширина 25% экрана.
// ===========================================

"use client";

import { useState } from "react";

interface CollapsibleSidebarProps {
  children: React.ReactNode;
  contentChildren: React.ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleSidebar({ children, contentChildren, defaultOpen = true }: CollapsibleSidebarProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="flex gap-4 flex-1 min-h-0">
      {/* Sidebar */}
      {open && (
        <div className="w-1/4 min-w-[240px] max-w-[360px] flex-shrink-0 bg-muted rounded-xl p-4 overflow-y-auto">
          {children}
        </div>
      )}

      {/* Toggle button */}
      <div className="flex-shrink-0 flex items-start pt-2">
        <button
          onClick={() => setOpen(!open)}
          className="w-6 h-10 flex items-center justify-center rounded-md bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title={open ? "Collapse panel" : "Expand panel"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {open
              ? <polyline points="15 18 9 12 15 6" />
              : <polyline points="9 18 15 12 9 6" />
            }
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {contentChildren}
      </div>
    </div>
  );
}
