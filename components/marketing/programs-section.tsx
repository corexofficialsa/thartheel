import { BookOpenText, BookHeart, Mic, Sparkles } from "lucide-react";
import { PROGRAMS as PROGRAM_NAMES } from "@/lib/registration/student-options";
import { arabicFont } from "@/lib/fonts";
import { Reveal } from "./reveal";

// Names, levels and which are open come from the registration options, so
// the home page and the registration form always agree.
const DETAILS: Record<(typeof PROGRAM_NAMES)[number]["key"], { description: string; points: string[]; icon: typeof Mic }> = {
  asas: {
    description:
      "The foundation — for students starting from the very beginning: Arabic letters, correct pronunciation, and reading the Qur'an confidently.",
    points: ["Qaida Madaniyya from the Arabic letters", "Makharij & basic Tajweed", "17-phase tracked curriculum"],
    icon: BookOpenText,
  },
  tamkeen: {
    description:
      "Strengthening — for students who can already read, building fluent, correct recitation with Tajweed applied throughout.",
    points: ["Fluent recitation with applied Tajweed", "Teacher placement from your recitation", "10-phase tracked curriculum"],
    icon: Mic,
  },
  khatm: {
    description:
      "Completing the Qur'an — reciting the whole Mushaf from beginning to end under a teacher's guidance, with Tajweed refined along the way.",
    points: ["Complete recitation of the Qur'an", "Refined Tajweed & fluency", "10-phase tracked curriculum"],
    icon: Sparkles,
  },
  hifz: {
    description:
      "Memorising the Qur'an — a structured Hifz programme with regular revision, for students ready to commit the Qur'an to heart.",
    points: ["Structured memorisation plan", "Regular revision (muraja'ah)", "Close teacher follow-up"],
    icon: BookHeart,
  },
};

const PROGRAMS = PROGRAM_NAMES.map((p) => ({ ...p, ...DETAILS[p.key] }));

export function ProgramsSection() {
  return (
    <section id="programs" className="mx-auto max-w-6xl px-4 py-24 md:px-6">
      <Reveal className="max-w-2xl">
        <p className="flex items-center gap-2 text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
          <span aria-hidden className="h-px w-6 bg-brass" />
          Programs
        </p>
        <h2 className="mt-4 font-heading text-[2.25rem] leading-[1.1] font-normal tracking-[-0.02em] md:text-5xl">
          Four levels, one clear path
        </h2>
        <p className="mt-4 max-w-[58ch] text-muted-foreground">
          From the first letters to memorising the whole Qur&apos;an. Admissions are currently open for Al Asas
          (Level 1); the other levels open in future sessions.
        </p>
      </Reveal>

      <ol className="mt-14 border-t border-border">
        {PROGRAMS.map((program, i) => (
          <Reveal key={program.key} delay={i * 0.08}>
            <li className="group grid gap-6 border-b border-border py-10 md:grid-cols-[7rem_1fr_1.1fr] md:gap-10">
              <span className="font-heading text-6xl leading-none font-light text-brass tabular-nums">0{i + 1}</span>
              <div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
                  <span className="flex items-center gap-2 text-sm">
                    <program.icon className="size-4" />
                    {program.level}
                  </span>
                  {program.open ? (
                    <span className="rounded-md bg-success/12 px-2 py-0.5 text-xs font-medium text-success">
                      Admissions open
                    </span>
                  ) : (
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs">Opens in a future session</span>
                  )}
                </div>
                <h3 className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span dir="rtl" lang="ar" className={`${arabicFont.className} text-3xl leading-normal`}>
                    {program.arabic}
                  </span>
                  <span className="font-heading text-2xl font-normal tracking-[-0.015em]">{program.name}</span>
                </h3>
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
