import type { Metadata } from "next";
import { PortalLayout } from "@/components/app-shell/portal-layout";

// Private portal: keep it out of search engines.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout role="admin">{children}</PortalLayout>;
}
