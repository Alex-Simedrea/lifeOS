'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity,
  CheckSquare,
  Calendar,
  Timer,
  Target,
  Droplets,
  Utensils,
  Dumbbell,
  LayoutDashboard,
  Settings,
  ChevronRight,
  FileText,
} from 'lucide-react'
import { UserButton } from '@clerk/nextjs'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

const navItems = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    ],
  },
  {
    title: 'Productivity',
    items: [
      { title: 'Tasks', icon: CheckSquare, href: '/tasks' },
      { title: 'Calendar', icon: Calendar, href: '/calendar' },
      { title: 'Timers', icon: Timer, href: '/timers' },
      { title: 'Notes', icon: FileText, href: '/notes' },
    ],
  },
  {
    title: 'Wellness',
    items: [
      { title: 'Habits', icon: Target, href: '/habits' },
      { title: 'Hydration', icon: Droplets, href: '/hydration' },
      { title: 'Food', icon: Utensils, href: '/food' },
      { title: 'Workouts', icon: Dumbbell, href: '/workouts' },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Activity className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">LifeOS</span>
                  <span className="text-xs">Organize your life</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navItems.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8"
                  }
                }}
              />
              <span className="text-sm font-medium">Account</span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}


