import { Award, BookOpenText, Mic } from "lucide-react";
import { Reveal } from "./reveal";

const PROGRAMS = [
  {
    name: "Level 1",
    tagline: "Qaida Al-Madania",
    description:
      "For students starting from the very beginning — Arabic letters, correct pronunciation, and the foundations of reading the Qur'an confidently.",
    points: ["Starts from the Arabic letters", "Correct pronunciation & basic Tajweed", "17-phase tracked curriculum"],
    icon: BookOpenText,
  },
  {
    name: "Level 2",
    tagline: "Recitation Learning",
    description:
      "For students who already recite. A short recitation is recorded at registration so a teacher can place you at the right pace from day one.",
    points: ["Advanced recitation & Tajweed", "Recitation placement at sign-up", "10-phase tracked curriculum"],
    icon: Mic,
  },
  {
    name: "Level 3",
    tagline: "Advanced Recitation",
    description:
      "For confident reciters ready for the next step. As with Level 2, a short recitation at registration helps place you correctly.",
    points: ["Refined recitation & Tajweed mastery", "Recitation placement at sign-up", "10-phase tracked curriculum"],
    icon: Award,
  },
];

export function ProgramsSection() {
  return (
    <section id="programs" className="mx-auto max-w-6xl px-4 py-24 md:px-6">
      <Reveal className="max-w-2xl">
        <p className="flex items-center gap-2 text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
          <span aria-hidden className="h-px w-6 bg-brass" />
          Programs
        </p>
        <h2 className="mt-4 font-heading text-[2.25rem] leading-[1.1] font-normal tracking-[-0.02em] md:text-5xl">
          Three levels, one clear path
        </h2>
        <p className="mt-4 max-w-[58ch] text-muted-foreground">
          Every student registers into Level 1, 2, or 3 — the right one is easy to tell from where you&apos;re
          starting.
        </p>
      </Reveal>

      <ol className="mt-14 border-t border-border">
        {PROGRAMS.map((program, i) => (
          <Reveal key={program.name} delay={i * 0.08}>
            <li className="group grid gap-6 border-b border-border py-10 md:grid-cols-[7rem_1fr_1.1fr] md:gap-10">
              <span className="font-heading text-6xl leading-none font-light text-brass tabular-nums">0{i + 1}</span>
              <div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <program.icon className="size-4" />
                  <span className="text-sm">{program.tagline}</span>
                </div>
                <h3 className="mt-2 font-heading text-3xl font-normal tracking-[-0.015em]">{program.name}</h3>
                <p className="mt-3 max-w-[48ch] text-sm leading-relaxed text-muted-foreground">{program.description}</p>
              </div>
              <ul className="space-y-3 self-center md:border-l md:border-border md:pl-10">
                {program.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm">
                    <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-brass" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
