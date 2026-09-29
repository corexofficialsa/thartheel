import { z } from "zod";
import { GENDERS, TIME_SLOTS } from "@/lib/registration/student-options";

export const passwordSchema = z.string().min(8, "Password must be at least 8 characters");
const phoneSchema = z.string().min(6, "Enter a valid phone number");
const internationalPhoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9\s-]{7,16}$/, "Enter a valid number with country code, e.g. +966 5xxxxxxxx");

const skillSchema = z.enum(["beginner", "intermediate", "advanced"], "Choose one option");

// The student form is filled in over 4 steps; each step validates its own
// slice before moving on, and the server validates the whole thing.
export const studentStepSchemas = [
  z.object({
    name: z.string().trim().min(2, "Enter your full name"),
    gender: z
      .enum(GENDERS.map((g) => g.value), "Select your gender")
      .refine((g) => GENDERS.some((o) => o.value === g && o.open), "Enrollments are currently closed for this option"),
    age: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.coerce.number("Enter your age").int("Enter a valid age").min(4, "Enter a valid age").max(90, "Enter a valid age")
    ),
    place: z.string().trim().min(2, "Enter your country and city"),
    address: z.string().trim().min(5, "Enter your current address"),
    phone: internationalPhoneSchema,
    whatsappNumber: internationalPhoneSchema,
    email: z.email("Enter a valid email"),
  }),
  z.object({
    makharij: skillSchema,
    qaida: skillSchema,
    tajweed: skillSchema,
  }),
  z.object({
    levelId: z.uuid("Choose a program"),
    timeSlot: z.enum(TIME_SLOTS.map((t) => t.value), "Choose a time slot"),
  }),
  z
    .object({
      password: passwordSchema,
      confirmPassword: z.string(),
      termsAccepted: z.literal("on", "Please confirm you agree to the Terms & Conditions"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
] as const;

export const studentRegistrationSchema = studentStepSchemas[0]
  .extend(studentStepSchemas[1].shape)
  .extend(studentStepSchemas[2].shape)
  .extend(studentStepSchemas[3].shape)
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const teacherRegistrationSchema = z
  .object({
    name: z.string().min(2, "Enter your full name"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .regex(/^[a-zA-Z0-9_.]+$/, "Letters, numbers, dots and underscores only"),
    email: z.email("Enter a valid email"),
    phone: phoneSchema,
    whatsappNumber: phoneSchema,
    levelId: z.uuid("Select the level you teach"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type StudentRegistrationInput = z.infer<typeof studentRegistrationSchema>;
export type TeacherRegistrationInput = z.infer<typeof teacherRegistrationSchema>;
