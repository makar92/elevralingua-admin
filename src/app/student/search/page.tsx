// ===========================================
// Файл: src/app/student/search/page.tsx
// Описание: Поиск классов для вступления.
// ===========================================

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function StudentSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [requestsSent, setRequestsSent] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    if (!query.trim()) return;
    const data = await fetch(`/api/classrooms/search?q=${encodeURIComponent(query)}`).then(r => r.json());
    setResults(data);
    setSearched(true);
  };

  const requestJoin = async (classroomId: string, teacherId: string) => {
    await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverId: teacherId,
        classroomId,
        type: "STUDENT_REQUESTS",
      }),
    });
    setRequestsSent(prev => new Set(prev).add(classroomId));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Найти класс</h1>

      <div className="flex gap-3 mb-6">
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          placeholder="Поиск по названию класса или имени учителя..."
          className="flex-1"
        />
        <Button onClick={handleSearch}>Поиск</Button>
      </div>

      {searched && results.length === 0 && (
        <p className="text-muted-foreground text-center py-12">Классы не найдены</p>
      )}

      <div className="space-y-3">
        {results.map((c: any) => (
          <div key={c.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={c.teacher?.image} />
                <AvatarFallback className="bg-emerald-100 text-emerald-700">{c.teacher?.name?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{c.name}</p>
                <p className="text-sm text-muted-foreground">{c.teacher?.name} · {c.course?.title}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">{c.course?.language}</Badge>
                  <Badge variant="outline" className="text-xs">{c.course?.level}</Badge>
                  <span className="text-xs text-muted-foreground">{c._count?.enrollments || 0} уч.</span>
                </div>
              </div>
            </div>
            {requestsSent.has(c.id) ? (
              <Badge variant="secondary">Заявка отправлена</Badge>
            ) : (
              <Button size="sm" onClick={() => requestJoin(c.id, c.teacher?.id)}>
                Подать заявку
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
