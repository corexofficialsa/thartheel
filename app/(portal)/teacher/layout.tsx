import { PortalLayout } from "@/components/app-shell/portal-layout";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout role="teacher">{children}</PortalLayout>;
}
