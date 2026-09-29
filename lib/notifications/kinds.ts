import {
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  LifeBuoy,
  type LucideIcon,
  MessageSquare,
  RotateCcw,
  Trophy,
  UserPlus,
} from "lucide-react";
import type { NotificationKind } from "@/lib/supabase/types";

export const NOTIFICATION_ICON: Record<NotificationKind, LucideIcon> = {
  message: MessageSquare,
  homework: BookOpen,
  graded: CheckCircle2,
  reopened: RotateCcw,
  submission: ClipboardCheck,
  exam: FileText,
  result: Trophy,
  support: LifeBuoy,
  payment: BadgeCheck,
  registration: UserPlus,
};

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

// Fixed time zone so server and client render the same string (no
// hydration mismatch, no Date.now() during render).
const TIME_FORMAT = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Riyadh",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatNotificationTime(iso: string) {
  return TIME_FORMAT.format(new Date(iso));
}
