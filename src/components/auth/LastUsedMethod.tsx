"use client"

import { useEffect, useState } from "react"
import { ClockFading } from "lucide-react"
import { getLastLoginMethod, getLoginMethodDisplayName, type LoginMethod } from "@/lib/lastLoginMethod"

export function LastUsedMethod() {
  const [lastMethod, setLastMethod] = useState<LoginMethod | null>(null)

  useEffect(() => {
    // Get last login method from localStorage
    const method = getLastLoginMethod()
    setLastMethod(method)
  }, [])

  if (!lastMethod) {
    return null
  }

  const displayName = getLoginMethodDisplayName(lastMethod)

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-full border border-muted-foreground/60 border-dashed w-fit">
      <ClockFading className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">
        Last used:
      </span>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-foreground">
          {displayName}
        </span>
      </div>
    </div>
  )
}
