// ===========================================
// Файл: src/app/teacher/classrooms/[id]/homework/[hwId]/page.tsx
// Описание: Проверка домашнего задания учителем.
// ===========================================

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const statusColors: Record<string, string> = {
  ASSIGNED: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  HAS_QUESTIONS: "bg-amber-100 text-amber-700",
  REVIEWED: "bg-purple-100 text-purple-700",
};

export default function ReviewHomework() {
  const { id, hwId } = useParams();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Record<string, { score: string; comment: string }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/homework/${hwId}/submissions`).then(r => r.json()).then(d => {
      setSubmissions(d);
      setLoading(false);
    });
  }, [hwId]);

  const handleReviewAnswer = async (answerId: string, score: number, comment: string) => {
    await fetch(`/api/answers`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: answerId, score, teacherComment: comment }),
    });
  };

  const markReviewed = async (hsId: string) => {
    await fetch(`/api/homework-student/${hsId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REVIEWED" }),
    });
    setSubmissions(prev => prev.map(s => s.id === hsId ? { ...s, status: "REVIEWED" } : s));
  };

  if (loading) return <div className="p-6 text-muted-foreground">Загрузка...</div>;

  const hwTitle = submissions[0]?.homework?.title || "Homework";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">{hwTitle}</h1>
      <p className="text-sm text-muted-foreground mb-6">Проверка работ учеников</p>

      <div className="space-y-3">
        {submissions.map((sub: any) => (
          <div key={sub.id} className="border border-border rounded-lg">
            <button onClick={() => setExpanded(expanded === sub.id ? null : sub.id)}
              className="w-full text-left p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={sub.student?.image} />
                  <AvatarFallback className="text-xs">{sub.student?.name?.[0]}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{sub.student?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${statusColors[sub.status] || ""}`}>
                  {sub.status.replace("_", " ")}
                </span>
                {sub.note && <Badge variant="outline" className="text-xs text-amber-600">Есть вопрос</Badge>}
              </div>
            </button>

            {expanded === sub.id && (
              <div className="px-4 pb-4 border-t border-border space-y-4">
                {sub.note && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mt-3">
                    <p className="text-xs font-semibold text-amber-700 mb-1">Вопрос ученика:</p>
                    <p className="text-sm text-amber-900">{sub.note}</p>
                  </div>
                )}

                {/* Ответы на упражнения */}
                {sub.answers?.map((ans: any) => (
                  <div key={ans.id} className="p-3 bg-accent/30 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{ans.exercise?.title || "Упражнение"}</span>
                      <Badge variant="outline" className="text-xs">{ans.exercise?.exerciseType}</Badge>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Ответ: </span>
                      <span className="text-foreground">
                        {typeof ans.answersJson === "string" ? ans.answersJson : JSON.stringify(ans.answersJson)}
                      </span>
                    </div>
                    {ans.status === "AUTO_GRADED" && (
                      <p className="text-xs text-muted-foreground">Автопроверка: {ans.score}/10</p>
                    )}
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Балл:</span>
                        <Input type="number" min="0" max="10" className="w-16 h-7 text-xs"
                          defaultValue={ans.score || ""}
                          onChange={e => {
                            const r = reviews[ans.id] || { score: "", comment: "" };
                            setReviews({ ...reviews, [ans.id]: { ...r, score: e.target.value } });
                          }}
                        />
                        <span className="text-xs text-muted-foreground">/10</span>
                      </div>
                      <Input className="flex-1 h-7 text-xs" placeholder="Комментарий..."
                        defaultValue={ans.teacherComment || ""}
                        onChange={e => {
                          const r = reviews[ans.id] || { score: "", comment: "" };
                          setReviews({ ...reviews, [ans.id]: { ...r, comment: e.target.value } });
                        }}
                      />
                    </div>
                  </div>
                ))}

                {sub.status !== "REVIEWED" && (
                  <Button size="sm" onClick={() => markReviewed(sub.id)}>
                    Отметить проверенным
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
