// ===========================================
// Файл: src/app/teacher/classrooms/[id]/students/students-tab.tsx
// Описание: Таб списка students с модалкой приглашения.
// ===========================================

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function StudentsTab({ classroomId, enrollments }: { classroomId: string; enrollments: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const res = await fetch(`/api/users?role=STUDENT&q=${encodeURIComponent(q)}`);
    const users = await res.json();
    const enrolledIds = new Set(enrollments.map(e => e.student?.id));
    setSearchResults(Array.isArray(users) ? users.filter((u: any) => !enrolledIds.has(u.id)) : []);
    setSearching(false);
  };

  const handleInvite = async (userId: string) => {
    await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: userId, classroomId, type: "TEACHER_INVITES" }),
    });
    setSentIds(prev => new Set(prev).add(userId));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Students ({enrollments.length})</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">Invite Student</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Student</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
              />
              <div className="max-h-64 overflow-y-auto space-y-2">
                {searching && <p className="text-sm text-muted-foreground">Searching...</p>}
                {searchResults.map((u: any) => (
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
                    {sentIds.has(u.id) ? (
                      <Badge variant="secondary" className="text-xs">Sent</Badge>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleInvite(u.id)}>Invite</Button>
                    )}
                  </div>
                ))}
                {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No students found</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {enrollments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No students yet. Invite your first!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {enrollments.map((e: any) => (
            <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
              <Avatar className="h-9 w-9">
                <AvatarImage src={e.student?.image} />
                <AvatarFallback className="text-xs bg-blue-100 text-blue-700">{e.student?.name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{e.student?.name}</p>
                <p className="text-xs text-muted-foreground">{e.student?.email}</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {e.status === "ACTIVE" ? "Active" : "Inactive"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Joined {new Date(e.joinedAt).toLocaleDateString("en-US")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
