"use client"

import * as React from "react"
import {
  BookOpen,
  Command,
  LifeBuoy,
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
import { TbAt, TbBookmarks, TbBuildings, TbLayoutGridAdd, TbListSearch, TbSquareLetterA, TbTrendingUp } from "react-icons/tb";


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
      title: "Library",
      url: "/dashboard/library",
      icon: TbBookmarks,
      group: "main"
    },
    // {
    //   title: "Inbox",
    //   url: "/dashboard/inbox",
    //   icon: TbMessage,
    //   group: "main"
    // },
    {
      title: "Research",
      url: "/dashboard/research",
      icon: TbBuildings,
      group: "metrics"
    },
    {
      title: "Keywords",
      url: "/dashboard/keywords",
      icon: TbSquareLetterA,
      group: "metrics"
    },
    // {
    //   title: "Model",
    //   url: "/dashboard/model",
    //   icon: TbSparkles,
    //   group: "metrics"
    // },
    {
      title: "Brand Mentions",
      url: "/dashboard/brand-mentions",
      icon: TbAt,
      group: "metrics"
    },
    // {
    //   title: "Social Analysis",
    //   url: "/dashboard/social",
    //   icon: TbGrid,
    //   group: "metrics"
    // },
    {
      title: "Improve",
      url: "/dashboard/improvement",
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
