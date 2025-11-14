"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Users,
  Mail,
  FileText,
  BarChart3,
  Calendar,
  Settings,
  ChevronRight,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"

const menuItems = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Analytics",
        url: "/dashboard/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "Lead Management",
    items: [
      {
        title: "Leads",
        url: "/dashboard/leads",
        icon: Users,
      },
      {
        title: "Scraper",
        url: "/dashboard/leads/scraper",
        icon: ChevronRight,
      },
      {
        title: "Outreach",
        url: "/dashboard/outreach",
        icon: Mail,
      },
    ],
  },
  {
    title: "Content",
    items: [
      {
        title: "Content Library",
        url: "/dashboard/content",
        icon: FileText,
      },
      {
        title: "Calendar",
        url: "/dashboard/calendar",
        icon: Calendar,
      },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4 bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-lg font-bold">E</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Emex Express</span>
            <span className="text-xs text-muted-foreground">Lead Dashboard</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {menuItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url} className={`${pathname.startsWith(item.url) ? 'bg-muted text-foreground rounded-md' : ''} flex items-center gap-2`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/dashboard/settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
