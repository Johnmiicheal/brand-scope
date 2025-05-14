"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { CompetitorChart } from "./competitor-chart";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  className?: string;
  trendTimeframe?: string;
}

function MetricCard({
  title,
  value,
  trend,
  trendLabel,
  trendTimeframe = "vs last period",
  className,
}: MetricCardProps) {
  const showTrend = trend !== undefined;

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
              <span className="text-xs font-medium">
                +{Math.abs(trend * 100).toFixed(1)}%
              </span>
            </div>
          ) : trend < 0 ? (
            <div className="flex items-center text-status-negative">
              <ArrowDownRight className="h-4 w-4" />
              <span className="text-xs font-medium">
                -{Math.abs(trend * 100).toFixed(1)}%
              </span>
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
            <span className="text-xs text-muted-foreground">
              {trendTimeframe}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

interface Brand {
  brand_name: string;
  gpt_mentions: number;
  claude_mentions: number;
  perplexity_mentions: number;
  gemini_mentions: number;
  total_mentions: number;
}


interface MetricsHeaderProps {
  brands: Brand[];
  selectedBrand: Set<string>;
}

export function MetricsHeader({ brands, selectedBrand }: MetricsHeaderProps) {
  // Get all selected brands data
  const selectedBrandsData = brands.filter(b => selectedBrand.has(b.brand_name));

  if(!selectedBrandsData.length) return null;

  const all_total_mentions = brands.reduce(
    (acc, brand) => acc + brand.total_mentions,
    0
  );

  const total_mentions = selectedBrandsData.reduce((acc, b) => acc + (b?.total_mentions || 0), 0);
  const visibilityScore = total_mentions / all_total_mentions || 0;
  const mentions = total_mentions || 0;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 border rounded-t-lg overflow-hidden">
        <MetricCard
          title="Visibility Score"
          value={`${Math.round(visibilityScore * 100)}%`}
          trend={0.05}
          className="border-b-4 border-b-[hsl(var(--brand-primary))]"
        />

        {/* <MetricCard title="Detection Rate" value={negative} trend={0.04} /> */}

        <MetricCard 
          title="Mentions" 
          value={mentions} 
          trend={0.04} 
        />

        {/* <MetricCard
          title="Sentiment Score"
          value={`${Math.round(positive * 100)}%`}
          trend={-0.02}
          className="border-r-0"
        /> */}
      </div>
      <CompetitorChart
        competitors={brands}
        selectedBrands={selectedBrand}
      />
    </div>
  );
}
