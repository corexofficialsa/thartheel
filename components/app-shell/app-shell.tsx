import { SidebarProvider } from "@/components/ui/sidebar";
import type { UnreadCounts } from "@/lib/notifications/counts";
import type { NotificationItem } from "@/lib/notifications/kinds";
import type { UserRole } from "@/lib/supabase/types";
import { BackToTop } from "@/components/site/back-to-top";
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
  recent,
  children,
}: {
  role: UserRole;
  name: string;
  userId: string;
  unread: UnreadCounts;
  recent: NotificationItem[];
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen>
      <NotificationsListener userId={userId} />
      <div className="paper-grain flex min-h-svh w-full">
        <AppSidebar role={role} unread={unread} />
        <div className="relative flex min-h-svh w-full min-w-0 flex-1 flex-col">
          <TopBar name={name} role={role} unreadCount={unread.notifications} recent={recent} />
          <main id="main" className="flex-1 px-4 pt-6 pb-24 md:px-8 md:pt-8 md:pb-12 print:p-0">
            <div className="mx-auto w-full max-w-6xl">
              <PageTransition>{children}</PageTransition>
            </div>
          </main>
          <BottomTabBar role={role} unread={unread} />
          <BackToTop offsetClassName="bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6" />
        </div>
      </div>
    </SidebarProvider>
  );
}
