import { SidebarProvider } from "@/components/ui/sidebar";
import type { UserRole } from "@/lib/supabase/types";
import { BottomTabBar } from "./bottom-tab-bar";
import { getNavItems } from "./nav-config";
import { AppSidebar } from "./sidebar-nav";
import { TopBar } from "./top-bar";

export function AppShell({
  role,
  name,
  children,
}: {
  role: UserRole;
  name: string;
  children: React.ReactNode;
}) {
  const items = getNavItems(role);

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-svh w-full">
        <AppSidebar items={items} role={role} />
        <div className="flex min-h-svh w-full flex-1 flex-col">
          <TopBar name={name} role={role} />
          <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">{children}</main>
          <BottomTabBar items={items} />
        </div>
      </div>
    </SidebarProvider>
  );
}
