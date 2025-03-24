"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { SignOutButton } from "@/components/auth/SignOutButton"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { user, isLoading } = useAuth()
  
  // If loading or no user, show loading or login state
  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg">...</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Loading...</span>
              <span className="truncate text-xs">Please wait</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }
  
  if (!user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild>
            <a href="/login">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">?</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Sign in</span>
                <span className="truncate text-xs">Access your account</span>
              </div>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }
  
  // Get name from user metadata or email
  const name = user.user_metadata?.full_name || 
    user.user_metadata?.name ||
    user.email?.split('@')[0] || 
    'User'
  
  // Get avatar URL or first letter for fallback
  const avatarUrl = user.user_metadata?.avatar_url || null
  const initial = name.charAt(0).toUpperCase()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={avatarUrl || undefined} alt={name} />
                <AvatarFallback className="rounded-lg">{initial}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={avatarUrl || undefined} alt={name} />
                  <AvatarFallback className="rounded-lg">{initial}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <a href="/profile">
                  <BadgeCheck className="mr-2 h-4 w-4" />
                  Profile
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/settings">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Settings
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/notifications">
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </a>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <SignOutButton className="flex w-full items-center justify-start p-0" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
