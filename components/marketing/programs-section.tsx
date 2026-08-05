import { BookOpenText, Mic } from "lucide-react";
import { Reveal } from "./reveal";

const PROGRAMS = [
  {
    name: "Level 1",
    tagline: "Qaida Al-Madania",
    description:
      "For students starting from the very beginning — Arabic letters, correct pronunciation, and the foundations of reading the Qur'an confidently.",
    points: ["Starts from the Arabic letters", "Correct pronunciation & basic Tajweed", "17-milestone tracked curriculum"],
    icon: BookOpenText,
  },
  {
    name: "Level 2",
    tagline: "Recitation Learning",
    description:
      "For students who already recite. A short recitation is recorded at registration so a teacher can place you at the right pace from day one.",
    points: ["Advanced recitation & Tajweed", "Recitation placement at sign-up", "10-milestone tracked curriculum"],
    icon: Mic,
  },
];

export function ProgramsSection() {
  return (
    <section id="programs" className="mx-auto max-w-6xl px-4 py-20 md:px-6">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">Two programs, one clear path</h2>
        <p className="mt-3 text-muted-foreground">
          Every student registers into Level 1 or Level 2 — the right one is easy to tell from where you&apos;re
          starting.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {PROGRAMS.map((program, i) => (
          <Reveal key={program.name} delay={i * 0.1}>
            <div className="group relative h-full overflow-hidden rounded-3xl border border-border/70 bg-card p-8 ring-1 ring-foreground/5 transition-shadow hover:shadow-lg hover:shadow-primary/5">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <program.icon className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-medium tracking-wide text-accent-foreground/70 uppercase">{program.tagline}</p>
                  <h3 className="font-heading text-xl font-semibold">{program.name}</h3>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{program.description}</p>
              <ul className="mt-5 space-y-2">
                {program.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
