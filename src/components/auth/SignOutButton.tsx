/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client"

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface SignOutButtonProps  {
  label?: string
}

export function SignOutButton({ 
  label = "Sign out",
  className,
  ...props
}: SignOutButtonProps) {
  const { signOut } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    
    try {
      await signOut()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      onClick={handleSignOut}
      disabled={isLoading}
      className={`flex items-center ${className}`}
      {...props}
    >
      {isLoading ? "Signing out..." : (
        <>
          <LogOut className="mr-2 h-4 w-4" />
          {label}
        </>
      )}
    </div>
  )
} 