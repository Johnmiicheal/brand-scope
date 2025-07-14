/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { usePathname } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import React from "react"
import Link from "next/link"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: any
    isActive?: boolean
    group?: string
  }[]
}) {
  const pathname = usePathname()
  
  // Filter items by group
  const mainItems = items.filter(item => item.group === "main");
  const analyticsItems = items.filter(item => item.group === "analytics");
  
  return (
    <>
      <SidebarGroup>
        <SidebarMenu>
          {mainItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild 
                tooltip={item.title}
                className={`transition-colors duration-200 dark:hover:bg-gray-800/30 font-medium ${
                  pathname === item.url 
                    ? "border-1 border-[#00173A] text-blue-500/70 bg-gradient-to-r from-background to-blue-600/50 hover:from-background hover:border-[#002661] hover:text-blue-500 hover:to-blue-600/70" 
                    : "dark:text-white/40 text-black/40"
                }`}
              >
                <Link href={item.url}>
                  {item.icon && React.createElement(item.icon, { className: "w-5 h-5" })}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
      
      <SidebarGroup>
        <SidebarGroupLabel>Analytics</SidebarGroupLabel>
        <SidebarMenu>
          {analyticsItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild 
                tooltip={item.title}
                className={`transition-colors duration-200 dark:hover:bg-gray-800/30 font-medium ${
                  pathname === item.url 
                  ? "border-1 border-[#00173A] text-blue-500/70 bg-gradient-to-r from-background to-blue-600/50 hover:from-background hover:border-[#002661] hover:text-blue-500 hover:to-blue-600/70" 
                  : "dark:text-white/40 text-black/40"
                }`}
              >
                <Link href={item.url}>
                  {item.icon && React.createElement(item.icon, { className: "w-5 h-5" })}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </>
  )
}
