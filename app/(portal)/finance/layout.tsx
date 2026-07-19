import { PortalLayout } from "@/components/app-shell/portal-layout";

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout role="finance">{children}</PortalLayout>;
}
