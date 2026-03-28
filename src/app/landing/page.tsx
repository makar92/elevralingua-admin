// ===========================================
// Файл: src/app/landing/page.tsx
// Описание: Публичная главная страница — лендинг.
// ===========================================

"use client";

import Link from "next/link";
import { Logo } from "@/components/shared/logo";

/* ====== SVG ICONS ====== */
const Icon = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>{children}</svg>
);

function IconTextbook() { return <Icon><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M8 11h4"/></Icon>; }
function IconExercise() { return <Icon><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></Icon>; }
function IconJournal() { return <Icon><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></Icon>; }
function IconClassroom() { return <Icon><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Icon>; }
function IconWorkbook() { return <Icon><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></Icon>; }
function IconDifferentiation() { return <Icon><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-6"/><path d="m21 3-9 9"/><path d="M3 3l9 9"/><path d="M12 12v4"/><circle cx="12" cy="20" r="2"/></Icon>; }
function IconMail() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>; }
function IconCheck() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function IconX() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function IconMonitor() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>; }
function IconUsers2() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }

/* ====== HERO ILLUSTRATION ====== */
function HeroIllustration() {
  return (
    <svg viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-md">
      <circle cx="240" cy="180" r="160" fill="rgba(124, 58, 237, 0.06)" />
      <circle cx="340" cy="120" r="80" fill="rgba(124, 58, 237, 0.04)" />
      <circle cx="140" cy="260" r="60" fill="rgba(124, 58, 237, 0.04)" />
      <rect x="100" y="60" width="280" height="190" rx="12" fill="white" stroke="#7c3aed" strokeWidth="2"/>
      <rect x="100" y="60" width="280" height="32" rx="12" fill="#7c3aed"/>
      <rect x="100" y="80" width="280" height="12" fill="#7c3aed"/>
      <circle cx="118" cy="76" r="4" fill="rgba(124, 58, 237, 0.5)"/>
      <circle cx="132" cy="76" r="4" fill="rgba(124, 58, 237, 0.5)"/>
      <circle cx="146" cy="76" r="4" fill="rgba(124, 58, 237, 0.5)"/>
      <rect x="102" y="94" width="70" height="154" fill="rgba(124, 58, 237, 0.08)"/>
      <rect x="110" y="106" width="50" height="6" rx="3" fill="rgba(124, 58, 237, 0.3)"/>
      <rect x="110" y="120" width="40" height="5" rx="2.5" fill="rgba(124, 58, 237, 0.15)"/>
      <rect x="110" y="132" width="45" height="5" rx="2.5" fill="rgba(124, 58, 237, 0.15)"/>
      <rect x="110" y="144" width="35" height="5" rx="2.5" fill="rgba(124, 58, 237, 0.15)"/>
      <rect x="110" y="160" width="50" height="6" rx="3" fill="rgba(124, 58, 237, 0.3)"/>
      <rect x="110" y="174" width="40" height="5" rx="2.5" fill="rgba(124, 58, 237, 0.15)"/>
      <rect x="110" y="186" width="45" height="5" rx="2.5" fill="rgba(124, 58, 237, 0.15)"/>
      <rect x="184" y="102" width="184" height="56" rx="8" fill="rgba(124, 58, 237, 0.06)" stroke="rgba(124, 58, 237, 0.2)" strokeWidth="1"/>
      <text x="200" y="127" fontSize="22" fontWeight="bold" fill="#7c3aed">你好</text>
      <text x="240" y="127" fontSize="11" fill="rgba(124, 58, 237, 0.7)">nǐ hǎo</text>
      <text x="200" y="147" fontSize="11" fill="rgba(26, 22, 37, 0.6)">hello</text>
      <rect x="184" y="168" width="184" height="72" rx="8" fill="white" stroke="rgba(124, 58, 237, 0.2)" strokeWidth="1"/>
      <text x="200" y="187" fontSize="9" fill="rgba(124, 58, 237, 0.7)" fontWeight="600">MATCHING</text>
      <rect x="196" y="196" width="60" height="16" rx="4" fill="rgba(124, 58, 237, 0.1)"/>
      <text x="207" y="208" fontSize="9" fill="rgba(26, 22, 37, 0.7)">谢谢</text>
      <rect x="196" y="218" width="60" height="16" rx="4" fill="rgba(124, 58, 237, 0.1)"/>
      <text x="207" y="230" fontSize="9" fill="rgba(26, 22, 37, 0.7)">再见</text>
      <rect x="290" y="196" width="66" height="16" rx="4" fill="rgba(124, 58, 237, 0.15)"/>
      <text x="299" y="208" fontSize="9" fill="#7c3aed">thank you</text>
      <rect x="290" y="218" width="66" height="16" rx="4" fill="rgba(124, 58, 237, 0.15)"/>
      <text x="303" y="230" fontSize="9" fill="#7c3aed">goodbye</text>
      <line x1="256" y1="204" x2="290" y2="204" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="4 2"/>
      <path d="M80 250 L100 250 L110 270 L370 270 L380 250 L400 250 L390 280 L90 280 Z" fill="#d4d0da" stroke="#b5a8c4" strokeWidth="1"/>
      <circle cx="420" cy="100" r="20" fill="rgba(34, 197, 94, 0.15)"/>
      <text x="412" y="106" fontSize="16">✓</text>
      <circle cx="60" cy="140" r="16" fill="rgba(59, 130, 246, 0.15)"/>
      <text x="53" y="146" fontSize="14">A</text>
      <rect x="400" y="200" width="50" height="28" rx="6" fill="rgba(234, 179, 8, 0.2)"/>
      <text x="410" y="218" fontSize="10" fill="#a67c2e">HSK 1</text>
    </svg>
  );
}

