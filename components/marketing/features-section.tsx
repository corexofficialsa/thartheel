import { CalendarCheck, MessageCircle, Mic2, ShieldCheck, Trophy, Video } from "lucide-react";
import { Reveal } from "./reveal";

const FEATURES = [
  {
    title: "Live classes",
    description: "Join scheduled classes with one click, with attendance logged automatically as you join.",
    icon: Video,
  },
  {
    title: "Audio & video homework",
    description: "Record spoken or video answers right in the browser — no extra apps to install.",
    icon: Mic2,
  },
  {
    title: "Milestone tracking",
    description: "Progress through the syllabus is tracked step by step, visible to students and parents alike.",
    icon: CalendarCheck,
  },
  {
    title: "Direct teacher chat",
    description: "Ask questions and get feedback straight from your assigned teacher, inside the portal.",
    icon: MessageCircle,
  },
  {
    title: "Attendance leaderboard",
    description: "Top students are recognized for consistent attendance and strong results.",
    icon: Trophy,
  },
  {
    title: "Admin-approved onboarding",
    description: "Every account is reviewed before activation, keeping every classroom safe and verified.",
    icon: ShieldCheck,
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="border-y border-border/60 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            Everything a classroom needs, nothing it doesn&apos;t
          </h2>
          <p className="mt-3 text-muted-foreground">One calm portal for students, teachers, and admins.</p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 3) * 0.08}>
              <div className="h-full rounded-2xl border border-border/70 bg-card p-6 ring-1 ring-foreground/5">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-medium">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
