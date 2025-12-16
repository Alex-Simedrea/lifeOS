'use client'

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Separator } from '@/components/ui/separator'

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
        </header>
        <div className="flex-1">
          <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </div>
        </div>
      </main>
    </SidebarProvider>
  )
}


