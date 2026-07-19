import { PortalLayout } from "@/components/app-shell/portal-layout";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout role="admin">{children}</PortalLayout>;
}
