import { PortalLayout } from "@/components/app-shell/portal-layout";

export default function BoardLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout role="board">{children}</PortalLayout>;
}
