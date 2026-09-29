// Options for the student registration form, mirroring the academy's Google
// Form. Shared by the form (client) and the registration action (server), so
// closing or reopening an option here updates both at once.

import type { SkillLevel } from "@/lib/supabase/types";

export const TERMS_URL = "https://drive.google.com/file/d/1zk-fSzzSOX0GI8wl0CMC9A7PUWPBQI7J/view?usp=sharing";

export const GENDERS = [
  { value: "male", label: "Male", open: true },
  { value: "female", label: "Female", open: false, closedNote: "Enrollments currently closed" },
] as const;
export type Gender = (typeof GENDERS)[number]["value"];

export const SKILL_QUESTIONS = [
  {
    field: "makharij",
    title: "Makharij",
    arabic: "مخارج الحروف",
    options: [
      { value: "beginner", label: "Beginner", hint: "തീരെ അറിയില്ല" },
      { value: "intermediate", label: "Intermediate", hint: "ചില ഭാഗങ്ങൾ മാത്രം അറിയാം" },
      { value: "advanced", label: "Advanced", hint: "മുഴുവനായി അറിയാം" },
    ],
  },
  {
    field: "qaida",
    title: "Qaida Madaniyya",
    arabic: "القاعدة المدنية",
    options: [
      { value: "beginner", label: "Beginner", hint: "മുമ്പ് പഠിച്ചിട്ടില്ല" },
      { value: "intermediate", label: "Intermediate", hint: "ചില ഭാഗങ്ങൾ മാത്രം അറിയാം" },
      { value: "advanced", label: "Advanced", hint: "മുഴുവനായി അറിയാം" },
    ],
  },
  {
    field: "tajweed",
    title: "Tajweed",
    arabic: "التجويد",
    options: [
      { value: "beginner", label: "Beginner", hint: "മുമ്പ് പഠിച്ചിട്ടില്ല" },
      { value: "intermediate", label: "Intermediate", hint: "ചില ഭാഗങ്ങൾ മാത്രം അറിയാം" },
      { value: "advanced", label: "Advanced", hint: "മുഴുവനായി അറിയാം" },
    ],
  },
] as const satisfies ReadonlyArray<{
  field: string;
  title: string;
  arabic: string;
  options: ReadonlyArray<{ value: SkillLevel; label: string; hint: string }>;
}>;

// levelName links a program to its row in the `levels` table. Only open
// programs can be chosen; Level 4 has no row yet because it isn't open.
export const PROGRAMS = [
  { key: "asas", arabic: "الأساس", name: "Al Asas", level: "Level 1", levelName: "Level 1", open: true },
  { key: "tamkeen", arabic: "التمكين", name: "Athamkeen", level: "Level 2", levelName: "Level 2", open: false },
  { key: "khatm", arabic: "ختم القرآن", name: "Khatmul Quran", level: "Level 3", levelName: "Level 3", open: false },
  { key: "hifz", arabic: "حفظ القرآن", name: "Hifzul Quran", level: "Level 4", levelName: null, open: false },
] as const;

export const OPEN_LEVEL_NAMES: readonly string[] = PROGRAMS.filter((p) => p.open && p.levelName).map(
  (p) => p.levelName as string
);

export const TIME_SLOTS = [
  { value: "05:30", label: "5:30 AM" },
  { value: "20:00", label: "8:00 PM" },
  { value: "21:00", label: "9:00 PM" },
] as const;

export const MAX_RECITATION_BYTES = 8 * 1024 * 1024;

export const SKILL_LABEL: Record<SkillLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function timeSlotLabel(value: string | null) {
  return TIME_SLOTS.find((s) => s.value === value)?.label ?? value ?? "—";
}
