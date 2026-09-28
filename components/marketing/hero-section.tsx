"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { arabicFont } from "@/lib/fonts";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_30rem_at_15%_-10%,color-mix(in_oklch,var(--brass)_14%,transparent),transparent_70%)]"
      />

      <div className="mx-auto grid max-w-6xl gap-14 px-4 pt-16 pb-24 md:grid-cols-[1.1fr_0.9fr] md:items-center md:px-6 md:pt-24 md:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <p className="flex items-center gap-2 text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
            <span aria-hidden className="h-px w-6 bg-brass" />
            Structured, teacher-led Quran learning
          </p>

          <h1 className="mt-6 font-heading text-[2.6rem] leading-[1.05] font-normal tracking-[-0.025em] md:text-[3.75rem]">
            A premium Quran academy, built around your child&apos;s progress
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
            Live classes, tracked attendance, teacher-graded homework, and phase-based progress reports — for
            students and teachers alike, in one calm, focused portal.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" className="h-11 rounded-xl px-6 text-base" nativeButton={false} render={<Link href="/register/student" />}>
              Register as a student <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 rounded-xl px-6 text-base"
              nativeButton={false}
              render={<Link href="/register/teacher" />}
            >
              Register as a teacher
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Already registered?{" "}
            <Link href="/login" className="font-medium text-primary underline underline-offset-4">
              Log in
            </Link>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          className="relative"
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-lifted ring-1 ring-black/10 md:aspect-[3/4]">
            <Image
              src="/hero-quran-stand.jpg"
              alt="An open Qur'an resting on a wooden rehal stand"
              fill
              priority
              sizes="(min-width: 768px) 40vw, 90vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1526] via-[#0b1526]/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 px-7 py-7">
              <p dir="rtl" lang="ar" className={`${arabicFont.className} text-right text-2xl leading-loose text-[#f5f1e4] md:text-[1.75rem]`}>
                وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا
              </p>
              <div className="mt-3 h-px bg-white/15" />
              <p className="mt-3 text-sm text-[#dde3f2]">
                &ldquo;And recite the Qur&apos;an with measured recitation.&rdquo;
              </p>
              <p className="mt-1 text-xs text-[#a7b2cf]">Al-Muzzammil 73:4</p>
            </div>
          </div>
          <div aria-hidden className="absolute -bottom-5 -left-5 -z-10 size-full rounded-[2rem] border border-brass/30" />
        </motion.div>
      </div>
    </section>
  );
}
