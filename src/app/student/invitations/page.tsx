// ===========================================
// Файл: src/app/student/invitations/page.tsx
// Описание: Приглашения ученика.
// ===========================================

"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function StudentInvitations() {
  const [incoming, setIncoming] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [tab, setTab] = useState<"incoming" | "sent">("incoming");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const [inc, sent] = await Promise.all([
      fetch("/api/invitations?direction=received&type=TEACHER_INVITES").then(r => r.json()),
      fetch("/api/invitations?direction=sent&type=STUDENT_REQUESTS").then(r => r.json()),
    ]);
    setIncoming(inc);
    setMyRequests(sent);
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

  const items = tab === "incoming" ? incoming : myRequests;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Приглашения</h1>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("incoming")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "incoming" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"}`}>
          От учителей {incoming.filter(i => i.status === "PENDING").length > 0 && (
            <Badge variant="destructive" className="ml-1 text-xs">{incoming.filter(i => i.status === "PENDING").length}</Badge>
          )}
        </button>
        <button onClick={() => setTab("sent")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "sent" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"}`}>
          Мои заявки
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          {tab === "incoming" ? "Нет приглашений от учителей" : "Нет отправленных заявок"}
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((inv: any) => {
            const person = tab === "incoming" ? inv.sender : inv.receiver;
            return (
              <div key={inv.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={person?.image} />
                    <AvatarFallback className="text-xs">{person?.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{person?.name}</p>
                    <p className="text-xs text-muted-foreground">{inv.classroom?.name} · {inv.classroom?.course?.title}</p>
                    {inv.message && <p className="text-xs text-muted-foreground italic mt-1">{inv.message}</p>}
                  </div>
                </div>
                {inv.status === "PENDING" && tab === "incoming" ? (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleResponse(inv.id, "ACCEPTED")} disabled={busy} className="cursor-pointer">Принять</Button>
                    <Button size="sm" variant="outline" onClick={() => handleResponse(inv.id, "DECLINED")} disabled={busy} className="cursor-pointer">Отклонить</Button>
                  </div>
                ) : (
                  <Badge variant={inv.status === "ACCEPTED" ? "secondary" : inv.status === "DECLINED" ? "destructive" : "outline"}
                    className="text-xs">{inv.status}</Badge>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
