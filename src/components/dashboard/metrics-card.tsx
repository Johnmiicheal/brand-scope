"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { CompetitorChart } from "./competitor-chart";
import {
  Tooltip,
  TooltipTrigger,
  TooltipProvider,
  TooltipContent,
} from "@/components/ui/tooltip";
interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  className?: string;
  trendTimeframe?: string;
  tooltipLabel?: string;
}

function MetricCard({
  title,
  value,
  trend,
  trendLabel,
  trendTimeframe = "vs last period",
  className,
  tooltipLabel,
}: MetricCardProps) {
  const showTrend = trend !== undefined;

  return (
    <motion.div
      className={cn(
        "p-6 bg-card/5 border-r border-[#e2e2e2]/70 dark:border-accent",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
        {title}{" "}
        {tooltipLabel && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm w-full">
                {tooltipLabel}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
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

interface TemporalBrand {
  brand_name: string;
  analysis_date: string;
  gpt_mentions: number;
  gpt_search_mentions: number;
  claude_mentions: number;
  perplexity_mentions: number;
  gemini_mentions: number;
  total_mentions: number;
}

interface MetricsHeaderProps {
  brands: Brand[];
  temporalBrands: TemporalBrand[];
  selectedBrand: Set<string>; 
  selectedModel: Set<string>
}

export function MetricsHeader({
  brands,
  temporalBrands,
  selectedBrand,
  selectedModel
}: MetricsHeaderProps) {
  // Get all selected brands data
  const selectedBrandsData = brands.filter((b) =>
    selectedBrand.has(b.brand_name)
  );

  if(selectedBrand.has("all") || selectedBrand.size === 0) return null


  if (!selectedBrand.has("all") && selectedBrandsData.length === 0) {
    return (
      <div className="rounded-lg border p-5 ">
        <p className="text-muted-foreground">No brand data available for this filter</p>
      </div>
    );
  }



  const total_mentions = selectedBrandsData.reduce(
    (acc, b) => acc + (b?.total_mentions || 0),
    0
  );
  // const visibilityScore = total_mentions / all_total_mentions || 0;
  const mentions = total_mentions || 0;
  const maxModels = selectedModel.size === 0 ? 5 : selectedModel.size;
  const maxMentions = Math.max(...brands.map((brand) => brand.total_mentions));
  const getCoverageRatio = (brands: Brand[], type: "ratio" | "count") => {
    const totalMentionsPerModel = brands.reduce((acc, brand) => {
      return (
        acc +
        (brand.gpt_mentions > 0 ? 1 : 0) +
        (brand.claude_mentions > 0 ? 1 : 0) +
        (brand.perplexity_mentions > 0 ? 1 : 0) +
        (brand.gemini_mentions > 0 ? 1 : 0) +
        (brand.gpt_search_mentions > 0 ? 1 : 0)
      );
    }, 0);
    if (type === "ratio") {
      return `⌀ ${totalMentionsPerModel} / ${maxModels * brands.length}`;
    } else {
      return (totalMentionsPerModel / (maxModels * brands.length)).toFixed(2);
    }
  };
  const getMentionsIndex = (brands: Brand[]) => {
    const totalMentions = brands.reduce(
      (acc, brand) => acc + brand.total_mentions,
      0
    );
    return totalMentions / maxMentions;
  };

  return (
    <div className="max-w-2/3 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 border rounded-t-lg overflow-hidden dark:border-accent border-[#e2e2e2]/70">
        <MetricCard
          title="Visibility Score"
          value={`${(
            (100 *
              (Number(getCoverageRatio(selectedBrandsData, "count")) +
                getMentionsIndex(selectedBrandsData))) /
            2
          ).toFixed(1)}%`}
          className="border-b-4 !border-b-blue-500"
          tooltipLabel="The visibility score is a measure of how visible an entity is in the summaries. It is calculated by taking the average of the coverage ratio for each brand and the mentions index."
        />

        <MetricCard
          title="Coverage Ratio"
          value={`${(
            Number(getCoverageRatio(selectedBrandsData, "count")) * 100
          ).toFixed(1)}%`}
          tooltipLabel="The coverage ratio is a measure of how many models mentioned the entity in the summaries."
        />

        <MetricCard
          title="Mentions"
          value={mentions}
          tooltipLabel="The mentions are the number of times each entity was mentioned in the summaries. It is calculated by taking the sum of the total mentions for each brand."
        />
      </div>

      <CompetitorChart
        selectedModel={selectedModel}
        brandAnalytics={temporalBrands}
        selectedBrands={selectedBrand}
      />
    </div>
  );
}
