"use client";

import { Activity } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Legend, Tooltip } from "recharts";

import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
} from "@/components/ui/chart";

// Predefined vibrant colors for the chart
const CHART_COLORS = [
  "#3B82F6", // Vivid blue
  "#10B981", // Emerald green
  "#F472B6", // Hot pink
  "#6366F1", // Indigo
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#EF4444", // Red
  "#14B8A6", // Teal
  "#FF6B6B", // Bright coral
  "#4ECDC4", // Bright turquoise
  "#45B7D1", // Bright blue
  "#96CEB4", // Soft green
  "#FFD93D", // Bright yellow
  "#FF8CC6", // Bright pink
  "#6C5CE7", // Bright purple
  "#A8E6CF", // Mint green
  "#FF9F1C", // Bright orange
  "#00D2FC", // Electric blue
  
];

interface BrandAnalysis {
  brand_name: string;
  analysis_date: string;
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
  brandAnalytics: BrandAnalysis[];
  selectedBrands: Set<string>;
}

export function CompetitorChart({
  brandAnalytics,
  selectedBrands,
}: CompetitorChartProps) {
  // Filter to get only selected brands
  const selectedBrandData = brandAnalytics?.filter((b) =>
    selectedBrands.has(b.brand_name)
  );


  const maxModels = 5;

  const getCoverageRatio = (brand: BrandAnalysis, type: "ratio" | "count") => {
    const totalMentionsPerModel =
      (brand.gpt_mentions > 0 ? 1 : 0) +
      (brand.claude_mentions > 0 ? 1 : 0) +
      (brand.perplexity_mentions > 0 ? 1 : 0) +
      (brand.gemini_mentions > 0 ? 1 : 0) +
      (brand.gpt_search_mentions > 0 ? 1 : 0);
    if (type === "ratio") {
      return `${totalMentionsPerModel} / ${maxModels}`;
    } else {
      return (totalMentionsPerModel / maxModels).toFixed(2);
    }
  };

  const getMentionsIndex = (brand: BrandAnalysis, maxMentionsForDate: number) => {
    return brand.total_mentions / maxMentionsForDate;
  };

  // Calculate visibility score for a single brand at a point in time
  const calculateVisibilityScore = (brand: BrandAnalysis, maxMentionsForDate: number) => {
    return (
      (100 *
        (Number(getCoverageRatio(brand, "count")) +
          getMentionsIndex(brand, maxMentionsForDate))) /
      2
    ).toFixed(1);
  };

  // Group data by date and create chart data
  const dates = [...new Set(selectedBrandData.map(b => b.analysis_date))].sort();
  const chartData = dates.map(date => {
    const dataPoint: Record<string, string | number> = { 
      date: new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }) 
    };
    
    // Get all brands for this specific date to calculate maxMentions
    const brandsForThisDate = brandAnalytics.filter(b => b.analysis_date === date);
    const maxMentionsForThisDate = Math.max(
      ...brandsForThisDate.map((brand) => brand.total_mentions),
      1
    );
    
    selectedBrandData
      .filter(b => b.analysis_date === date)
      .forEach(brand => {
        dataPoint[brand.brand_name] = calculateVisibilityScore(brand, maxMentionsForThisDate);
      });
    return dataPoint;
  });

  // Generate unique colors for each brand using predefined colors
  const brandColors = Array.from(selectedBrands).reduce((acc, brand, index) => {
    acc[brand] = CHART_COLORS[index % CHART_COLORS.length];
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="rounded-b-lg border p-5 border-t-0 gap-5 flex flex-col bg-background border-[#e2e2e2]/70 dark:border-accent">
      <CardHeader>
        <CardTitle>Brand Visibility Over Time</CardTitle>
        <CardDescription>
          Tracking visibility trends for selected brands
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <AreaChart
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 20,
              bottom: 20,
            }}
            accessibilityLayer
            stackOffset="expand"
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              style={{
                fontSize: '12px',
                fill: 'var(--muted-foreground)',
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[0, 100]}
              style={{
                fontSize: '12px',
                fill: 'var(--muted-foreground)',
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '12px',
              }}
              itemStyle={{
                color: 'var(--foreground)',
              }}
              labelStyle={{
                color: 'var(--muted-foreground)',
                fontWeight: 500,
                marginBottom: '4px',
              }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{
                paddingBottom: '20px',
              }}
              formatter={(value) => (
                <span style={{ 
                  color: 'var(--foreground)',
                  fontSize: '12px',
                  fontWeight: 500,
                  padding: '4px 8px',
                }}>
                  {value}
                </span>
              )}
            />
            {Array.from(selectedBrands).map((brand) => (
              <Area
                key={brand}
                type="monotone"
                dataKey={brand}
                name={brand}
                stroke={brandColors[brand]}
                fill={brandColors[brand]}
                fillOpacity={0.5}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </div>
  );
}
