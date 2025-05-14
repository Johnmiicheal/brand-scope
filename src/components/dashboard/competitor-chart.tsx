"use client"

import { Activity } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface Brand {
    brand_name: string;
    total_mentions: number;
}

// Calculate brand merit index based on visibility score and mentions
function calculateBrandMeritIndex(visibilityScore: number, mentions: number): number {
    // Normalize mentions to a 0-1 scale using a logarithmic scale to handle large variations
    const normalizedMentions = Math.log(mentions + 1) / Math.log(1000); // +1 to handle 0 mentions
    
    // Combine visibility score and normalized mentions with weights
    // Visibility has 60% weight, mentions have 40% weight
    const meritIndex = (visibilityScore * 0.6) + (normalizedMentions * 0.4);
    
    // Scale to 0-100 for better visualization
    return Math.round(meritIndex * 100);
}

const chartConfig = {
    brand: {
        label: "Brand",
        color: "hsl(var(--chart-1))",
        icon: Activity,
    },
} satisfies ChartConfig

interface CompetitorChartProps {
    competitors: Brand[];
    selectedBrands: Set<string>
}

export function CompetitorChart({ competitors, selectedBrands }: CompetitorChartProps) {
    // Filter to get only selected brands
    const selectedBrandData = competitors.filter((b) => selectedBrands.has(b.brand_name));
    
    // Calculate total mentions across all competitors for visibility score
    const total_mentions = competitors.reduce((acc, b) => acc + b.total_mentions, 0);

    // Create chart data with visibility scores and mentions for selected brands
    const chartData = selectedBrandData.map(brand => {
      const visibilityScore = brand.total_mentions / total_mentions;
      return {
        name: brand.brand_name,
        mentions: brand.total_mentions,
        index: calculateBrandMeritIndex(visibilityScore, brand.total_mentions)
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
      <div className="rounded-b-lg border p-5 border-t-0 gap-5 flex flex-col bg-background">
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
                dataKey="index"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Area
                dataKey="index"
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
