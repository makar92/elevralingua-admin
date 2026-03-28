// ===========================================
// Файл: src/app/choose-role/page.tsx
// Описание: Выбор роли после первого входа через Google.
//   Доступна только для пользователей с ролью PENDING.
//   После выбора роли — редирект на /, где роль читается из БД.
// ===========================================

"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";
import { HugeiconsIcon } from "@hugeicons/react";
import { TeacherIcon, StudentIcon } from "@hugeicons/core-free-icons";

export default function ChooseRolePage() {
  const [step, setStep] = useState<"role" | "teacher-details">("role");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("");
  const [bio, setBio] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleChooseRole = async (role: "TEACHER" | "STUDENT") => {
    if (role === "TEACHER") {
      setStep("teacher-details");
      return;
    }
    setLoading(true);
    await fetch("/api/auth/set-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "STUDENT" }),
    });
    window.location.href = "/";
  };

  const handleTeacherSubmit = async () => {
    setLoading(true);
    await fetch("/api/auth/set-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "TEACHER", language, bio }),
    });
    window.location.href = "/";
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    await fetch("/api/auth/set-role", { method: "DELETE" });
    signOut({ callbackUrl: "/login" });
  };

  if (step === "teacher-details") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="w-full max-w-md px-4">
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Logo height={40} />
              </div>
              <CardTitle className="text-xl">Teacher Profile</CardTitle>
              <CardDescription>Tell us about your teaching</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Teaching Language</Label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select language...</option>
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
                <Label>Brief bio (optional)</Label>
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
                {loading ? "Setting up..." : "Continue as Teacher"}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setStep("role")}>
                Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-lg px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Logo height={40} />
            </div>
            <CardTitle className="text-xl">Welcome to ElevraLingua!</CardTitle>
            <CardDescription>How will you use the platform?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleChooseRole("TEACHER")}
                disabled={loading}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                  <HugeiconsIcon icon={TeacherIcon} size={28} className="text-emerald-700" />
                </div>
                <span className="font-medium text-foreground">I'm a Teacher</span>
                <span className="text-xs text-muted-foreground text-center">Create classes, manage students, assign work</span>
              </button>
              <button
                onClick={() => handleChooseRole("STUDENT")}
                disabled={loading}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50"
              >
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                  <HugeiconsIcon icon={StudentIcon} size={28} className="text-blue-700" />
                </div>
                <span className="font-medium text-foreground">I'm a Student</span>
                <span className="text-xs text-muted-foreground text-center">Join classes, study textbooks, complete exercises</span>
              </button>
            </div>

            {/* Delete account */}
            <div className="pt-2 border-t border-border">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full text-center text-xs text-muted-foreground hover:text-red-500 transition-colors py-1"
                >
                  Delete Account
                </button>
              ) : (
                <div className="text-center space-y-2">
                  <p className="text-xs text-red-600">Are you sure? This action cannot be undone.</p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className="text-xs h-7"
                    >
                      {deleting ? "Deleting..." : "Yes, delete"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="text-xs h-7"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
