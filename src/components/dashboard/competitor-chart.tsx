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
import { Competitor } from "@/contexts/brand-data-context"

const chartConfig = {
    brand: {
        label: "Brand",
        color: "hsl(var(--chart-1))",
        icon: Activity,
    },
} satisfies ChartConfig

interface CompetitorChartProps {
    competitors: Competitor[];
    visibilityScore: number;
    customer_perception: string
}

export function CompetitorChart({ competitors, visibilityScore }: CompetitorChartProps) {
    // Calculate brand merit index based on visibility score and ranking differences
    const calculateBrandMeritIndex = (visibilityScore: number, rankingDiff: number) => {
      // Scale visibility score (0-1) to a base value between 100-300
      const baseValue = visibilityScore * 200 + 100;
      
      const modifier = rankingDiff * 50; // this amplifies the effect of ranking differences, basically makes the barchart look clean
      
      return Math.round(baseValue + modifier);
    };
    
    const chartData = competitors?.map(competitor => ({
      competitors: competitor.name,
      index: calculateBrandMeritIndex(visibilityScore, competitor.ranking_diff)
    }));
    
    if (!chartData?.length) {
      return (
        <div className="rounded-b-lg border p-5 border-t-0">
          <p className="text-muted-foreground">No competitor data available</p>
        </div>
      );
    }
    
    return (
      <div className="rounded-b-lg border p-5 border-t-0 gap-5 flex flex-col">
        <CardHeader>
          <CardTitle>Visibility Analysis</CardTitle>
          <CardDescription>
            Showing comparative index for the top 10 competitors
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
                dataKey="competitors"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <YAxis
                dataKey="index"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value}
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
