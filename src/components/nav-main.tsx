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
  const metricsItems = items.filter(item => item.group === "metrics");
  
  return (
    <>
      <SidebarGroup>
        <SidebarMenu>
          {mainItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild 
                tooltip={item.title}
                className={`transition-colors duration-200 hover:bg-gray-800/30 font-medium ${
                  pathname === item.url 
                    ? "bg-blue-500/20 border border-blue-500/20" 
                    : "text-white/40"
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
        <SidebarGroupLabel>Metrics</SidebarGroupLabel>
        <SidebarMenu>
          {metricsItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild 
                tooltip={item.title}
                className={`transition-colors duration-200 hover:bg-gray-800/30 font-medium ${
                  pathname === item.url 
                    ? "bg-blue-900/10 border border-blue-500/20" 
                    : "text-white/40"
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
