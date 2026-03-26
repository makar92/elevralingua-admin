// ===========================================
// Файл: src/app/teacher/invitations/page.tsx
// Описание: Приглашения учителя — отправленные и входящие заявки.
// ===========================================

"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function TeacherInvitations() {
  const [sent, setSent] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [tab, setTab] = useState<"sent" | "requests">("requests");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const [s, r] = await Promise.all([
      fetch("/api/invitations?direction=sent&type=TEACHER_INVITES").then(r => r.json()),
      fetch("/api/invitations?direction=received&type=STUDENT_REQUESTS").then(r => r.json()),
    ]);
    setSent(s);
    setRequests(r);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const [busy, setBusy] = useState(false);

  const handleResponse = async (invId: string, status: "ACCEPTED" | "DECLINED") => {
    if (busy) return;
    setBusy(true);
    await fetch(`/api/invitations/${invId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await loadData();
    setBusy(false);
  };

  if (loading) return <div className="p-6 text-muted-foreground">Загрузка...</div>;

  const items = tab === "sent" ? sent : requests;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Приглашения</h1>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("requests")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "requests" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"}`}>
          Заявки учеников {requests.filter(r => r.status === "PENDING").length > 0 && (
            <Badge variant="destructive" className="ml-1 text-xs">{requests.filter(r => r.status === "PENDING").length}</Badge>
          )}
        </button>
        <button onClick={() => setTab("sent")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "sent" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"}`}>
          Отправленные
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          {tab === "sent" ? "Нет отправленных приглашений" : "Нет заявок от учеников"}
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((inv: any) => {
            const person = tab === "sent" ? inv.receiver : inv.sender;
            return (
              <div key={inv.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={person?.image} />
                    <AvatarFallback className="text-xs">{person?.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm text-foreground">{person?.name}</p>
                    <p className="text-xs text-muted-foreground">{inv.classroom?.name} · {inv.classroom?.course?.title}</p>
                    {inv.message && <p className="text-xs text-muted-foreground italic mt-1">{inv.message}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {inv.status === "PENDING" && tab === "requests" ? (
                    <>
                      <Button size="sm" onClick={() => handleResponse(inv.id, "ACCEPTED")} disabled={busy} className="cursor-pointer">Принять</Button>
                      <Button size="sm" variant="outline" onClick={() => handleResponse(inv.id, "DECLINED")} disabled={busy} className="cursor-pointer">Отклонить</Button>
                    </>
                  ) : (
                    <Badge variant={inv.status === "ACCEPTED" ? "secondary" : inv.status === "DECLINED" ? "destructive" : "outline"}
                      className="text-xs">{inv.status}</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
