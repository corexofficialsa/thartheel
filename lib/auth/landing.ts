import type { UserRole } from "@/lib/supabase/types";

// Students and teachers land straight in their classrooms rather than the
// stats dashboard — "Home" in the nav still reaches the dashboard.
const LANDING_PATH: Partial<Record<UserRole, string>> = {
  student: "/student/classrooms",
  teacher: "/teacher/classrooms",
};

export function landingPath(role: UserRole) {
  return LANDING_PATH[role] ?? `/${role}`;
}
