import type { Metadata } from "next";
import "./globals.css";
import { Figtree } from "next/font/google";
import { cn } from "@/lib/utils";

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "LinguaMethod Admin",
  description: "Панель управления контентом LinguaMethod",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={cn("dark font-sans", figtree.variable)}>
      <body className="bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}