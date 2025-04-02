"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Check, AlertTriangle, Lightbulb, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface InsightCardProps {
  type: "strength" | "weakness" | "opportunity"
  children: React.ReactNode
}

function InsightCard({ type, children }: InsightCardProps) {
  const icons = {
    strength: <Check className="h-4 w-4 text-green-500" />,
    weakness: <AlertTriangle className="h-4 w-4 text-red-500" />,
    opportunity: <Lightbulb className="h-4 w-4 text-blue-500" />,
  }

  const colors = {
    strength: "border-l-green-500",
    weakness: "border-l-red-500",
    opportunity: "border-l-blue-500",
  }

  return (
    <motion.div
      className={`border-l-4 rounded-md p-3 bg-card ${colors[type]}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ x: 2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5">{icons[type]}</div>
        <div className="text-sm">{children}</div>
      </div>
    </motion.div>
  )
}

interface BrandInsightsProps {
  insights: {
    consumer_perception: string
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
  }
}

export function BrandInsights({ insights }: BrandInsightsProps) {
  return (
    <Card className="bg-transparent">
      <CardHeader>
        <CardTitle>Brand Insights</CardTitle>
        <CardDescription>{insights.consumer_perception}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 bg-transparent">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Strengths</h3>
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              View All <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          <div className="space-y-2">
            {insights.strengths.slice(0, 2).map((strength, i) => (
              <InsightCard key={i} type="strength">
                {strength}
              </InsightCard>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Weaknesses</h3>
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              View All <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          <div className="space-y-2">
            {insights.weaknesses.slice(0, 2).map((weakness, i) => (
              <InsightCard key={i} type="weakness">
                {weakness}
              </InsightCard>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Opportunities</h3>
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              View All <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          <div className="space-y-2">
            {insights.opportunities.slice(0, 2).map((opportunity, i) => (
              <InsightCard key={i} type="opportunity">
                {opportunity}
              </InsightCard>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

