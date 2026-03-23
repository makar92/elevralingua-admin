// ===========================================
// Файл: src/app/login/page.tsx
// Описание: Страница входа. Email+пароль для всех ролей, Google OAuth как опция.
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

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      // Редирект на корень — middleware перенаправит по роли
      router.push("/");
      router.refresh();
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/" });
  };

  // Быстрый вход для демо — автоматически отправляет форму
  const quickLogin = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
    setLoading(true);

    const result = await signIn("credentials", { email: demoEmail, password: demoPassword, redirect: false });
    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-primary flex items-center justify-center gap-2">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" className="fill-primary"/><text x="12" y="17" textAnchor="middle" className="fill-primary-foreground" fontSize="14" fontWeight="bold" fontFamily="Arial">L</text></svg>
              LinguaMethod
            </CardTitle>
            <CardDescription>Language teaching platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Email + Password — основной способ */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <div className="text-sm text-red-600 bg-red-500/10 px-3 py-2 rounded-lg">{error}</div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            {/* Google Sign-In — опциональный */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Button
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full h-10 text-sm font-medium gap-3"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              New users can register with Google
            </p>

            {/* Быстрый демо-вход */}
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2.5 text-center">Быстрый демо-вход</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => quickLogin("ksenia@linguamethod.com", "admin123")}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  <span className="text-xl">⚙️</span>
                  <span className="text-xs font-medium text-foreground">Админ</span>
                </button>
                <button
                  onClick={() => quickLogin("sarah.chen@demo.com", "teacher123")}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border bg-card hover:border-emerald-400/40 hover:bg-emerald-50 transition-all"
                >
                  <span className="text-xl">🎓</span>
                  <span className="text-xs font-medium text-emerald-700">Учитель</span>
                </button>
                <button
                  onClick={() => quickLogin("emma.wilson@demo.com", "student123")}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border bg-card hover:border-blue-400/40 hover:bg-blue-50 transition-all"
                >
                  <span className="text-xl">📖</span>
                  <span className="text-xs font-medium text-blue-700">Ученик</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
