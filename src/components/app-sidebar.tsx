"use client"

import * as React from "react"
import {
  BarChart3,
  BookOpen,
  Building2,
  Command,
  GitCompare,
  KeySquare,
  LifeBuoy,
  LineChart,
  MessageSquareText,
  FileText,
  Search,
  Send,
  Settings2,
  TrendingUp,
  Bot,
  User,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: BarChart3,
    },
    {
      title: "Brands",
      url: "/dashboard/brands",
      icon: Building2,
    },
    {
      title: "AI Query",
      url: "/dashboard/ai-query",
      icon: Bot,
    },
    {
      title: "AI Rankings",
      url: "/dashboard/ai-rankings",
      icon: TrendingUp,
    },
    {
      title: "Keywords",
      url: "/dashboard/keywords",
      icon: KeySquare,
    },
    {
      title: "Social Analysis",
      url: "/dashboard/social",
      icon: MessageSquareText,
    },
    {
      title: "Competitors",
      url: "/dashboard/competitors",
      icon: GitCompare,
    },
    {
      title: "Reports",
      url: "/dashboard/reports",
      icon: FileText,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings2,
    },
  ],
  navSecondary: [
    {
      title: "Documentation",
      url: "/documentation",
      icon: BookOpen,
    },
    {
      title: "Support",
      url: "/support",
      icon: LifeBuoy,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Brand Scope</span>
                  <span className="truncate text-xs">AI-Powered Analytics</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
