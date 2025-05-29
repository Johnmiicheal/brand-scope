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
      className={cn("p-6 bg-card/5 border-r border-[#e2e2e2]/70 dark:border-accent", className)}
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
  gpt_search_mentions: number;
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
  const maxModels = 5;
  const getCoverageRatio = (brands: Brand[]) => {
    const totalMentionsPerModel = brands.reduce((acc, brand) => {
      return acc + (brand.gpt_mentions > 0 ? 1 : 0) + 
                  (brand.claude_mentions > 0 ? 1 : 0) + 
                  (brand.perplexity_mentions > 0 ? 1 : 0) + 
                  (brand.gemini_mentions > 0 ? 1 : 0);
    }, 0);
    return `⌀ ${(totalMentionsPerModel / (maxModels * brands.length)).toFixed(2)}`;
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 border rounded-t-lg overflow-hidden dark:border-accent border-[#e2e2e2]/70">
        <MetricCard
          title="Visibility Score"
          value={`${Math.round(visibilityScore * 100)}%`}
          className="border-b-4 !border-b-blue-500"
        />

        <MetricCard title="Coverage Ratio" value={getCoverageRatio(selectedBrandsData)} />

        <MetricCard 
          title="Mentions" 
          value={mentions} 
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