/* ====== DATA ====== */
const features = [
  { icon: <IconTextbook />, title: "Interactive Textbook", desc: "Vocab cards, dialogues, audio, video — 9 content types" },
  { icon: <IconExercise />, title: "10 Exercise Types", desc: "Auto-graded and teacher-reviewed activities" },
  { icon: <IconJournal />, title: "Gradebook", desc: "Attendance, grades, topics, and notes" },
  { icon: <IconClassroom />, title: "Classroom System", desc: "Invitations, progress tracking, assignments" },
  { icon: <IconWorkbook />, title: "Workbook + Exercise Bank", desc: "Core and supplemental exercises" },
  { icon: <IconDifferentiation />, title: "Differentiated Instruction", desc: "Assign materials individually or to the whole class" },
];

const comparison = [
  { before: "LMS built for tracking, not teaching", after: "Designed for use during the lesson" },
  { before: "Content? Build it yourself", after: "Ready-made interactive authored materials" },
  { before: "No support for tones, transcriptions, or characters", after: "Built for language-specific needs" },
  { before: "Exercises are just quizzes", after: "10 activity types: from matching to dictation" },
  { before: "Students get PDFs or links", after: "Interactive textbook and workbook" },
];

const languages = [
  { flag: "🇨🇳", name: "Chinese (Mandarin)", active: true },
  { flag: "🇪🇸", name: "Spanish", active: false },
  { flag: "🇫🇷", name: "French", active: false },
  { flag: "🇩🇪", name: "German", active: false },
  { flag: "🇯🇵", name: "Japanese", active: false },
  { flag: "🇰🇷", name: "Korean", active: false },
];

