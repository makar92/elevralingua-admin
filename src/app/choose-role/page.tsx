// ===========================================
// Файл: src/app/choose-role/page.tsx
// Описание: Выбор роли после первого входа через Google.
//   Если роль уже выбрана — редирект в кабинет.
// ===========================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ChooseRolePage() {
  const router = useRouter();
  const [step, setStep] = useState<"role" | "teacher-details">("role");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("");
  const [bio, setBio] = useState("");

  const handleChooseRole = async (role: "TEACHER" | "STUDENT") => {
    if (role === "TEACHER") {
      setStep("teacher-details");
      return;
    }
    // Студент — сразу сохраняем
    setLoading(true);
    await fetch("/api/auth/set-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "STUDENT" }),
    });
    router.push("/student");
  };

  const handleTeacherSubmit = async () => {
    setLoading(true);
    await fetch("/api/auth/set-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "TEACHER", language, bio }),
    });
    router.push("/teacher");
  };

  if (step === "teacher-details") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md px-4">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Профиль учителя</CardTitle>
              <CardDescription>Расскажите о вашем преподавании</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Язык преподавания</Label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Выберите язык...</option>
                  <option value="zh">Mandarin Chinese</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="pt">Portuguese</option>
                  <option value="it">Italian</option>
                  <option value="ar">Arabic</option>
                  <option value="ru">Russian</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Краткое описание (необязательно)</Label>
                <Input
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. HSK certified teacher with 5 years experience"
                />
              </div>
              <Button
                onClick={handleTeacherSubmit}
                className="w-full"
                disabled={!language || loading}
              >
                {loading ? "Настройка..." : "Продолжить как учитель"}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setStep("role")}>
                Назад
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-lg px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Добро пожаловать в LinguaMethod!</CardTitle>
            <CardDescription>Как вы будете использовать платформу?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleChooseRole("TEACHER")}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">
                  🎓
                </div>
                <span className="font-medium text-foreground">Я учитель</span>
                <span className="text-xs text-muted-foreground text-center">Создавайте классы, управляйте учениками, назначайте задания</span>
              </button>
              <button
                onClick={() => handleChooseRole("STUDENT")}
                disabled={loading}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                  📖
                </div>
                <span className="font-medium text-foreground">Я ученик</span>
                <span className="text-xs text-muted-foreground text-center">Присоединяйтесь к классам, изучайте учебники, выполняйте упражнения</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
