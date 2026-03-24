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
  sm: { avatar: "h-6 w-6", name: "text-sm", role: "text-[10px]", gap: "gap-2", dot: "w-2 h-2" },
  md: { avatar: "h-8 w-8", name: "text-sm", role: "text-[11px]", gap: "gap-2.5", dot: "w-2.5 h-2.5" },
  lg: { avatar: "h-10 w-10", name: "text-base", role: "text-xs", gap: "gap-3", dot: "w-3 h-3" },
};
const roles = {
  teacher: { border: "border-emerald-500", bg: "bg-emerald-100", text: "text-emerald-700", label: "учитель" },
  student: { border: "border-blue-500", bg: "bg-blue-100", text: "text-blue-700", label: "ученик" },
};

export function UserBadge({ user, role = "student", size = "md", showStatus = true, showRole = true, className = "" }: UserBadgeProps) {
  const s = sizes[size];
  const r = roles[role];
  const initials = user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
  const { online } = formatLastSeen(user.lastSeenAt);

  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      <div className="relative flex-shrink-0">
        <Avatar className={`${s.avatar} border-2 ${r.border}`}>
          <AvatarImage src={user.image || undefined} />
          <AvatarFallback className={`${r.bg} ${r.text} font-medium text-xs`}>{initials}</AvatarFallback>
        </Avatar>
        {showStatus && online && (
          <span className={`absolute -bottom-0.5 -right-0.5 ${s.dot} rounded-full border-2 border-card bg-emerald-500`} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`${s.name} font-medium text-foreground truncate leading-tight`}>{user.name || "Без имени"}</p>
        {showRole && <p className={`${s.role} ${r.text} font-medium leading-tight`}>{r.label}</p>}
      </div>
    </div>
  );
}
