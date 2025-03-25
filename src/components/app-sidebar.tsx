"use client"

import * as React from "react"
import {
  BookOpen,
  Command,
  Home,
  Inbox,
  LifeBuoy,
  MessageSquareText,
  Search,
  Building2,
  KeySquare,
  Bot,
  FileText,
  Sparkles
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
import { TbAt, TbBuildings, TbGridScan, TbLayoutGridAdd, TbListSearch, TbMessage, TbSparkles, TbSquareLetterA, TbTrendingUp } from "react-icons/tb";


const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: TbLayoutGridAdd,
      group: "main"
    },
    {
      title: "Search",
      url: "/dashboard/search",
      icon: TbListSearch,
      group: "main"
    },
    {
      title: "Inbox",
      url: "/dashboard/inbox",
      icon: TbMessage,
      group: "main"
    },
    {
      title: "Industry",
      url: "/dashboard/industry",
      icon: TbBuildings,
      group: "metrics"
    },
    {
      title: "Keywords",
      url: "/dashboard/keywords",
      icon: TbSquareLetterA,
      group: "metrics"
    },
    {
      title: "Model",
      url: "/dashboard/model",
      icon: TbSparkles,
      group: "metrics"
    },
    {
      title: "Citation",
      url: "/dashboard/citation",
      icon: TbGridScan,
      group: "metrics"
    },
    {
      title: "Social Analysis",
      url: "/dashboard/social",
      icon: TbAt,
      group: "metrics"
    },
    {
      title: "Improve",
      url: "/dashboard/improve",
      icon: TbTrendingUp,
      group: "metrics"
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
    <Sidebar variant="inset"  collapsible="icon" {...props}>
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
