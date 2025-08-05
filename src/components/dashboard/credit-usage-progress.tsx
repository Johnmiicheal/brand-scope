"use client"

import React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { getConstraints } from "@/lib/constraints"
import { cn } from "@/lib/utils"
import { Zap } from "lucide-react"

interface CreditUsageProgressProps {
  className?: string
}

export function CreditUsageProgress({ className }: CreditUsageProgressProps) {
  const { user_subscriptions, product } = useAuth()

  if (!user_subscriptions || !product) {
    return null
  }

  const constraints = getConstraints(product.name)
  const usedCredits = user_subscriptions.query_count || 0
  const maxCredits = constraints.max_credits
  const paygCredits = user_subscriptions.payg_credits || 0
  const subscriptionCreditsRemaining = Math.max(0, maxCredits - usedCredits)
  const totalAvailableCredits = subscriptionCreditsRemaining + paygCredits
  
  // Calculate percentage based on subscription usage
  const percentage = Math.min((usedCredits / maxCredits) * 100, 100)
  const circumference = 2 * Math.PI * 45 // radius of 45
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  // Color based on usage percentage
  const getColor = () => {
    if (percentage >= 90) return "text-red-500"
    if (percentage >= 70) return "text-orange-500"
    return "text-blue-500"
  }

  const getColorStroke = () => {
    if (percentage >= 90) return "#ef4444"
    if (percentage >= 70) return "#f97316"
    return "#3b82f6"
  }

  return (
    <div className={cn("flex items-center justify-between  py-2 mx-2", className)}>
      {/* Mini progress circle */}
      <div className="relative w-8 h-8">
        <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-muted-foreground/20"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke={getColorStroke()}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-in-out"
          />
        </svg>
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Zap className={cn("w-3 h-3", getColor())} />
        </div>
      </div>
      
      {/* Credit info */}
      <div className="flex items-center justify-between w-full ml-2">
        <div className="flex flex-col items-center">
          <span className="text-xs font-medium">Credits</span>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {usedCredits.toLocaleString()} / {maxCredits.toLocaleString()}
          </div>
          {paygCredits > 0 && (
            <div className="text-[9px] text-blue-600 font-medium">
              +{paygCredits.toLocaleString()} PAYG
            </div>
          )}
        </div>
        <div className="flex flex-col items-end">
          <span className={cn("text-xs font-semibold", getColor())}>
            {Math.round(percentage)}%
          </span>
          {totalAvailableCredits !== subscriptionCreditsRemaining && (
            <span className="text-[9px] text-blue-600 font-medium">
              {totalAvailableCredits.toLocaleString()} total
            </span>
          )}
        </div>
      </div>
    </div>
  )
} 