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
  sonnet_mentions: number;
  perplexity_mentions: number;
  gemini_mentions: number;
  gpt_search_mentions: number;
  ai_overview_mentions: number;
  google_ai_mode_mentions: number;
  deepseek_mentions: number;
  gpt_4_1_mentions: number;
  grok_mentions: number;
  llama_mentions: number;
  gemini_pro_mentions: number;
  deepseek_r1_mentions: number;
  kimi_k2_mentions: number;
  gpt_5_mentions: number;
  grok_4_mentions: number;
  mistral_medium_mentions: number;
  ernie_mentions: number;
  qwen_mentions: number;
}

interface Brand {
  brand_name: string;
  gpt_mentions: number;
  gpt_search_mentions: number;
  claude_mentions: number;
  sonnet_mentions: number;
  perplexity_mentions: number;
  gemini_mentions: number;
  total_mentions: number;
  ai_overview_mentions: number;
  google_ai_mode_mentions: number;
  deepseek_mentions: number;
  gpt_4_1_mentions: number;
  grok_mentions: number;
  llama_mentions: number;
  gemini_pro_mentions: number;
  deepseek_r1_mentions: number;
  kimi_k2_mentions: number;
  gpt_5_mentions: number;
  grok_4_mentions: number;
  mistral_medium_mentions: number;
  ernie_mentions: number;
  qwen_mentions: number;
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
  fullBrandAnalytics: Brand[]
  selectedBrands: Set<string>;
  selectedModel: Set<string>;
}

export function CompetitorChart({
  brandAnalytics,
  selectedBrands,
  selectedModel,
  fullBrandAnalytics
}: CompetitorChartProps) {
    // Get all selected brands data
    const normalizedSelected = new Set(
      Array.from(selectedBrands).map((n) => n.toLowerCase())
    );
    const selectedBrandData = brandAnalytics.filter(
      (b) => normalizedSelected.has(b.brand_name.toLowerCase())
    );


  // Calculate the maximum number of models that successfully analyzed across all brands
  const getMaxActiveModels = () => {
    if (selectedModel.size > 0) {
      // If specific models are selected, use that count
      return selectedModel.size;
    }
    
    // Find the maximum number of models that successfully analyzed across all brands
    const modelCounts = new Set<string>();
    
    fullBrandAnalytics.forEach((brand) => {
      if (brand.claude_mentions > 0) modelCounts.add("Claude 4.0 Sonnet");
      if (brand.sonnet_mentions > 0) modelCounts.add("Claude Sonnet 4");
      if (brand.perplexity_mentions > 0) modelCounts.add("Perplexity Sonar");
      if (brand.gemini_mentions > 0) modelCounts.add("Gemini 2.5 Flash");
      if (brand.gpt_search_mentions > 0) modelCounts.add("GPT 4o Web Search");
      if (brand.ai_overview_mentions > 0) modelCounts.add("Google AI Overview");
      if (brand.google_ai_mode_mentions > 0) modelCounts.add("Google AI Mode");
      if (brand.deepseek_mentions > 0) modelCounts.add("DeepSeek v3");
      if (brand.gpt_4_1_mentions > 0) modelCounts.add("GPT 4.1 Nano");
      if (brand.grok_mentions > 0) modelCounts.add("Grok 3 Mini");
      if (brand.llama_mentions > 0) modelCounts.add("Llama 4 Maverick");
      if (brand.gemini_pro_mentions > 0) modelCounts.add("Gemini Pro 2.5");
      if (brand.deepseek_r1_mentions > 0) modelCounts.add("DeepSeek R1");
      if (brand.kimi_k2_mentions > 0) modelCounts.add("Kimi K2");
      if (brand.gpt_5_mentions > 0) modelCounts.add("GPT 5");
      if (brand.grok_4_mentions > 0) modelCounts.add("Grok 4");
      if (brand.mistral_medium_mentions > 0) modelCounts.add("Mistral Medium");
      if (brand.ernie_mentions > 0) modelCounts.add("Ernie 4.5");
      if (brand.qwen_mentions > 0) modelCounts.add("Qwen 3 235b");
    });
    
    return modelCounts.size;
  };
  
  const maxModels = getMaxActiveModels();

  const getCoverageRatio = (brand: BrandAnalysis, type: "ratio" | "count") => {
    const totalMentionsPerModel =
      (brand.claude_mentions > 0 ? 1 : 0) +
      (brand.sonnet_mentions > 0 ? 1 : 0) +
      (brand.perplexity_mentions > 0 ? 1 : 0) +
      (brand.gemini_mentions > 0 ? 1 : 0) +
      (brand.gpt_search_mentions > 0 ? 1 : 0) +
      (brand.ai_overview_mentions > 0 ? 1 : 0) +
      (brand.google_ai_mode_mentions > 0 ? 1 : 0) +
      (brand.deepseek_mentions > 0 ? 1 : 0) +
      (brand.gpt_4_1_mentions > 0 ? 1 : 0) +
      (brand.grok_mentions > 0 ? 1 : 0) +
      (brand.llama_mentions > 0 ? 1 : 0) +
      (brand.gemini_pro_mentions > 0 ? 1 : 0) +
      (brand.deepseek_r1_mentions > 0 ? 1 : 0) +
      (brand.kimi_k2_mentions > 0 ? 1 : 0) +
      (brand.gpt_5_mentions > 0 ? 1 : 0) +
      (brand.grok_4_mentions > 0 ? 1 : 0) +
      (brand.mistral_medium_mentions > 0 ? 1 : 0) +
      (brand.ernie_mentions > 0 ? 1 : 0) +
      (brand.qwen_mentions > 0 ? 1 : 0);
       // Check selected models and add to total mentions count
    let selectedModelTotalMentions = 0;
    

    if (selectedModel.has("Claude 4.0 Sonnet") && brand.claude_mentions > 0) {
      selectedModelTotalMentions++;
    }
    if (selectedModel.has("Claude Sonnet 4") && brand.sonnet_mentions > 0) {
      selectedModelTotalMentions++;
    }
    if (selectedModel.has("Perplexity Sonar") && brand.perplexity_mentions > 0) {
      selectedModelTotalMentions++;
    }
    if (selectedModel.has("Gemini 2.5 Flash") && brand.gemini_mentions > 0) {
      selectedModelTotalMentions++;
    }
    if (selectedModel.has("GPT 4o Web Search") && brand.gpt_search_mentions > 0) {
      selectedModelTotalMentions++;
    }
    if (selectedModel.has("Google AI Overview") && brand.ai_overview_mentions > 0) {
      selectedModelTotalMentions++;
    }
    if (selectedModel.has("Google AI Mode") && brand.google_ai_mode_mentions > 0) {
      selectedModelTotalMentions++;
    }
    if (selectedModel.has("DeepSeek v3") && brand.deepseek_mentions > 0) {
      selectedModelTotalMentions++;
    }
    if (selectedModel.has("GPT 4.1 Nano") && brand.gpt_4_1_mentions > 0) {
      selectedModelTotalMentions++;
    }
    if (selectedModel.has("Grok 3 Mini") && brand.grok_mentions > 0) {
      selectedModelTotalMentions++;
    }
    if (selectedModel.has("Llama 4 Maverick") && brand.llama_mentions > 0) {
      selectedModelTotalMentions++;
    }
    if (selectedModel.has("Gemini Pro 2.5") && brand.gemini_pro_mentions > 0) {
      selectedModelTotalMentions++;
    }
    if (selectedModel.has("DeepSeek R1") && brand.deepseek_r1_mentions > 0) {
      selectedModelTotalMentions++;
    }   
    if (selectedModel.has("Kimi K2") && brand.kimi_k2_mentions > 0) {
      selectedModelTotalMentions++;
    }
    if (selectedModel.has("GPT 5") && brand.gpt_5_mentions > 0) {
      selectedModelTotalMentions++;
    }
    if (selectedModel.has("Grok 4") && brand.grok_4_mentions > 0) {
      selectedModelTotalMentions++;
    }
    if (selectedModel.has("Mistral Medium") && brand.mistral_medium_mentions > 0) {
      selectedModelTotalMentions++;
    }
    if (selectedModel.has("Ernie 4.5") && brand.ernie_mentions > 0) {
      selectedModelTotalMentions++;
    }
    if (selectedModel.has("Qwen 3 235b") && brand.qwen_mentions > 0) {
      selectedModelTotalMentions++;
    }
      // Use selectedModelTotalMentions when filtering is active
    const finalTotalMentions = selectedModel.size > 0 ? selectedModelTotalMentions : totalMentionsPerModel;
    const finalMaxModels = selectedModel.size > 0 ? selectedModel.size : maxModels;
    if (type === "ratio") {
      return `${finalTotalMentions} / ${finalMaxModels}`;
    } else {
      return (finalTotalMentions / finalMaxModels).toFixed(2);
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
              tickFormatter={(value) => `${value}%`}
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
              formatter={(value, name) => [`${value}%`, name]}
            />
            <Legend
              verticalAlign="top"
              align="left"
              height={20}
              wrapperStyle={{
                paddingBottom: '60px',
              }}
              iconType="square"
              iconSize={10}
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
