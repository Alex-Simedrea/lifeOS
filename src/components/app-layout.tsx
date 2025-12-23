"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { GlobalSearch } from "@/components/search/global-search";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <AppSidebar />
      <main className="flex h-full flex-1 flex-col">
        <header className="z-10 flex h-12 items-center gap-4 border-b bg-background px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <div className="mr-auto">
            <GlobalSearch />
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-12">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
