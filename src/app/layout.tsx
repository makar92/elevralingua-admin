// ===========================================
// Файл: src/app/layout.tsx
// Путь:  elevralingua-admin/src/app/layout.tsx
//
// Описание:
//   Корневой layout. Подключение шрифтов, тема, провайдеры.
// ===========================================

import type { Metadata } from "next";
import "./globals.css";
import { Figtree } from "next/font/google";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "ElevraLingua",
  description: "B2B SaaS платформа для преподавателей иностранных языков",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={cn("font-sans", figtree.variable)}>
      <body className="bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}