import { PortalLayout } from "@/components/app-shell/portal-layout";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout role="student">{children}</PortalLayout>;
}
