import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-destructive bg-destructive/20 text-destructive-foreground hover:bg-destructive/40",
        outline: "text-foreground",
        success: "border-green-500/60 bg-green-400/20 text-green-500 dark:text-green-200 hover:bg-green-400/40",
        warning: "border-yellow-500/60 bg-yellow-500/20 text-yellow-500 dark:text-yellow-200 hover:bg-yellow-500/40",
        info: "border-transparent bg-blue-500 text-blue-500 dark:text-blue-200 hover:bg-blue-500/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants } 