/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck


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
import { AiStudio, Claude, DeepSeek, Gemini, Grok, Meta, OpenAI, Perplexity } from "@lobehub/icons";
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
  ai_overview_mentions: number;
  google_ai_mode_mentions: number;
  deepseek_mentions: number;
  gpt_4_1_mentions: number;
  grok_mentions: number;
  llama_mentions: number;
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
  ai_overview_mentions: number;
  google_ai_mode_mentions: number;
  deepseek_mentions: number;
  gpt_4_1_mentions: number;
  grok_mentions: number;
  llama_mentions: number;
}

interface BrandMetricsHeaderProps {
  className?: string;
  brands: Array<Brand[]>;
  temporalBrands: Array<TemporalBrand[]>;
  selectedBrand: Set<string>;
  selectedModel: Set<string>;
}

export function BrandMetricsHeader({
  className,
  brands,
  temporalBrands,
  selectedBrand,
  selectedModel,
}: BrandMetricsHeaderProps) {
  // Calculate metrics for each session and then average them
  const calculateSessionMetrics = (sessionBrands: Brand[], sessionTemporalBrands: TemporalBrand[]) => {
    const selectedBrandsData = sessionBrands.filter((b) =>
      selectedBrand.has(b.brand_name)
    );

    if (selectedBrandsData.length === 0) return null;

    // Calculate metrics for this session
    const maxMentions = Math.max(...sessionBrands.map((brand) => brand.total_mentions));
    
    const getMaxActiveModels = () => {
      if (selectedModel.size > 0) return selectedModel.size;
      
      const modelCounts = new Set<string>();
      sessionBrands.forEach((brand) => {
        if (brand.claude_mentions > 0) modelCounts.add("Claude 4.0 Sonnet");
        if (brand.perplexity_mentions > 0) modelCounts.add("Perplexity Sonar");
        if (brand.gemini_mentions > 0) modelCounts.add("Gemini 2.5 Flash");
        if (brand.gpt_search_mentions > 0) modelCounts.add("GPT 4o Web Search");
        if (brand.ai_overview_mentions > 0) modelCounts.add("Google AI Overview");
        if (brand.google_ai_mode_mentions > 0) modelCounts.add("Google AI Mode");
        if (brand.deepseek_mentions > 0) modelCounts.add("DeepSeek R1");
        if (brand.gpt_4_1_mentions > 0) modelCounts.add("GPT 4.1 Nano");
        if (brand.grok_mentions > 0) modelCounts.add("Grok");
        if (brand.llama_mentions > 0) modelCounts.add("Llama");
      });
      return modelCounts.size;
    };

    const maxModels = getMaxActiveModels();
    
    // Coverage ratio calculation
    const totalMentionsPerModel = selectedBrandsData.reduce((acc, brand) => {
      return acc +
        (brand.claude_mentions > 0 ? 1 : 0) +
        (brand.perplexity_mentions > 0 ? 1 : 0) +
        (brand.gemini_mentions > 0 ? 1 : 0) +
        (brand.gpt_search_mentions > 0 ? 1 : 0) +
        (brand.ai_overview_mentions > 0 ? 1 : 0) +
        (brand.google_ai_mode_mentions > 0 ? 1 : 0) +
        (brand.deepseek_mentions > 0 ? 1 : 0) +
        (brand.gpt_4_1_mentions > 0 ? 1 : 0) +
        (brand.grok_mentions > 0 ? 1 : 0) +
        (brand.llama_mentions > 0 ? 1 : 0);
    }, 0);

    const coverageRatio = totalMentionsPerModel / (maxModels * selectedBrandsData.length);
    
    // Mentions index calculation
    const totalMentions = selectedBrandsData.reduce((acc, brand) => acc + brand.total_mentions, 0);
    const mentionsIndex = totalMentions / maxMentions;
    
    // Visibility score
    const visibilityScore = (100 * (coverageRatio + mentionsIndex)) / 2;

    return {
      visibilityScore,
      coverageRatio: coverageRatio * 100,
      totalMentions,
      selectedBrandsData,
      maxMentions
    };
  };

  // Calculate metrics for each session
  const sessionMetrics = brands.map((sessionBrands, index) => 
    calculateSessionMetrics(sessionBrands, temporalBrands[index] || [])
  ).filter(Boolean);

  if (selectedBrand.has("all") || selectedBrand.size === 0) return null;
  
  if (sessionMetrics.length === 0) {
    return (
      <div className="rounded-lg border p-5 ">
        <p className="text-muted-foreground">
          No brand data available for this filter
        </p>
      </div>
    );
  }

  // Calculate averages across all sessions
  const avgVisibilityScore = sessionMetrics.reduce((sum, metrics) => sum + metrics!.visibilityScore, 0) / sessionMetrics.length;
  const avgCoverageRatio = sessionMetrics.reduce((sum, metrics) => sum + metrics!.coverageRatio, 0) / sessionMetrics.length;
  const avgTotalMentions = sessionMetrics.reduce((sum, metrics) => sum + metrics!.totalMentions, 0) / sessionMetrics.length;

  // Use first session's selected brands data for model display (since all sessions should have similar structure)
  const selectedBrandsData = sessionMetrics[0]?.selectedBrandsData || [];
  const maxMentions = Math.max(...sessionMetrics.map(m => m!.maxMentions));

  // Get unique models with count of brands mentioned by each model
  const getUniqueModelsForSelectedBrands = () => {
    const modelCounts: Record<string, number> = {};

    selectedBrandsData.forEach((brand) => {
      if (brand.gpt_search_mentions > 0) {
        modelCounts["GPT 4o Web Search"] =
          (modelCounts["GPT 4o Web Search"] || 0) + 1;
      }
      if (brand.claude_mentions > 0) {
        modelCounts["Claude 4.0 Sonnet"] =
          (modelCounts["Claude 4.0 Sonnet"] || 0) + 1;
      }
      if (brand.perplexity_mentions > 0) {
        modelCounts["Perplexity Sonar"] =
          (modelCounts["Perplexity Sonar"] || 0) + 1;
      }
      if (brand.gemini_mentions > 0) {
        modelCounts["Gemini 2.5 Flash"] =
          (modelCounts["Gemini 2.5 Flash"] || 0) + 1;
      }
      if (brand.ai_overview_mentions > 0) {
        modelCounts["Google AI Overview"] =
          (modelCounts["Google AI Overview"] || 0) + 1;
      }
      if (brand.google_ai_mode_mentions > 0) {
        modelCounts["Google AI Mode"] =
          (modelCounts["Google AI Mode"] || 0) + 1;
      }
      if (brand.deepseek_mentions > 0) {
        modelCounts["DeepSeek R1"] =
          (modelCounts["DeepSeek R1"] || 0) + 1;
      }
      if (brand.gpt_4_1_mentions > 0) {
        modelCounts["GPT 4.1 Nano"] =
          (modelCounts["GPT 4.1 Nano"] || 0) + 1;
      }
      if (brand.grok_mentions > 0) {
        modelCounts["Grok"] =
          (modelCounts["Grok"] || 0) + 1;
      }
      if (brand.llama_mentions > 0) {
        modelCounts["Llama"] =
          (modelCounts["Llama"] || 0) + 1;
      }
    });

    return Object.entries(modelCounts).map(([modelName, count]) => ({
      name: modelName,
      count,
    }));
  };

  // Model to icon mapping
  const modelIcons: Record<
    string,
    React.ComponentType<{ className?: string }>
  > = {
    "GPT 4o Web Search": OpenAI,
    "Claude 4.0 Sonnet": Claude,
    "Perplexity Sonar": Perplexity,
    "Gemini 2.5 Flash": Gemini,
    "Google AI Overview": Gemini.Color,
    "Google AI Mode": AiStudio.Color,
    "DeepSeek R1": DeepSeek.Color,
    "GPT 4.1 Nano": OpenAI,
    "Grok": Grok,
    "Llama": Meta.Color,
  };

  const activeModels = getUniqueModelsForSelectedBrands();

  // Use averaged values
  const mentions = Math.round(avgTotalMentions);

  // Calculate max models across all sessions
  const getMaxActiveModels = () => {
    if (selectedModel.size > 0) return selectedModel.size;
    
    const allModelCounts = new Set<string>();
    brands.forEach(sessionBrands => {
      sessionBrands.forEach((brand) => {
        if (brand.claude_mentions > 0) allModelCounts.add("Claude 4.0 Sonnet");
        if (brand.perplexity_mentions > 0) allModelCounts.add("Perplexity Sonar");
        if (brand.gemini_mentions > 0) allModelCounts.add("Gemini 2.5 Flash");
        if (brand.gpt_search_mentions > 0) allModelCounts.add("GPT 4o Web Search");
        if (brand.ai_overview_mentions > 0) allModelCounts.add("Google AI Overview");
        if (brand.google_ai_mode_mentions > 0) allModelCounts.add("Google AI Mode");
        if (brand.deepseek_mentions > 0) allModelCounts.add("DeepSeek R1");
        if (brand.gpt_4_1_mentions > 0) allModelCounts.add("GPT 4.1 Nano");
        if (brand.grok_mentions > 0) allModelCounts.add("Grok");
        if (brand.llama_mentions > 0) allModelCounts.add("Llama");
      });
    });
    return allModelCounts.size;
  };

  const maxModels = getMaxActiveModels();
  // Use the pre-calculated averaged values instead of recalculating
  const getCoverageRatio = (type: "ratio" | "count") => {
    if (type === "ratio") {
      return `⌀ ${(avgCoverageRatio / 100 * maxModels * selectedBrandsData.length).toFixed(0)} / ${maxModels * selectedBrandsData.length}`;
    } else {
      return (avgCoverageRatio / 100).toFixed(2);
    }
  };
  
  const getMentionsIndex = () => {
    return avgTotalMentions / maxMentions;
  };

  // Calculate visibility trend from previous analysis date (using flattened temporal data)
  const getVisibilityTrend = () => {
    if (
      selectedBrand.has("all") ||
      selectedBrand.size === 0 ||
      temporalBrands.length === 0
    ) {
      return undefined;
    }

    // Flatten temporal data and filter for selected brands
    const selectedBrandNames = Array.from(selectedBrand);
    const flatTemporalBrands = temporalBrands.flat();
    const relevantData = flatTemporalBrands
      .filter((brand) => selectedBrandNames.includes(brand.brand_name))
      .sort(
        (a, b) =>
          new Date(a.analysis_date).getTime() -
          new Date(b.analysis_date).getTime()
      );

    if (relevantData.length === 0) return undefined;

    // Group by analysis_date
    const dataByDate = relevantData.reduce((acc, brand) => {
      if (!acc[brand.analysis_date]) {
        acc[brand.analysis_date] = [];
      }
      acc[brand.analysis_date].push(brand);
      return acc;
    }, {} as Record<string, TemporalBrand[]>);

    const dates = Object.keys(dataByDate).sort();
    if (dates.length < 2) return undefined;

    // Get current (latest) and previous date data
    const currentDate = dates[dates.length - 1];
    const previousDate = dates[dates.length - 2];

    const currentData = dataByDate[currentDate];
    const previousData = dataByDate[previousDate];

    // Calculate visibility scores for both periods
    const calculateVisibilityScore = (brandsData: TemporalBrand[]) => {
      const maxMentions = Math.max(
        ...temporalBrands.map((b) => b.total_mentions)
      );
      // Calculate the maximum number of models that successfully analyzed across all brands
      const getMaxActiveModels = () => {
        if (selectedModel.size > 0) {
          // If specific models are selected, use that count
          return selectedModel.size;
        }

        // Find the maximum number of models that successfully analyzed across all brands
        const modelCounts = new Set<string>();

        brands.forEach((brand) => {
          if (brand.claude_mentions > 0) modelCounts.add("Claude 4.0 Sonnet");
          if (brand.perplexity_mentions > 0)
            modelCounts.add("Perplexity Sonar");
          if (brand.gemini_mentions > 0) modelCounts.add("Gemini 2.5 Flash");
          if (brand.gpt_search_mentions > 0)
            modelCounts.add("GPT 4o Web Search");
          if (brand.ai_overview_mentions > 0)
            modelCounts.add("Google AI Overview");
          if (brand.google_ai_mode_mentions > 0)
            modelCounts.add("Google AI Mode");
          if (brand.deepseek_mentions > 0)
            modelCounts.add("DeepSeek R1");
          if (brand.gpt_4_1_mentions > 0)
            modelCounts.add("GPT 4.1 Nano");
          if (brand.grok_mentions > 0)
            modelCounts.add("Grok");
          if (brand.llama_mentions > 0)
            modelCounts.add("Llama");
        });

        return modelCounts.size;
      };

      const maxModels = getMaxActiveModels();

      const totalMentionsPerModel = brandsData.reduce((acc, brand) => {
        return (
          acc +
          (brand.claude_mentions > 0 ? 1 : 0) +
          (brand.perplexity_mentions > 0 ? 1 : 0) +
          (brand.gemini_mentions > 0 ? 1 : 0) +
          (brand.gpt_search_mentions > 0 ? 1 : 0) +
          (brand.ai_overview_mentions > 0 ? 1 : 0) +
          (brand.google_ai_mode_mentions > 0 ? 1 : 0) +
          (brand.deepseek_mentions > 0 ? 1 : 0) +
          (brand.gpt_4_1_mentions > 0 ? 1 : 0) +
          (brand.grok_mentions > 0 ? 1 : 0) +
          (brand.llama_mentions > 0 ? 1 : 0)
        );
      }, 0);

      // When models are selected, only count mentions from those specific models
      let finalTotalMentions = totalMentionsPerModel;
      let finalMaxModels = maxModels;

      if (selectedModel.size > 0) {
        finalTotalMentions = brandsData.reduce((acc, brand) => {
          let brandModelCount = 0;

          if (
            selectedModel.has("Claude 4.0 Sonnet") &&
            brand.claude_mentions > 0
          ) {
            brandModelCount++;
          }
          if (
            selectedModel.has("Perplexity Sonar") &&
            brand.perplexity_mentions > 0
          ) {
            brandModelCount++;
          }
          if (
            selectedModel.has("Gemini 2.5 Flash") &&
            brand.gemini_mentions > 0
          ) {
            brandModelCount++;
          }
          if (
            selectedModel.has("GPT 4o Web Search") &&
            brand.gpt_search_mentions > 0
          ) {
            brandModelCount++;
          }
          if (
            selectedModel.has("Google AI Overview") &&
            brand.ai_overview_mentions > 0
          ) {
            brandModelCount++;
          }
          if (
            selectedModel.has("Google AI Mode") &&
            brand.google_ai_mode_mentions > 0
          ) {
            brandModelCount++;
          }
          if (
            selectedModel.has("DeepSeek R1") &&
            brand.deepseek_mentions > 0
          ) {
            brandModelCount++;
          }
          if (
            selectedModel.has("GPT 4.1 Nano") &&
            brand.gpt_4_1_mentions > 0
          ) {
            brandModelCount++;
          }
          if (
            selectedModel.has("Grok") &&
            brand.grok_mentions > 0
          ) {
            brandModelCount++;
          }
          if (
            selectedModel.has("Llama") &&
            brand.llama_mentions > 0
          ) {
            brandModelCount++;
          }
            return acc + brandModelCount;
        }, 0);

        finalMaxModels = selectedModel.size;
      }

      const coverageRatio =
        finalTotalMentions / (finalMaxModels * brandsData.length);
      const totalMentions = brandsData.reduce(
        (acc, brand) => acc + brand.total_mentions,
        0
      );
      const mentionsIndex = totalMentions / maxMentions;

      return (100 * (coverageRatio + mentionsIndex)) / 2;
    };

    const currentScore = calculateVisibilityScore(currentData);
    const previousScore = calculateVisibilityScore(previousData);

    if (previousScore === 0) return undefined;

    return (currentScore - previousScore) / previousScore;
  };

  const visibilityTrend = getVisibilityTrend();

  // Calculate coverage ratio trend
  const getCoverageRatioTrend = () => {
    if (
      selectedBrand.has("all") ||
      selectedBrand.size === 0 ||
      temporalBrands.length === 0
    ) {
      return undefined;
    }

    const selectedBrandNames = Array.from(selectedBrand);
    const flatTemporalBrands = temporalBrands.flat();
    const relevantData = flatTemporalBrands
      .filter((brand) => selectedBrandNames.includes(brand.brand_name))
      .sort(
        (a, b) =>
          new Date(a.analysis_date).getTime() -
          new Date(b.analysis_date).getTime()
      );

    if (relevantData.length === 0) return undefined;

    const dataByDate = relevantData.reduce((acc, brand) => {
      if (!acc[brand.analysis_date]) {
        acc[brand.analysis_date] = [];
      }
      acc[brand.analysis_date].push(brand);
      return acc;
    }, {} as Record<string, TemporalBrand[]>);

    const dates = Object.keys(dataByDate).sort();
    if (dates.length < 2) return undefined;

    const currentDate = dates[dates.length - 1];
    const previousDate = dates[dates.length - 2];

    const currentData = dataByDate[currentDate];
    const previousData = dataByDate[previousDate];

    const calculateCoverageRatio = (brandsData: TemporalBrand[]) => {
      // Calculate the maximum number of models that successfully analyzed across all brands
      const getMaxActiveModels = () => {
        if (selectedModel.size > 0) {
          // If specific models are selected, use that count
          return selectedModel.size;
        }

        // Find the maximum number of models that successfully analyzed across all brands
        const modelCounts = new Set<string>();

        brands.forEach((brand) => {
          if (brand.claude_mentions > 0) modelCounts.add("Claude 4.0 Sonnet");
          if (brand.perplexity_mentions > 0)
            modelCounts.add("Perplexity Sonar");
          if (brand.gemini_mentions > 0) modelCounts.add("Gemini 2.5 Flash");
          if (brand.gpt_search_mentions > 0)
            modelCounts.add("GPT 4o Web Search");
          if (brand.ai_overview_mentions > 0)
            modelCounts.add("Google AI Overview");
          if (brand.google_ai_mode_mentions > 0)
            modelCounts.add("Google AI Mode");
          if (brand.deepseek_mentions > 0)
            modelCounts.add("DeepSeek R1");
          if (brand.gpt_4_1_mentions > 0)
            modelCounts.add("GPT 4.1 Nano");
          if (brand.grok_mentions > 0)
            modelCounts.add("Grok");
          if (brand.llama_mentions > 0)
            modelCounts.add("Llama");
        });

        return modelCounts.size;
      };

      const maxModels = getMaxActiveModels();
      const totalMentionsPerModel = brandsData.reduce((acc, brand) => {
        return (
          acc +
          (brand.claude_mentions > 0 ? 1 : 0) +
          (brand.perplexity_mentions > 0 ? 1 : 0) +
          (brand.gemini_mentions > 0 ? 1 : 0) +
          (brand.gpt_search_mentions > 0 ? 1 : 0) +
          (brand.ai_overview_mentions > 0 ? 1 : 0) +
          (brand.google_ai_mode_mentions > 0 ? 1 : 0) +
          (brand.deepseek_mentions > 0 ? 1 : 0) +
          (brand.gpt_4_1_mentions > 0 ? 1 : 0) +
          (brand.grok_mentions > 0 ? 1 : 0)
        );
      }, 0);

      // When models are selected, only count mentions from those specific models
      let finalTotalMentions = totalMentionsPerModel;
      let finalMaxModels = maxModels;

      if (selectedModel.size > 0) {
        finalTotalMentions = brandsData.reduce((acc, brand) => {
          let brandModelCount = 0;
          if (
            selectedModel.has("Claude 4.0 Sonnet") &&
            brand.claude_mentions > 0
          ) {
            brandModelCount++;
          }
          if (
            selectedModel.has("Perplexity Sonar") &&
            brand.perplexity_mentions > 0
          ) {
            brandModelCount++;
          }
          if (
            selectedModel.has("Gemini 2.5 Flash") &&
            brand.gemini_mentions > 0
          ) {
            brandModelCount++;
          }
          if (
            selectedModel.has("GPT 4o Web Search") &&
            brand.gpt_search_mentions > 0
          ) {
            brandModelCount++;
          }
          if (
            selectedModel.has("Google AI Overview") &&
            brand.ai_overview_mentions > 0
          ) {
            brandModelCount++;
          }
          if (
            selectedModel.has("Google AI Mode") &&
            brand.google_ai_mode_mentions > 0
          ) {
            brandModelCount++;
          }
          if (
            selectedModel.has("DeepSeek R1") &&
            brand.deepseek_mentions > 0
          ) {
            brandModelCount++;
          }
          if (
            selectedModel.has("GPT 4.1 Nano") &&
            brand.gpt_4_1_mentions > 0
          ) {
            brandModelCount++;
          }
          if (
            selectedModel.has("Grok") &&
            brand.grok_mentions > 0
          ) {
            brandModelCount++;
          }
          if (
            selectedModel.has("Llama") &&
            brand.llama_mentions > 0
          ) {
            brandModelCount++;
          }
            return acc + brandModelCount;
        }, 0);

        finalMaxModels = selectedModel.size;
      }

      return (finalTotalMentions / (finalMaxModels * brandsData.length)) * 100;
    };

    const currentRatio = calculateCoverageRatio(currentData);
    const previousRatio = calculateCoverageRatio(previousData);

    if (previousRatio === 0) return undefined;

    return (currentRatio - previousRatio) / previousRatio;
  };

  // Calculate mentions trend
  const getMentionsTrend = () => {
    if (
      selectedBrand.has("all") ||
      selectedBrand.size === 0 ||
      temporalBrands.length === 0
    ) {
      return undefined;
    }

    const selectedBrandNames = Array.from(selectedBrand);
    const flatTemporalBrands = temporalBrands.flat();
    const relevantData = flatTemporalBrands
      .filter((brand) => selectedBrandNames.includes(brand.brand_name))
      .sort(
        (a, b) =>
          new Date(a.analysis_date).getTime() -
          new Date(b.analysis_date).getTime()
      );

    if (relevantData.length === 0) return undefined;

    const dataByDate = relevantData.reduce((acc, brand) => {
      if (!acc[brand.analysis_date]) {
        acc[brand.analysis_date] = [];
      }
      acc[brand.analysis_date].push(brand);
      return acc;
    }, {} as Record<string, TemporalBrand[]>);

    const dates = Object.keys(dataByDate).sort();
    if (dates.length < 2) return undefined;

    const currentDate = dates[dates.length - 1];
    const previousDate = dates[dates.length - 2];

    const currentData = dataByDate[currentDate];
    const previousData = dataByDate[previousDate];

    const calculateTotalMentions = (brandsData: TemporalBrand[]) => {
      return brandsData.reduce((acc, brand) => acc + brand.total_mentions, 0);
    };

    const currentMentions = calculateTotalMentions(currentData);
    const previousMentions = calculateTotalMentions(previousData);

    if (previousMentions === 0) return undefined;

    return (currentMentions - previousMentions) / previousMentions;
  };

  const coverageRatioTrend = getCoverageRatioTrend();
  const mentionsTrend = getMentionsTrend();

  return (
      <div className={`${className}  w-full`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 border rounded-t-lg overflow-hidden dark:border-accent border-[#e2e2e2]/70">
        <MetricCard
          title="Visibility Score"
          value={`${avgVisibilityScore.toFixed(1)}%`}
          trend={visibilityTrend}
          trendLabel="vs previous analysis"
          className="border-b-4 !border-b-blue-500"
          tooltipLabel="The visibility score is a measure of how visible an entity is in the summaries. It is calculated by taking the average of the coverage ratio for each brand and the mentions index across all monitored sessions."
        />

        <MetricCard
          title="Coverage Ratio"
          value={`${avgCoverageRatio.toFixed(1)}%`}
          trend={coverageRatioTrend}
          trendLabel="vs previous analysis"
          tooltipLabel="The coverage ratio is a measure of how many models mentioned the entity in the summaries, averaged across all monitored sessions."
        />

        <MetricCard
          title="Mentions"
          value={mentions}
          trend={mentionsTrend}
          trendLabel="vs previous analysis"
          tooltipLabel="The mentions are the number of times each entity was mentioned in the summaries. It is calculated by taking the sum of the total mentions for each brand."
        />

        <motion.div
          className={cn(
            "p-6 bg-card/5 border-r border-[#e2e2e2]/70 dark:border-accent col-span-2"
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
            Listed in Models
          </div>
          <div className="flex flex-wrap gap-2">
            {activeModels.map((model) => {
              const IconComponent = modelIcons[model.name];
              return (
                <div
                  key={model.name}
                  className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1"
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="text-xs font-medium">
                    {model.name}
                    {model.count > 1 && (
                      <span className="ml-1 text-blue-500 font-semibold">
                        +{model.count}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
            {activeModels.length === 0 && (
              <span className="text-sm text-muted-foreground">
                No models found
              </span>
            )}
          </div>
        </motion.div>
      </div>

      <CompetitorChart
        selectedModel={selectedModel}
        brandAnalytics={temporalBrands.flat()}
        fullBrandAnalytics={brands.flat()}
        selectedBrands={selectedBrand}
      />
    </div>
  );
}
