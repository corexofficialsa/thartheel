import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  DollarSign,
  GraduationCap,
  Home,
  LayoutDashboard,
  MessageSquare,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import type { UserRole } from "@/lib/supabase/types";

export type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  student: [
    { href: "/student", label: "Home", icon: Home },
    { href: "/student/classrooms", label: "Classrooms", icon: BookOpen },
    { href: "/student/homework", label: "Homework", icon: ClipboardList },
    { href: "/student/progress", label: "Progress", icon: BarChart3 },
    { href: "/student/chat", label: "Chat", icon: MessageSquare },
  ],
  teacher: [
    { href: "/teacher", label: "Home", icon: Home },
    { href: "/teacher/classrooms", label: "Classrooms", icon: BookOpen },
    { href: "/teacher/homework", label: "Homework", icon: ClipboardList },
    { href: "/teacher/academics", label: "Academics", icon: BarChart3 },
    { href: "/teacher/chat", label: "Chat", icon: MessageSquare },
  ],
  admin: [
    { href: "/admin", label: "Home", icon: LayoutDashboard },
    { href: "/admin/registrations/student", label: "Student Reg", icon: GraduationCap },
    { href: "/admin/registrations/teacher", label: "Teacher Reg", icon: UserCog },
  ],
  board: [
    { href: "/board", label: "Home", icon: LayoutDashboard },
    { href: "/board/teachers", label: "Teachers", icon: Users },
    { href: "/board/students", label: "Students", icon: GraduationCap },
    { href: "/board/visit-reports", label: "Visit Reports", icon: ClipboardCheck },
    { href: "/board/finance", label: "Finance", icon: DollarSign },
  ],
  finance: [
    { href: "/finance", label: "Home", icon: LayoutDashboard },
    { href: "/finance/ledger", label: "Finance", icon: Wallet },
  ],
};

export function getNavItems(role: UserRole): NavItem[] {
  return NAV_BY_ROLE[role];
}

export function getActiveHref(items: NavItem[], pathname: string): string | null {
  let bestMatch: string | null = null;
  for (const item of items) {
    const matches = pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (matches && (bestMatch === null || item.href.length > bestMatch.length)) {
      bestMatch = item.href;
    }
  }
  return bestMatch;
}

export const ROLE_LABEL: Record<UserRole, string> = {
  student: "Student",
  teacher: "Teacher",
  admin: "Admin",
  board: "Board Committee",
  finance: "Finance",
};
