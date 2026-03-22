"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserBadgeProps {
  user: { name?: string | null; email?: string | null; image?: string | null; lastSeenAt?: string | null };
  role?: "teacher" | "student";
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
  showRole?: boolean;
  className?: string;
}

function formatLastSeen(d: string | null | undefined): { online: boolean; compact: string } {
  if (!d) return { online: false, compact: "" };
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000), w = Math.floor(days / 7);
  if (m < 5) return { online: true, compact: "" };
  if (m < 60) return { online: false, compact: `${m}m` };
  if (h < 24) return { online: false, compact: `${h}h` };
  if (days < 7) return { online: false, compact: `${days}d` };
  return { online: false, compact: `${w}w` };
}

const sizes = {
  sm: { h: "h-8", avatar: "h-7 w-7", name: "text-sm", role: "text-[10px]", gap: "gap-2", dot: "w-2.5 h-2.5", tag: "text-[8px] px-1 py-px" },
  md: { h: "h-10", avatar: "h-9 w-9", name: "text-sm", role: "text-[11px]", gap: "gap-2.5", dot: "w-3 h-3", tag: "text-[9px] px-1.5 py-px" },
  lg: { h: "h-12", avatar: "h-11 w-11", name: "text-base", role: "text-xs", gap: "gap-3", dot: "w-3.5 h-3.5", tag: "text-[10px] px-1.5 py-0.5" },
};
const roles = {
  teacher: { border: "ring-emerald-600", bg: "bg-emerald-100", text: "text-emerald-700", label: "учитель" },
  student: { border: "ring-blue-600", bg: "bg-blue-100", text: "text-blue-700", label: "ученик" },
};

export function UserBadge({ user, role = "student", size = "md", showStatus = true, showRole = true, className = "" }: UserBadgeProps) {
  const s = sizes[size];
  const r = roles[role];
  const initials = user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
  const { online, compact } = formatLastSeen(user.lastSeenAt);

  return (
    <div className={`flex items-center ${s.gap} ${s.h} ${className}`}>
      <div className="relative flex-shrink-0">
        <Avatar className={`${s.avatar} ring-2 ${r.border}`}>
          <AvatarImage src={user.image || undefined} />
          <AvatarFallback className={`${r.bg} ${r.text} font-medium text-xs`}>{initials}</AvatarFallback>
        </Avatar>
        {showStatus && (online ? (
          <span className={`absolute -bottom-0.5 -right-0.5 ${s.dot} rounded-full border-2 border-card bg-emerald-500`} />
        ) : compact ? (
          <span className={`absolute -bottom-1 -right-3 ${s.tag} rounded-full bg-gray-300 text-gray-700 font-semibold leading-none border border-card whitespace-nowrap`}>{compact}</span>
        ) : null)}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`${s.name} font-medium text-foreground truncate leading-tight`}>{user.name || "Без имени"}</p>
        {showRole && <span className={`${s.role} ${r.text} font-medium`}>{r.label}</span>}
      </div>
    </div>
  );
}
