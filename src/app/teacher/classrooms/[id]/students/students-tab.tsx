// ===========================================
// Файл: src/app/teacher/classrooms/[id]/students/students-tab.tsx
// Описание: Вкладка учеников — список, приглашение, удаление ученика, удаление класса.
// ===========================================

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserBadge } from "@/components/shared/user-badge";

export function StudentsTab({ classroomId, enrollments, onUpdate }: { classroomId: string; enrollments: any[]; onUpdate?: () => void }) {
  const router = useRouter();
  const [sq, setSq] = useState("");
  const [sr, setSr] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const handleSearch = async (q: string) => {
    setSq(q);
    if (q.length < 2) { setSr([]); return; }
    setSearching(true);
    const r = await fetch(`/api/users?role=STUDENT&q=${encodeURIComponent(q)}`);
    const u = await r.json();
    const ids = new Set(enrollments.map(e => e.student?.id));
    setSr(Array.isArray(u) ? u.filter((x: any) => !ids.has(x.id)) : []);
    setSearching(false);
  };

  const handleInvite = async (uid: string) => {
    if (busy) return;
    setBusy(true);
    await fetch("/api/invitations", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: uid, classroomId, type: "TEACHER_INVITES" }),
    });
    setSent(p => new Set(p).add(uid));
    setBusy(false);
  };

  const removeStudent = async (enrollmentId: string, studentName: string) => {
    if (busy) return;
    if (!confirm(`Удалить ${studentName} из класса?`)) return;
    setBusy(true);
    await fetch(`/api/classrooms/${classroomId}/enrollments`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrollmentId }),
    });
    setBusy(false);
    if (onUpdate) onUpdate();
    else window.location.reload();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Список учеников</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="cursor-pointer">Пригласить</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Пригласить ученика</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Поиск по имени или email..." value={sq} onChange={e => handleSearch(e.target.value)} />
              <div className="max-h-64 overflow-y-auto space-y-2">
                {searching && <p className="text-sm text-muted-foreground">Поиск...</p>}
                {sr.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between p-2 rounded border border-border">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.image} />
                        <AvatarFallback className="text-xs">{u.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    {sent.has(u.id)
                      ? <Badge variant="secondary" className="text-xs">Отправлено</Badge>
                      : <Button size="sm" variant="outline" onClick={() => handleInvite(u.id)} disabled={busy} className="cursor-pointer">Пригласить</Button>
                    }
                  </div>
                ))}
                {sq.length >= 2 && !searching && sr.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Не найдены</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {enrollments.length === 0 ? (
        <div className="text-center py-12"><p className="text-muted-foreground">Нет учеников</p></div>
      ) : (
        <div className="space-y-2">
          {enrollments.map((e: any) => (
            <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <UserBadge user={e.student || {}} role="student" size="md" showStatus showRole />
              <button
                onClick={() => removeStudent(e.id, e.student?.name || "ученика")}
                disabled={busy}
                className="text-muted-foreground hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50 p-1"
                title="Удалить из класса"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
