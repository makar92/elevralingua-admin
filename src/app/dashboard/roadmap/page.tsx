// ===========================================
// Файл: src/app/dashboard/roadmap/page.tsx
// Описание: Product Roadmap — ElevraLingua.
// ===========================================

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const phases = [
  {
    phase: "Phase 1",
    title: "Content Engine",
    subtitle: "Foundation — full-featured course builder",
    status: "done" as const,
    icon: "🏗️",
    metrics: "9 block types · 10 exercise types · 3 units · 8 lessons · 30+ exercises",
    features: [
      { name: "Course Builder", desc: "Hierarchical editor Course → Unit → Lesson → Section → Block with visual navigation tree", done: true },
      { name: "9 Content Block Types", desc: "Text (WYSIWYG), images, audio, YouTube, vocab cards, dialogues, dividers, spacers, HTML embeds", done: true },
      { name: "10 Exercise Types", desc: "4 auto-graded (matching, multiple choice, tones, word order) + 6 teacher-reviewed (translation, dictation, etc.)", done: true },
      { name: "Workbook & Exercise Bank", desc: "Exercises are split between the workbook (default) and exercise bank (reserve) for differentiation", done: true },
      { name: "Preview Mode", desc: "Preview materials from student and teacher perspective before publishing", done: true },
      { name: "Auth & Infrastructure", desc: "NextAuth, file uploads to Vercel Blob, deployed on Vercel + Neon PostgreSQL", done: true },
    ],
  },
  {
    phase: "Phase 2",
    title: "Classroom System",
    subtitle: "Teacher and student portals — interactive real-time learning",
    status: "done" as const,
    icon: "🎓",
    metrics: "3 portals · real-time grading · class journal · invitation system",
    features: [
      { name: "Teacher Portal", desc: "Class management, student invitations, course catalog, role-based navigation", done: true },
      { name: "Gradebook", desc: "Lesson calendar with attendance, grades, covered topics, and teacher notes", done: true },
      { name: "Interactive Textbook", desc: "Section visibility control, assign sections as class/homework, progress tracking", done: true },
      { name: "Workbook + Exercise Bank in Classroom", desc: "Assign exercises to all or individually, differentiate with exercise bank", done: true },
      { name: "Student Portal", desc: "Dashboard, textbook (open sections), workbook (assigned exercises), grades (grades/attendance)", done: true },
      { name: "Invitation System", desc: "Teacher invites student or student requests to join. Accept/decline requests", done: true },
    ],
  },
  {
    phase: "Phase 3",
    title: "UX Polish & Analytics",
    subtitle: "Professional UI, progress tracking, teacher tools",
    status: "next" as const,
    icon: "📊",
    metrics: "Branding · responsive UI · progress dashboards · teacher reports",
    features: [
      { name: "Brand & Design System", desc: "Logo, color palette, icon library, consistent component style across all portals", done: true },
      { name: "Student Progress Analytics", desc: "Completion rate, exercise accuracy, time metrics by student and class", done: false },
      { name: "Teacher Reports", desc: "Exportable progress reports, homework completion stats, attendance summaries", done: false },
      { name: "Responsive Layout", desc: "Full tablet and mobile support for student textbook and workbook", done: false },
    ],
  },
  {
    phase: "Phase 4",
    title: "Team Collaboration & Media",
    subtitle: "Multi-author collaboration and AI content creation tools",
    status: "planned" as const,
    icon: "🤖",
    metrics: "Role-based access · review workflow · media library · AI generation",
    features: [
      { name: "Roles & Permissions", desc: "Administrator, Linguist, Reviewer, Translator — each with granular permissions", done: false },
      { name: "Review Workflow", desc: "Pipeline: Draft → Review → Published with comments and version history", done: false },
      { name: "Media Library", desc: "Centralized storage for images, audio, video. Tags, search, reuse across courses", done: false },
      { name: "AI Content Tools", desc: "TTS voiceover, AI image generation, auto-generate exercises from vocab lists", done: false },
    ],
  },
  {
    phase: "Phase 5",
    title: "Monetization",
    subtitle: "Subscription B2B SaaS model — teachers pay, students learn for free",
    status: "planned" as const,
    icon: "💰",
    metrics: "Stripe integration · 3 plans · free trial · revenue analytics",
    features: [
      { name: "Stripe Integration", desc: "Monthly and annual subscriptions for teachers with secure payment processing", done: false },
      { name: "Pricing Plans", desc: "Free (1 class, basic course), Pro (unlimited, all courses), School (multi-teacher license)", done: false },
      { name: "Free Trial", desc: "14-day full access for new teachers to all materials and features", done: false },
      { name: "Revenue Dashboard", desc: "Subscription metrics, churn analysis, MRR tracking for business planning", done: false },
    ],
  },
  {
    phase: "Phase 6",
    title: "Scaling & Ecosystem",
    subtitle: "Mobile apps, B2B for schools, marketplace, new languages",
    status: "planned" as const,
    icon: "🌏",
    metrics: "iOS/Android · school licenses · new languages · LMS integrations",
    features: [
      { name: "Mobile Apps", desc: "Native iOS/Android (React Native). Gamification: streaks, points, achievements", done: false },
      { name: "B2B for Language Schools", desc: "Multi-teacher licenses, school director dashboard, group discounts", done: false },
      { name: "LMS Integrations", desc: "Connect to Canvas, Moodle, Google Classroom via LTI standard", done: false },
      { name: "New Languages", desc: "Expand to the most in-demand languages in the U.S.: Spanish, French, German, Japanese, Korean, and more — based on demand", done: false },
    ],
  },
];

