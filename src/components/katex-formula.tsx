// ===========================================
// Файл: src/components/katex-formula.tsx
// Путь:  linguamethod-admin/src/components/katex-formula.tsx
//
// Описание:
//   Рендерит формулу с помощью KaTeX.
//   Поддерживает LaTeX-синтаксис.
//   Пример: "S + 想 + V + O" или "\frac{a}{b}"
// ===========================================

"use client";

import { useEffect, useRef } from "react";
import katex from "katex";

interface Props {
  formula: string;
  displayMode?: boolean; // true = блочная формула (крупная), false = инлайн
}

export function KatexFormula({ formula, displayMode = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && formula) {
      try {
        katex.render(formula, ref.current, {
          displayMode,
          throwOnError: false,    // Не падать при ошибке в формуле
          trust: true,
          output: "html",
        });
      } catch {
        // Если KaTeX не смог распарсить — показываем как текст
        if (ref.current) ref.current.textContent = formula;
      }
    }
  }, [formula, displayMode]);

  if (!formula) return null;

  return <div ref={ref} className="text-foreground" />;
}
