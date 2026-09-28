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
    title: "Phase tracking",
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
    <section id="features" className="border-y border-border/60 bg-secondary/50">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 md:grid-cols-[0.8fr_1.2fr] md:gap-16 md:px-6">
        <Reveal className="md:sticky md:top-24 md:self-start">
          <p className="flex items-center gap-2 text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
            <span aria-hidden className="h-px w-6 bg-brass" />
            The portal
          </p>
          <h2 className="mt-4 font-heading text-[2.25rem] leading-[1.1] font-normal tracking-[-0.02em] md:text-5xl">
            Everything a classroom needs, nothing it doesn&apos;t
          </h2>
          <p className="mt-4 max-w-[40ch] text-muted-foreground">One calm portal for students, teachers, and admins.</p>
        </Reveal>

        <div className="grid sm:grid-cols-2">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 2) * 0.08}>
              <div className="h-full border-t border-border py-7 sm:pr-8">
                <feature.icon className="size-5 text-primary" />
                <h3 className="mt-4 font-heading text-xl font-normal tracking-[-0.01em]">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