const statusConfig = {
  done:    { label: "Done",      bg: "bg-emerald-500", text: "text-white",              ring: "ring-emerald-500/20", cardBorder: "border-emerald-200", barColor: "bg-emerald-500" },
  next:    { label: "In Progress",    bg: "bg-primary",     text: "text-primary-foreground",  ring: "ring-primary/20",     cardBorder: "border-primary/30",  barColor: "bg-primary" },
  planned: { label: "Planned", bg: "bg-muted",       text: "text-muted-foreground",    ring: "ring-border",         cardBorder: "border-dashed",      barColor: "bg-border" },
};

export default function RoadmapPage() {
  return (
    <div className="h-full overflow-auto pr-3">
      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Product Roadmap</h1>
            <p className="text-base text-muted-foreground max-w-2xl">
              ElevraLingua — a B2B SaaS platform for foreign language teachers.
              Authored learning materials, interactive exercises, and classroom management tools.
              First product: Chinese (Mandarin) for English speakers.
            </p>
          </div>

        </div>
        {/* Прогресс-бар */}
        <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.round((phases.reduce((a, p) => a + p.features.filter(f => f.done).length, 0) / phases.reduce((a, p) => a + p.features.length, 0)) * 100)}%` }} />
        </div>
        {/* Легенда фаз */}
        <div className="flex gap-4 mt-4">
          {phases.map((p) => {
            const cfg = statusConfig[p.status];
            return (
              <div key={p.phase} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${cfg.barColor}`} />
                <span className="text-xs text-muted-foreground">{p.phase}: {p.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {phases.map((phase, idx) => {
          const cfg = statusConfig[phase.status];
          const phaseDone = phase.features.filter(f => f.done).length;
          const phaseTotal = phase.features.length;
          const phaseProgress = phaseTotal > 0 ? Math.round((phaseDone / phaseTotal) * 100) : 0;

          return (
            <div key={phase.phase} className="relative">
              {/* Вертикальная линия */}
              {idx < phases.length - 1 && (
                <div className="absolute left-5 top-14 bottom-[-32px] w-px bg-border" />
              )}
              <div className="flex gap-5">
                {/* Нода таймлайна */}
                <div className="flex-shrink-0 pt-1 z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ring-4 ${cfg.ring} ${phase.status === "done" ? "bg-emerald-500/10" : phase.status === "next" ? "bg-primary/10" : "bg-muted"}`}>
                    {phase.status === "done" ? "✓" : phase.icon}
                  </div>
                </div>

                {/* Карточка фазы */}
                <div className="flex-1 min-w-0">
                  <Card className={cfg.cardBorder}>
                    <CardContent className="py-5">
                      {/* Заголовок */}
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{phase.phase}</span>
                        <Badge className={`${cfg.bg} ${cfg.text} hover:${cfg.bg}`}>{cfg.label}</Badge>
                      </div>
                      <h2 className="text-xl font-bold text-foreground mb-0.5">{phase.title}</h2>
                      <p className="text-sm text-muted-foreground mb-4">{phase.subtitle}</p>

                      {/* Метрики + прогресс */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-xs text-muted-foreground bg-muted rounded-full px-3 py-1">{phase.metrics}</div>
                        {phaseTotal > 0 && (
                          <div className="flex items-center gap-2 ml-auto">
                            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${cfg.barColor}`} style={{ width: `${phaseProgress}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{phaseDone}/{phaseTotal}</span>
                          </div>
                        )}
                      </div>

                      {/* Сетка функций */}
                      <div className="grid grid-cols-2 gap-2.5">
                        {phase.features.map((f) => (
                          <div key={f.name} className={`flex items-start gap-2.5 p-3 rounded-lg ${f.done ? "bg-emerald-500/5" : "bg-muted/50"}`}>
                            <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs ${f.done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
                              {f.done ? "✓" : "○"}
                            </span>
                            <div className="min-w-0">
                              <p className={`text-sm font-medium leading-tight ${f.done ? "text-foreground" : "text-foreground/70"}`}>{f.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{f.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Целевой рынок */}
      <Card className="mt-10 mb-8">
        <CardContent className="py-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🎯</span>
            <h3 className="text-base font-semibold text-foreground">Target Market</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Foreign language teachers: private tutors and language schools.
            First product — Chinese (Mandarin) course for English speakers.
            The platform architecture supports any language pair, enabling rapid expansion to Japanese, Korean, Arabic, and other languages.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
