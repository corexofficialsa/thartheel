import { SidebarProvider } from "@/components/ui/sidebar";
import type { UnreadCounts } from "@/lib/notifications/counts";
import type { UserRole } from "@/lib/supabase/types";
import { BottomTabBar } from "./bottom-tab-bar";
import { NotificationsListener } from "./notifications-listener";
import { PageTransition } from "./page-transition";
import { AppSidebar } from "./sidebar-nav";
import { TopBar } from "./top-bar";

export function AppShell({
  role,
  name,
  userId,
  unread,
  children,
}: {
  role: UserRole;
  name: string;
  userId: string;
  unread: UnreadCounts;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen>
      <NotificationsListener userId={userId} />
      <div className="flex min-h-svh w-full">
        <AppSidebar role={role} unread={unread} />
        <div className="flex min-h-svh w-full flex-1 flex-col">
          <TopBar name={name} role={role} />
          <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
            <PageTransition>{children}</PageTransition>
          </main>
          <BottomTabBar role={role} unread={unread} />
        </div>
      </div>
    </SidebarProvider>
  );
}
