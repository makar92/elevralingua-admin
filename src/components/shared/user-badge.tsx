// ===========================================
// Файл: src/components/shared/user-badge.tsx
// Описание: Виджет пользователя — вариант 13.
//   Цветная рамка аватара + имя + роль текстом + индикатор онлайна.
//   Зелёный = учитель, синий = ученик.
// ===========================================

"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserBadgeProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    lastSeenAt?: string | null;
  };
  role?: "teacher" | "student";
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
  showRole?: boolean;
  className?: string;
}

function formatLastSeen(dateStr: string | null | undefined): { online: boolean; label: string } {
  if (!dateStr) return { online: false, label: "" };
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);

  if (minutes < 5) return { online: true, label: "онлайн" };
  if (minutes < 60) return { online: false, label: `${minutes} мин назад` };
  if (hours < 24) return { online: false, label: `${hours} ч назад` };
  if (days < 7) return { online: false, label: `${days} д назад` };
  return { online: false, label: `${weeks} нед назад` };
}

const sizeConfig = {
  sm: { outer: 32, inner: 26, border: 2, fallbackText: "text-[10px]", nameText: "text-sm", roleText: "text-[10px]", statusDot: "w-2 h-2", gap: "gap-2" },
  md: { outer: 38, inner: 30, border: 2.5, fallbackText: "text-xs", nameText: "text-sm", roleText: "text-[11px]", statusDot: "w-2.5 h-2.5", gap: "gap-2.5" },
  lg: { outer: 48, inner: 40, border: 3, fallbackText: "text-sm", nameText: "text-base", roleText: "text-xs", statusDot: "w-3 h-3", gap: "gap-3" },
};

const roleConfig = {
  teacher: {
    borderColor: "#0F6E56",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    label: "учитель",
  },
  student: {
    borderColor: "#185FA5",
    bg: "bg-blue-100",
    text: "text-blue-700",
    label: "ученик",
  },
};

export function UserBadge({
  user,
  role = "student",
  size = "md",
  showStatus = true,
  showRole = true,
  className = "",
}: UserBadgeProps) {
  const s = sizeConfig[size];
  const r = roleConfig[role];
  const initials = user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
  const { online, label: statusLabel } = formatLastSeen(user.lastSeenAt);

  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      {/* Аватар с цветной рамкой + индикатор онлайна */}
      <div className="relative flex-shrink-0">
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: s.outer,
            height: s.outer,
            padding: s.border,
            border: `${s.border}px solid ${r.borderColor}`,
          }}
        >
          <Avatar style={{ width: s.inner, height: s.inner }}>
            <AvatarImage src={user.image || undefined} />
            <AvatarFallback className={`${s.fallbackText} ${r.bg} ${r.text} font-medium`}>
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
        {showStatus && (
          <span
            className={`absolute -bottom-0.5 -right-0.5 ${s.statusDot} rounded-full border-2 border-card ${
              online ? "bg-emerald-500" : "bg-gray-400"
            }`}
            title={online ? "Онлайн" : statusLabel || "Не в сети"}
          />
        )}
      </div>

      {/* Имя + роль + статус */}
      <div className="min-w-0 flex-1">
        <p className={`${s.nameText} font-medium text-foreground truncate leading-tight`}>
          {user.name || "Без имени"}
        </p>
        <div className="flex items-center gap-1.5">
          {showRole && (
            <span className={`${s.roleText} font-medium`} style={{ color: r.borderColor }}>
              {r.label}
            </span>
          )}
          {showStatus && showRole && statusLabel && !online && (
            <span className={`${s.roleText} text-muted-foreground`}>· {statusLabel}</span>
          )}
          {showStatus && !showRole && statusLabel && !online && (
            <span className={`${s.roleText} text-muted-foreground`}>{statusLabel}</span>
          )}
          {showStatus && online && (
            <span className={`${s.roleText} text-emerald-600`}>
              {showRole ? "· онлайн" : "онлайн"}
            </span>
          )}
          {showStatus && !statusLabel && !online && (
            <span className={`${s.roleText} text-muted-foreground`}>
              {showRole ? "· не в сети" : "не в сети"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
