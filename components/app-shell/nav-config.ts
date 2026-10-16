import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  ClipboardCheck,
  ClipboardList,
  DollarSign,
  FileText,
  GraduationCap,
  Home,
  LayoutDashboard,
  MessageSquare,
  UserCog,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import type { UserRole } from "@/lib/supabase/types";

// badge: which unread count (if any) to show on this nav item.
// primary: shown in the phone tab bar when a role has more items than fit;
// the rest go under "More".
export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: "messages" | "notifications";
  primary?: boolean;
};

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  student: [
    { href: "/student", label: "Home", icon: Home },
    { href: "/student/classrooms", label: "Classrooms", icon: BookOpen },
    { href: "/student/homework", label: "Homework", icon: ClipboardList },
    { href: "/student/progress", label: "Progress", icon: BarChart3 },
    { href: "/student/chat", label: "Chat", icon: MessageSquare, badge: "messages" },
  ],
  teacher: [
    { href: "/teacher", label: "Home", icon: Home, primary: true },
    { href: "/teacher/classrooms", label: "Classrooms", icon: BookOpen, primary: true },
    { href: "/teacher/students", label: "Students", icon: GraduationCap },
    { href: "/teacher/attendance", label: "Attendance", icon: CalendarCheck },
    { href: "/teacher/homework", label: "Homework", icon: ClipboardList, primary: true },
    { href: "/teacher/academics", label: "Academics", icon: BarChart3 },
    { href: "/teacher/chat", label: "Chat", icon: MessageSquare, badge: "messages", primary: true },
  ],
  admin: [
    { href: "/admin", label: "Home", icon: LayoutDashboard, primary: true },
    { href: "/admin/students", label: "Students", icon: GraduationCap, primary: true },
    { href: "/admin/teachers", label: "Teachers", icon: Users },
    { href: "/admin/classrooms", label: "Classrooms", icon: BookOpen, primary: true },
    { href: "/admin/registrations/student", label: "Student Reg", icon: UserPlus, primary: true },
    { href: "/admin/registrations/teacher", label: "Teacher Reg", icon: UserCog },
    { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  ],
  board: [
    { href: "/board", label: "Home", icon: LayoutDashboard, primary: true },
    { href: "/board/teachers", label: "Teachers", icon: Users },
    { href: "/board/students", label: "Students", icon: GraduationCap, primary: true },
    { href: "/board/classrooms", label: "Classrooms", icon: BookOpen },
    { href: "/board/visit-reports", label: "Visit Reports", icon: ClipboardCheck },
    { href: "/board/finance", label: "Finance", icon: DollarSign, primary: true },
    { href: "/board/messages", label: "Messages", icon: MessageSquare, badge: "messages", primary: true },
  ],
  finance: [
    { href: "/finance", label: "Home", icon: LayoutDashboard },
    { href: "/finance/ledger", label: "Finance", icon: Wallet },
    { href: "/finance/summary", label: "Summary", icon: FileText },
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
