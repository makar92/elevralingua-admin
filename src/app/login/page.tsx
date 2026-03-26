// ===========================================
// Файл: src/app/login/page.tsx
// Описание: Страница входа.
//   Демо-аккаунты — основной способ входа.
//   Google OAuth — для желающих тестировать на своём аккаунте.
// ===========================================

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Logo } from "@/components/shared/logo";
import { HugeiconsIcon } from "@hugeicons/react";
import { TeacherIcon, StudentIcon, Settings01Icon } from "@hugeicons/core-free-icons";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const quickLogin = async (email: string, password: string, role: string) => {
    if (loading) return;
    setError("");
    setLoading(role);

    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("Ошибка входа. Попробуйте ещё раз.");
      setLoading(null);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md px-4">
        <Card>
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center mb-2">
              <Logo height={48} />
            </div>
            <CardDescription>B2B SaaS platform for foreign language teachers</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* === Демо-вход === */}
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5">
              <p className="text-sm font-semibold text-foreground text-center mb-1">
                Ознакомьтесь с платформой
              </p>
              <p className="text-xs text-muted-foreground text-center mb-4">
                Готовые аккаунты для ознакомления — войдите в один клик
              </p>

              <div className="space-y-2.5">
                <button
                  onClick={() => quickLogin("sarah.chen@demo.com", "teacher123", "teacher")}
                  disabled={loading !== null}
                  className="w-full flex items-center gap-4 p-3.5 rounded-xl border-2 border-emerald-200 bg-white hover:bg-emerald-50 hover:border-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0"><HugeiconsIcon icon={TeacherIcon} size={24} className="text-emerald-700" /></div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {loading === "teacher" ? "Входим..." : "Войти как Учитель"}
                    </p>
                    <p className="text-xs text-muted-foreground">Sarah Chen — классы, журнал, учебники, упражнения</p>
                  </div>
                  <span className="text-emerald-500 text-lg flex-shrink-0">→</span>
                </button>

                <button
                  onClick={() => quickLogin("emma.wilson@demo.com", "student123", "student")}
                  disabled={loading !== null}
                  className="w-full flex items-center gap-4 p-3.5 rounded-xl border-2 border-blue-200 bg-white hover:bg-blue-50 hover:border-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0"><HugeiconsIcon icon={StudentIcon} size={24} className="text-blue-700" /></div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {loading === "student" ? "Входим..." : "Войти как Ученик"}
                    </p>
                    <p className="text-xs text-muted-foreground">Emma Wilson — учебник, тетрадь, дневник</p>
                  </div>
                  <span className="text-blue-500 text-lg flex-shrink-0">→</span>
                </button>

                <button
                  onClick={() => quickLogin("ksenia@elevralingua.com", "admin123", "admin")}
                  disabled={loading !== null}
                  className="w-full flex items-center gap-4 p-3.5 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0"><HugeiconsIcon icon={Settings01Icon} size={24} className="text-gray-600" /></div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {loading === "admin" ? "Входим..." : "Войти как Админ"}
                    </p>
                    <p className="text-xs text-muted-foreground">Ксения — конструктор курсов, roadmap</p>
                  </div>
                  <span className="text-gray-400 text-lg flex-shrink-0">→</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-500/10 px-3 py-2 rounded-lg text-center">{error}</div>
            )}

            {/* === Google — вторичный способ === */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">или</span>
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
              Войти через Google
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              Новые пользователи могут зарегистрироваться через Google
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
