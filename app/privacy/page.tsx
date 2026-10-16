import type { Metadata } from "next";
import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { FloatingContact } from "@/components/site/floating-contact";
import { CONTACT_EMAIL, PRIVACY_UPDATED, formatLongDate } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What information Mirqath Quran Academy collects through this site, why, and who can see it.",
};

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "What we collect",
    body: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          <strong>Registration details</strong> — name, gender, age, country and city, address, phone and WhatsApp
          numbers, email, your Quranic-background answers, preferred class time and chosen level. Teachers may also
          upload a CV.
        </li>
        <li>
          <strong>Recordings and answers</strong> — the short ayah recitation recorded at registration, and homework
          answers (text, audio or video).
        </li>
        <li>
          <strong>Class records</strong> — attendance, phases, grades, exam results, progress notes, chat messages and
          support requests.
        </li>
        <li>
          <strong>Fee records</strong> — invoice amounts and whether they&apos;re paid. Payments themselves happen
          outside this site; we never see or store card details.
        </li>
      </ul>
    ),
  },
  {
    title: "Why we use it",
    body: "To place students in the right level and class, run lessons and homework, track progress, record fees, and contact you about your registration and classes.",
  },
  {
    title: "Who can see it",
    body: "Access is limited by role: you see your own information; your teachers see what they need for your classes; academy staff (admin, board and finance) see what their work requires. We don't sell or share your information with advertisers.",
  },
  {
    title: "Cookies",
    body: "We use only cookies the site needs to work: sign-in cookies to keep you logged in, and — if you arrived through a campaign link — a cookie remembering that link for 30 days so we know how you found us. Your theme choice and whether you've seen the cookie notice are saved in your own browser. There are no advertising or third-party tracking cookies.",
  },
  {
    title: "Where it's stored",
    body: "Data is stored with Supabase in the EU (Frankfurt), the site is hosted on Vercel, and emails are sent through Google Workspace. Passwords are never stored in readable form.",
  },
  {
    title: "Your choices",
    body: (
      <>
        To see, correct or delete your information, email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-4">
          {CONTACT_EMAIL}
        </a>
        .
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <MarketingNav />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 pt-16 pb-24 md:px-6">
        <p className="flex items-center gap-2 text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
          <span aria-hidden className="h-px w-6 bg-brass" />
          Privacy
        </p>
        <h1 className="mt-4 font-heading text-[2.4rem] leading-[1.1] font-normal tracking-[-0.02em] md:text-5xl">
          How we handle your information
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">Last updated {formatLongDate(PRIVACY_UPDATED)}</p>
        <div className="mt-12 space-y-10">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="font-heading text-2xl font-normal tracking-[-0.015em]">{s.title}</h2>
              <div className="mt-3 max-w-[65ch] text-[0.95rem] leading-relaxed text-muted-foreground">{s.body}</div>
            </section>
          ))}
        </div>
        <p className="mt-14 text-sm">
          <Link href="/" className="text-primary underline underline-offset-4">
            ← Back to home
          </Link>
        </p>
      </main>
      <MarketingFooter />
      <FloatingContact />
    </div>
  );
}
