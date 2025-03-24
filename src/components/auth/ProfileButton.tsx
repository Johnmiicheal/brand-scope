"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { Loader2, User, Settings } from 'lucide-react'

export function ProfileButton() {
  const { user, isLoading } = useAuth()
  const [open, setOpen] = useState(false)
  
  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    )
  }
  
  if (!user) {
    return (
      <Button variant="ghost" size="sm" asChild>
        <Link href="/login">Sign in</Link>
      </Button>
    )
  }
  
  // Get email or name from user
  const name = user.user_metadata?.full_name || 
    user.user_metadata?.name ||
    user.email?.split('@')[0] || 
    'User'
  
  // Get first letter of name for avatar
  const initial = name.charAt(0).toUpperCase()
  
  // Get avatar URL
  const avatarUrl = user.user_metadata?.avatar_url || null
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl || undefined} alt={name} />
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <SignOutButton className="w-full justify-start" />
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 