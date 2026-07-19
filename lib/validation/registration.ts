import { z } from "zod";

const passwordSchema = z.string().min(8, "Password must be at least 8 characters");
const phoneSchema = z.string().min(6, "Enter a valid phone number");

export const studentRegistrationSchema = z
  .object({
    name: z.string().min(2, "Enter your full name"),
    age: z.coerce.number("Enter your age").int().min(4, "Enter a valid age").max(90, "Enter a valid age"),
    place: z.string().min(2, "Enter where you're located"),
    email: z.email("Enter a valid email"),
    phone: phoneSchema,
    whatsappNumber: phoneSchema,
    levelId: z.uuid("Select a level"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
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
