"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Роли соответствуют enum UserRole из Prisma schema
type UserRole = "SUPER_ADMIN" | "ADMIN" | "LINGUIST" | "TEACHER" | "STUDENT" | "PENDING";

interface UserBadgeProps {
  user: { name?: string | null; email?: string | null; image?: string | null; role?: string | null; lastSeenAt?: string | null };
  role?: UserRole;
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

const roleStyles: Record<UserRole, { border: string; bg: string; text: string; label: string }> = {
  SUPER_ADMIN: { border: "border-purple-500", bg: "bg-purple-100", text: "text-purple-700", label: "admin" },
  ADMIN:       { border: "border-purple-500", bg: "bg-purple-100", text: "text-purple-700", label: "admin" },
  LINGUIST:    { border: "border-amber-500",  bg: "bg-amber-100",  text: "text-amber-700",  label: "linguist" },
  TEACHER:     { border: "border-emerald-500", bg: "bg-emerald-100", text: "text-emerald-700", label: "teacher" },
  STUDENT:     { border: "border-blue-500",   bg: "bg-blue-100",   text: "text-blue-700",   label: "student" },
  PENDING:     { border: "border-gray-400",   bg: "bg-gray-100",   text: "text-gray-600",   label: "new user" },
};

// Определяем роль: из явного пропса, из user.role, или fallback
function resolveRole(propRole?: UserRole, userRole?: string | null): UserRole {
  if (propRole) return propRole;
  if (userRole && userRole in roleStyles) return userRole as UserRole;
  return "STUDENT";
}

export function UserBadge({ user, role: propRole, size = "md", showStatus = true, showRole = true, className = "" }: UserBadgeProps) {
  const s = sizes[size];
  const resolvedRole = resolveRole(propRole, user.role);
  const r = roleStyles[resolvedRole];
  const initials = user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
  const { online } = formatLastSeen(user.lastSeenAt);

  return (
    <div className={`flex items-center text-left ${s.gap} ${className}`}>
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
        <p className={`${s.name} font-medium text-foreground truncate leading-tight`}>{user.name || "No name"}</p>
        {showRole && <p className={`${s.role} ${r.text} font-medium leading-tight`}>{r.label}</p>}
      </div>
    </div>
  );
}