/* ====== PAGE ====== */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo height={36} showSlogan={false} />
          <Link href="/login" className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
            Sign In
          </Link>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(124, 58, 237, 0.08) 0%, transparent 70%)" }} />
          <div className="absolute top-20 -left-20 w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                B2B SaaS Platform
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-5">
                Language teaching{" "}
                <span className="relative">
                  <span className="text-primary">reimagined</span>
                  <svg className="absolute -bottom-1 left-0 w-full" height="8" viewBox="0 0 200 8" preserveAspectRatio="none">
                    <path d="M0 7 Q50 0 100 5 Q150 0 200 7" stroke="rgba(124, 58, 237, 0.3)" strokeWidth="3" fill="none"/>
                  </svg>
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg mb-3 leading-relaxed">
                An LMS platform with ready-made authored materials for foreign language teachers.
              </p>
              {/* Формат обучения — схематично */}
              <div className="flex items-center gap-5 mb-8 justify-center lg:justify-start">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IconUsers2 />
                  <span className="text-sm">In-Person</span>
                </div>
                <div className="w-px h-5 bg-border" />
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IconMonitor />
                  <span className="text-sm">Online</span>
                </div>
              </div>
              <Link href="/login" className="inline-block px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                Get Started
              </Link>
            </div>
            <div className="flex-1 flex justify-center">
              <HeroIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* ===== ЧЕМ МЫ ЛУЧШЕ ДРУГИХ ===== */}
      <section className="py-20 bg-card border-y border-border">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-10">How We Compare</h2>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 px-4">
              <p className="text-xs font-bold text-red-500/70 uppercase tracking-wider">Other Platforms</p>
              <p className="text-xs font-bold text-emerald-600/70 uppercase tracking-wider">ElevraLingua</p>
            </div>
            {comparison.map((item, i) => (
              <div key={i} className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
                  <span className="flex-shrink-0 text-red-400"><IconX /></span>
                  <span className="text-sm text-foreground">{item.before}</span>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <span className="flex-shrink-0 text-emerald-500"><IconCheck /></span>
                  <span className="text-sm text-foreground">{item.after}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ВОЗМОЖНОСТИ ===== */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Platform Features</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="group p-5 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ЯЗЫКИ — ROADMAP ===== */}
      <section className="py-20 bg-card border-y border-border">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Supported Languages</h2>
          <p className="text-center text-muted-foreground mb-12">Target market — foreign language teachers in the U.S.</p>

          {/* Roadmap горизонтальный */}
          <div className="relative flex items-center justify-between max-w-3xl mx-auto px-4">
            {/* Линия */}
            <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-border -translate-y-1/2 z-0" />
            <div className="absolute top-1/2 left-8 h-0.5 bg-primary -translate-y-1/2 z-0" style={{ width: `${100 / languages.length - 2}%` }} />

            {languages.map((lang, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-4 transition-all ${
                  lang.active
                    ? "border-primary bg-white shadow-lg shadow-primary/20"
                    : "border-border bg-muted opacity-60"
                }`}>
                  {lang.flag}
                </div>
                <span className={`text-xs font-medium text-center leading-tight max-w-[70px] ${
                  lang.active ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {lang.name}
                </span>
                {lang.active && (
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Available
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== КОМАНДА ===== */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Our Team</h2>

          <div className="grid sm:grid-cols-2 gap-8">
            <div className="text-center p-6 rounded-2xl border border-border bg-card">
              <div className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-4 border-4 border-primary/20">
                <img src="/image/teamBlock/kseniia.png" alt="Kseniia Makarova" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Kseniia Makarova</h3>
              <p className="text-sm font-semibold text-primary mb-2">Founder & CEO</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                M.A. in Linguistics, 7 years of teaching experience.
                Author of the methodology and course content.
              </p>
              <a href="mailto:kseniiamakarova46@gmail.com" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                <IconMail />
                kseniiamakarova46@gmail.com
              </a>
            </div>

            <div className="text-center p-6 rounded-2xl border border-border bg-card">
              <div className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-4 border-4 border-primary/20">
                <img src="/image/teamBlock/pavel.png" alt="Pavel Makarov" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Pavel Makarov</h3>
              <p className="text-sm font-semibold text-primary mb-2">Lead Developer</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Full-stack developer.
                Platform architecture and engineering.
              </p>
              <a href="mailto:mkrvpvl92@gmail.com" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                <IconMail />
                mkrvpvl92@gmail.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo height={28} showSlogan={false} />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ElevraLingua. All rights reserved.
          </p>
          <Link href="/login" className="text-sm text-primary font-medium hover:underline">
            Sign In
          </Link>
        </div>
      </footer>
    </div>
  );
}
