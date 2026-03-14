// ===========================================
// Файл: src/app/login/page.tsx
// Описание: Страница входа. Все цвета для тёмной темы.
// ===========================================

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) { setError("Неверный email или пароль"); }
    else { router.push("/dashboard"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            {/* Логотип — голубой акцент (ок для логотипа) */}
            <CardTitle className="text-2xl text-primary">LinguaMethod</CardTitle>
            {/* Подпись — серый */}
            <CardDescription>Панель управления контентом</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@linguamethod.com" required />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Пароль</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {error && (
                <div className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">{error}</div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Вход..." : "Войти"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
