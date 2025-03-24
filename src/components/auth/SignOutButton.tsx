"use client"

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button, ButtonProps } from '@/components/ui/button'

interface SignOutButtonProps extends ButtonProps {
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
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSignOut}
      disabled={isLoading}
      className={className}
      {...props}
    >
      {isLoading ? "Signing out..." : (
        <>
          <LogOut className="mr-2 h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  )
} 