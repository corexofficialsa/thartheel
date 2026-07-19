"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { arabicFont } from "@/lib/fonts";
import { QuranStandIllustration } from "./quran-stand-illustration";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center blur-3xl"
      >
        <div className="aspect-square w-[42rem] rounded-full bg-gradient-to-br from-primary/25 via-accent/20 to-transparent" />
      </div>

      <div className="mx-auto grid max-w-6xl gap-14 px-4 py-20 md:grid-cols-2 md:items-center md:px-6 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-border">
            <Sparkles className="size-3.5 text-accent" /> Admin-approved, structured Quran learning
          </span>

          <h1 className="mt-6 font-heading text-4xl leading-[1.1] font-semibold tracking-tight text-balance md:text-5xl">
            A premium Quran academy, built around your child&apos;s progress
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
            Live classes, tracked attendance, teacher-graded homework, and milestone-based progress reports — for
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
          <div className="overflow-hidden rounded-4xl bg-gradient-to-br from-[#1b3564] to-[#0b1730] shadow-2xl shadow-primary/20 ring-1 ring-black/10">
            <QuranStandIllustration className="h-64 w-full md:h-72" />
            <div className="border-t border-white/10 px-7 py-6">
              <p dir="rtl" lang="ar" className={`${arabicFont.className} text-right text-2xl leading-loose text-[#f5f1e4] md:text-[1.75rem]`}>
                وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا
              </p>
              <div className="mt-3 h-px bg-white/10" />
              <p className="mt-3 text-sm text-[#cbd4ea]">
                &ldquo;And recite the Qur&apos;an with measured recitation.&rdquo;
              </p>
              <p className="mt-1 text-xs text-[#8d9ac0]">Al-Muzzammil 73:4</p>
            </div>
          </div>
          <div className="absolute -bottom-6 -left-6 -z-10 size-28 rounded-full bg-accent/30 blur-2xl" />
        </motion.div>
      </div>
    </section>
  );
}
