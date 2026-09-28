import { Reveal } from "./reveal";

const STEPS = [
  {
    step: "01",
    title: "Register",
    description: "Choose student or teacher and fill in your details. Level 2 and 3 students record a short recitation.",
  },
  {
    step: "02",
    title: "Admin review",
    description: "An admin reviews every registration before approving it — usually within a day or two.",
  },
  {
    step: "03",
    title: "Start learning",
    description: "Log in, get placed in a classroom, and join your first live class.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 md:px-6">
      <Reveal className="max-w-2xl">
        <h2 className="font-heading text-[2.25rem] leading-[1.1] font-normal tracking-[-0.02em] md:text-5xl">
          Getting started takes minutes
        </h2>
      </Reveal>

      <div className="mt-14 grid gap-10 md:grid-cols-3">
        {STEPS.map((item, i) => (
          <Reveal key={item.step} delay={i * 0.1} className="relative border-t border-border pt-6">
            <span className="font-heading text-sm text-brass tabular-nums">{item.step}</span>
            <h3 className="mt-3 font-heading text-2xl font-normal tracking-[-0.01em]">{item.title}</h3>
            <p className="mt-2 max-w-[36ch] text-sm leading-relaxed text-muted-foreground">{item.description}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
