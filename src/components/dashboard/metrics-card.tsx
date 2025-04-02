/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
"use client"

import { motion } from "framer-motion"
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { BrandMetrics, Competitor } from "@/contexts/brand-data-context"
import { CompetitorChart } from "./competitor-chart"

interface MetricCardProps {
  title: string
  value: string | number
  trend?: number
  trendLabel?: string
  className?: string
  trendTimeframe?: string
}

function MetricCard({
  title,
  value,
  trend,
  trendLabel,
  trendTimeframe = "vs last period",
  className,
}: MetricCardProps) {
  const showTrend = trend !== undefined

  return (
    <motion.div
      className={cn("p-6 bg-card border-r", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-sm text-muted-foreground mb-1">{title}</div>
      <div className="text-2xl font-bold mb-1">{value}</div>

      {showTrend && (
        <div className="flex items-center gap-1.5">
          {trend > 0 ? (
            <div className="flex items-center text-status-positive">
              <ArrowUpRight className="h-4 w-4" />
              <span className="text-xs font-medium">+{Math.abs(trend * 100).toFixed(1)}%</span>
            </div>
          ) : trend < 0 ? (
            <div className="flex items-center text-status-negative">
              <ArrowDownRight className="h-4 w-4" />
              <span className="text-xs font-medium">-{Math.abs(trend * 100).toFixed(1)}%</span>
            </div>
          ) : (
            <div className="flex items-center text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">0%</span>
            </div>
          )}
          {trendLabel ? (
            <span className="text-xs text-muted-foreground">{trendLabel}</span>
          ) : (
            <span className="text-xs text-muted-foreground">{trendTimeframe}</span>
          )}
        </div>
      )}
    </motion.div>
  )
}

interface MetricsHeaderProps {
  metrics: BrandMetrics | null
  competitors: Competitor[]
}

export function MetricsHeader({ metrics, competitors }: MetricsHeaderProps) {
  const visibilityScore = metrics?.visibility_score || 0
  const positive = metrics?.positive_sentiment || 0
  const neutral = metrics?.neutral_sentiment || 0
  const negative = metrics?.negative_sentiment || 0

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border rounded-t-lg overflow-hidden">
        <MetricCard
          title="Visibility Score"
          value={`${Math.round(visibilityScore * 100)}%`}
          trend={0.05}
          className="border-b-4 border-b-[hsl(var(--brand-primary))]"
        />

        <MetricCard
          title="Positive Sentiment"
          value={negative}
          trend={0.04}
        />

        <MetricCard
          title="Neutral Sentiment"
          value={neutral}
          trend={0.25}
          trendLabel="since last week"
        />

        <MetricCard
          title="Sentiment Score"
          value={`${Math.round(positive * 100)}%`}
          trend={-0.02}
          className="border-r-0"
        />
      </div>
      <CompetitorChart competitors={competitors.slice(0, 10)} visibilityScore={visibilityScore} customer_perception={metrics?.consumer_perception!} />
    </div>
  )
}

