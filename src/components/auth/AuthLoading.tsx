"use client"

import { Loader2 } from "lucide-react"

interface AuthLoadingProps {
  message?: string
}

export function AuthLoading({ message = "Checking authentication..." }: AuthLoadingProps) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  )
} 