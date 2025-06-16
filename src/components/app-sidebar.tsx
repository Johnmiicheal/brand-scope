/* eslint-disable @next/next/no-img-element */
"use client"

import * as React from "react"
import {
  BookOpen,
  LifeBuoy,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
// import { NavSecondary } from "@/components/nav-secondary"
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
import { TbAt, TbBookmarks, TbLayoutGridAdd, TbListSearch, TbSquareLetterA, TbTrendingUp } from "react-icons/tb";
import { RankiaIcon } from "./icon-rankia"


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
    // {
    //   title: "Research",
    //   url: "/dashboard/research",
    //   icon: TbBuildings,
    //   group: "metrics"
    // },
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
    <Sidebar variant="inset"  collapsible="icon" {...props} className="bg-white dark:bg-background">
      <SidebarHeader className="bg-white dark:bg-background">
        <SidebarMenu className="bg-white dark:bg-background">
          <SidebarMenuItem className="bg-white dark:bg-background">
            <SidebarMenuButton size="lg" asChild className="group">
              <a href="/dashboard">
                <div className="bg-blue-500/10 text-blue-500/70 border-1 border-blue-500/20 flex aspect-square size-8 items-center justify-center rounded-lg">
                  <RankiaIcon className="w-full h-full object-contain text-blue-500/50 group-hover:animate-[spin_4s_linear_infinite]" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold ">AI Rankia</span>
                  <span className="truncate text-[10px]">AI-Powered Prompt Analysis</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-white dark:bg-background">
        <NavMain items={data.navMain} />
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter className="bg-white dark:bg-background">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
