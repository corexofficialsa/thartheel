import { ChevronDown } from "lucide-react";
import { CONTACT_EMAIL, FAQ_UPDATED, formatLongDate } from "@/lib/site";
import { Reveal } from "./reveal";

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Who can register right now?",
    a: "Admissions are currently open for Level 1 — Al Asas (الأساس). The other levels open in future sessions, and female enrollments are currently closed.",
  },
  {
    q: "How does registration work?",
    a: "Fill in four short steps: your details, a quick self-assessment with a short recitation of an ayah, your preferred class time, and your password. Our finance team then confirms your registration fee, an admin reviews your registration, and you'll receive your login link.",
  },
  {
    q: "How much is the registration fee?",
    a: "The current fee is shown on the last step of the registration form, before you submit.",
  },
  {
    q: "When are classes held?",
    a: "Classes run at 5:30 AM, 8:00 PM and 9:00 PM. Batches are assigned based on your choice, the Ustad's availability and batch capacity, and timings may shift slightly with prayer times.",
  },
  {
    q: "How do classes and homework work?",
    a: "Classes are live and online — join from your portal with one click and your attendance is recorded automatically. Homework can be answered with text, audio or video, right in the browser, and your teacher grades it there.",
  },
  {
    q: "Do I need to install an app?",
    a: "No. The portal works in any modern browser on your phone or computer. On Android, you can also add it to your home screen from Chrome's menu (Install app) to use it like an app.",
  },
  {
    q: "I forgot my password. What do I do?",
    a: "Use “Forgot password?” on the log in page. We'll email your username and a link to set a new password.",
  },
  {
    q: "How can I contact the academy?",
    a: (
      <>
        Email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-4">
          {CONTACT_EMAIL}
        </a>
        , or once you&apos;re registered, use Support in your portal&apos;s chat.
      </>
    ),
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 md:px-6">
      <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
        <Reveal className="md:sticky md:top-24 md:self-start">
          <p className="flex items-center gap-2 text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
            <span aria-hidden className="h-px w-6 bg-brass" />
            Questions
          </p>
          <h2 className="mt-4 font-heading text-[2.25rem] leading-[1.1] font-normal tracking-[-0.02em] md:text-5xl">
            Frequently asked
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">Last updated {formatLongDate(FAQ_UPDATED)}</p>
        </Reveal>
        <div className="divide-y divide-border border-y border-border">
          {FAQS.map((item) => (
            <details key={item.q} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg py-4 text-left font-heading text-lg tracking-[-0.01em] transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <p className="max-w-[62ch] pb-5 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
