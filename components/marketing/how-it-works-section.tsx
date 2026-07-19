import { Reveal } from "./reveal";

const STEPS = [
  {
    step: "01",
    title: "Register",
    description: "Choose student or teacher and fill in your details. Level 2 students record a short recitation.",
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
    <section className="mx-auto max-w-6xl px-4 py-20 md:px-6">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">Getting started takes minutes</h2>
      </Reveal>

      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {STEPS.map((item, i) => (
          <Reveal key={item.step} delay={i * 0.1} className="relative">
            <span className="font-heading text-5xl font-semibold text-primary/15">{item.step}</span>
            <h3 className="mt-2 text-lg font-medium">{item.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
