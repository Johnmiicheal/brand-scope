"use client";

import { Activity } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface Brand {
  brand_name: string;
  total_mentions: number;
  gpt_mentions: number;
  claude_mentions: number;
  perplexity_mentions: number;
  gemini_mentions: number;
  gpt_search_mentions: number;
}

const chartConfig = {
  brand: {
    label: "Brand",
    color: "hsl(var(--chart-1))",
    icon: Activity,
  },
} satisfies ChartConfig;

interface CompetitorChartProps {
  competitors: Brand[];
  selectedBrands: Set<string>;
}

export function CompetitorChart({
  competitors,
  selectedBrands,
}: CompetitorChartProps) {
  // Filter to get only selected brands
  const selectedBrandData = competitors.filter((b) =>
    selectedBrands.has(b.brand_name)
  );

  // Get max mentions across all competitors for normalization
  const maxMentions = Math.max(
    ...competitors.map((brand) => brand.total_mentions),
    1  // Ensure we never divide by zero
  );
  const maxModels = 5;

  const getCoverageRatio = (brands: Brand[], type: "ratio" | "count") => {
    if (!brands.length) return type === "ratio" ? "⌀ 0 / 0" : 0;

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

    // Calculate the ratio - how many models mentioned the brand out of total possible mentions
    const ratio = totalMentionsPerModel / (maxModels * brands.length);

    if (type === "ratio") {
      return `⌀ ${totalMentionsPerModel} / ${maxModels * brands.length}`;
    } else {
      return Number(ratio.toFixed(2));
    }
  };

  const getMentionsIndex = (brands: Brand[]) => {
    if (!brands.length) return 0;
    
    // Sum up total mentions for all brands
    const totalMentions = brands.reduce(
      (acc, brand) => acc + brand.total_mentions,
      0
    );

    // Return a normalized value between 0 and 1
    return Number((totalMentions / maxMentions).toFixed(2));
  };

  // Create chart data with visibility scores and mentions for selected brands
  const chartData = selectedBrandData.map((brand) => {
    const visibilityScore =
      (100 *
        (Number(getCoverageRatio(selectedBrandData, "count")) +
          getMentionsIndex(selectedBrandData))) /
      2;
    return {
      name: brand.brand_name,
      mentions: brand.total_mentions,
      visibility: visibilityScore,
    };
  });

  if (!chartData?.length) {
    return (
      <div className="rounded-b-lg border p-5 border-t-0">
        <p className="text-muted-foreground">No competitor data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-b-lg border p-5 border-t-0 gap-5 flex flex-col bg-background border-[#e2e2e2]/70 dark:border-accent">
      <CardHeader>
        <CardTitle>Visibility Analysis</CardTitle>
        <CardDescription>
          Showing comparative index for selected brands
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              dataKey="visibility"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Area
              dataKey="visibility"
              type="step"
              fill="var(--color-brand)"
              fillOpacity={0.3}
              stroke="var(--color-brand)"
              strokeWidth={1.2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </div>
  );
}
