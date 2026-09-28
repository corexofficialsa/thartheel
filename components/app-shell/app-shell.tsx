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
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <div className="paper-grain flex min-h-svh w-full">
        <AppSidebar role={role} unread={unread} />
        <div className="relative flex min-h-svh w-full min-w-0 flex-1 flex-col">
          <TopBar name={name} role={role} />
          <main id="main" className="flex-1 px-4 pt-6 pb-24 md:px-8 md:pt-8 md:pb-12">
            <div className="mx-auto w-full max-w-6xl">
              <PageTransition>{children}</PageTransition>
            </div>
          </main>
          <BottomTabBar role={role} unread={unread} />
        </div>
      </div>
    </SidebarProvider>
  );
}
