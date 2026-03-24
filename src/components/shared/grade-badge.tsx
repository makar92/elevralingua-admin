// ===========================================
// Файл: src/components/shared/grade-badge.tsx
// Описание: Единый компонент отображения оценки.
//   Буква (A-F) в цветном квадрате.
//   Используется ВЕЗДЕ: журнал, учебник, тетрадь, дашборд, модалки.
// ===========================================

"use client";

const GRADE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-300" },
  B: { bg: "bg-blue-100",    text: "text-blue-800",    border: "border-blue-300" },
  C: { bg: "bg-amber-100",   text: "text-amber-800",   border: "border-amber-300" },
  D: { bg: "bg-orange-100",  text: "text-orange-800",  border: "border-orange-300" },
  F: { bg: "bg-red-100",     text: "text-red-800",     border: "border-red-300" },
};

const SIZES = {
  xs: "w-5 h-5 text-[9px] rounded",
  sm: "w-6 h-6 text-[10px] rounded",
  md: "w-7 h-7 text-xs rounded-md",
  lg: "w-8 h-8 text-sm rounded-md",
};

interface GradeBadgeProps {
  grade: string | null | undefined;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export function GradeBadge({ grade, size = "md", className = "" }: GradeBadgeProps) {
  if (!grade) return null;
  const g = grade.toUpperCase();
  const style = GRADE_STYLES[g] || GRADE_STYLES.F;
  const sizeClass = SIZES[size];

  return (
    <span className={`inline-flex items-center justify-center font-bold border ${style.bg} ${style.text} ${style.border} ${sizeClass} ${className}`}>
      {g}
    </span>
  );
}

// Конвертация процента правильных ответов в буквенную оценку (для автопроверки)
export function percentToGrade(percent: number): string {
  if (percent >= 90) return "A";
  if (percent >= 70) return "B";
  if (percent >= 50) return "C";
  if (percent >= 30) return "D";
  return "F";
}

// Кнопки выбора оценки учителем
interface GradePickerProps {
  value: string | null | undefined;
  onChange: (grade: string) => void;
  size?: "sm" | "md";
}

export function GradePicker({ value, onChange, size = "md" }: GradePickerProps) {
  const grades = ["A", "B", "C", "D", "F"];
  const btnSize = size === "sm" ? "w-7 h-7 text-xs" : "w-8 h-8 text-sm";

  return (
    <div className="flex gap-1">
      {grades.map(g => {
        const style = GRADE_STYLES[g];
        const isSelected = value?.toUpperCase() === g;
        return (
          <button
            key={g}
            onClick={() => onChange(g)}
            className={`${btnSize} rounded-md font-bold border-2 transition-all ${style.bg} ${style.text} ${isSelected ? "ring-2 ring-primary ring-offset-1 " + style.border : "border-transparent opacity-70 hover:opacity-100"}`}
          >
            {g}
          </button>
        );
      })}
    </div>
  );
}
