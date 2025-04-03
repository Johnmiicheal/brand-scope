/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck

"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchResults, AIRanking, SocialInsight } from "@/types/search";
import { motion, AnimatePresence } from "framer-motion";
import { ChartData } from "@/types/search";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { TbScanPosition, TbTextScan2 } from "react-icons/tb";

// Type for brand data
interface Brand {
  id: string;
  name: string;
}

export default function AnalysisPage() {
  const searchParams = useSearchParams();
  const searchId = searchParams.get("search_id");
  const modeId = searchParams.get("mode_id");

  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [brandNames, setBrandNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        let url = "/api/search";

        if (searchId) {
          url += `?search_id=${searchId}`;
        } else if (modeId) {
          url += `?mode_id=${modeId}`;
        } else {
          throw new Error("No search_id or mode_id provided");
        }

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to fetch results");
        }

        const data = await response.json();
        setResults(data);

        // Set initial model selection
        if (data.ai_rankings && data.ai_rankings.length > 0) {
          const models = [
            ...new Set(data.ai_rankings.map((r: AIRanking) => r.llm_name)),
          ];
          if (models[0]) setSelectedModel(models[0]);

          // Get all unique entity_ids that might be UUIDs
          const entityIds = new Set<string>();
          data.ai_rankings.forEach((ranking: AIRanking) => {
            if (ranking.entity_id) entityIds.add(ranking.entity_id);
          });

          // Fetch brand names for these IDs
          const { data: brands, error } = await supabase
            .from("brands")
            .select("id, name")
            .in("id", Array.from(entityIds));

          if (error) {
            console.error("Error fetching brands:", error);
          } else if (brands) {
            // Create a mapping of ID to name
            const nameMap: Record<string, string> = {};
            brands.forEach((brand: Brand) => {
              nameMap[brand.id] = brand.name;
            });
            setBrandNames(nameMap);
          }
        }

        // For Voyager mode, ensure we have social insights
        if (
          data.mode === "Voyager" &&
          (!data.social_insights || data.social_insights.length === 0)
        ) {
          const { data: socialData, error: socialError } = await supabase
            .from("social_insights")
            .select("*")
            .eq("search_id", modeId);

          if (socialError) {
            console.error("Error fetching social insights:", socialError);
          } else if (socialData) {
            const uniqueSocialData = Array.from(
              new Map(
                socialData.map((item) => [item.entity_name, item])
              ).values()
            );
            setResults({
              ...data,
              social_insights: uniqueSocialData,
            });
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [searchId, modeId]);

  // Helper to get entity name
  const getEntityName = (entityId: string): string => {
    // If we have a brand name for this ID, use it
    if (brandNames[entityId]) return brandNames[entityId];
    // Otherwise just use the ID itself (it might be a text name already)
    return entityId;
  };

  // Filter rankings by selected model
  const filteredRankings =
    results?.ai_rankings.filter(
      (r) => !selectedModel || r.llm_name === selectedModel
    ) || [];

  // Check for Voyager mode
  const isVoyagerMode = results?.mode === "Voyager";

  if (loading) {
    return <AnalysisLoadingState />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>No Results</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No analysis results found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto p-4 bg-gradient-to-b from-background to-zinc-900 w-full h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-lg p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-medium">Analysis Results</h1>
              <span className={`px-2 py-1 text-xs rounded-full ${results.mode === "Voyager" ? "bg-orange-500/20 text-orange-400" : results.mode === "DeepFocus" ? "bg-blue-500/20 text-blue-400" : results.mode === "Explorer" ? "bg-green-500/20 text-green-400" : ""}`}>
                {results.mode}
              </span>
            </div>
          </div>

          {results.ai_rankings.length > 0 && (
            <div className="w-[200px]">
              <Select
                value={selectedModel || ""}
                onValueChange={setSelectedModel}
              >
                <SelectTrigger className="bg-transparent border-accent">
                  <SelectValue placeholder="Select Model" />
                </SelectTrigger>
                <SelectContent className="p-1">
                  {[...new Set(results.ai_rankings.map((r) => r.llm_name))].map(
                    (model) => (
                      <SelectItem key={model} value={model as string}>
                        {model}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Tabs defaultValue="rankings" className="w-full ">
          <TabsList className="mb-4  bg-transparent">
            <TabsTrigger
              value="rankings"
              className="data-[state=active]:bg-zinc-700 cursor-pointer"
            >
              <TbTextScan2 className="w-4 h-4" />
              AI Model Insights
            </TabsTrigger>
            {isVoyagerMode &&
              results.social_insights &&
              results.social_insights.length > 0 && (
                <TabsTrigger
                  value="social"
                  className="data-[state=active]:bg-zinc-700 cursor-pointer"
                >
                <TbScanPosition className="w-4 h-4" />
                  Social Insights
                </TabsTrigger>
              )}
            {results.charts && results.charts.length > 0 && (
              <TabsTrigger
                value="trends"
                className="data-[state=active]:bg-zinc-700"
              >
                Trends
              </TabsTrigger>
            )}
            {results.comparisons && results.comparisons.length > 0 && (
              <TabsTrigger
                value="competitors"
                className="data-[state=active]:bg-zinc-700 cursor-pointer"
              >
                Competitor Analysis
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="rankings" className="space-y-4">
            <RankingsTabContent
              rankings={filteredRankings}
              getEntityName={getEntityName}
            />
          </TabsContent>

          {isVoyagerMode &&
            results.social_insights &&
            results.social_insights.length > 0 && (
              <TabsContent value="social" className="space-y-4">
                <SocialInsightsTabContent
                  insights={results.social_insights}
                  getEntityName={getEntityName}
                />
              </TabsContent>
            )}

          {results.charts && results.charts.length > 0 && (
            <TabsContent value="trends" className="space-y-4">
              <TrendsTabContent charts={results.charts} />
            </TabsContent>
          )}

          {results.comparisons && results.comparisons.length > 0 && (
            <TabsContent value="competitors" className="space-y-4">
              <CompetitorsTabContent comparisons={results.comparisons} />
            </TabsContent>
          )}
        </Tabs>
      </motion.div>
    </div>
  );
}

// Loading state component
function AnalysisLoadingState() {
  return (
    <div className="mx-auto p-4 bg-gradient-to-b from-background to-zinc-900 w-full h-full">
      <div className="rounded-lg p-6 border border-accent">
        <div className="mb-6">
          <Skeleton className="h-10 w-[250px] mb-2 bg-zinc-800" />
          <Skeleton className="h-5 w-[150px] bg-zinc-800" />
        </div>

        <div className="space-y-4">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className="bg-zinc-800/50 border-accent">
                <CardHeader>
                  <Skeleton className="h-7 w-[200px] mb-2 bg-zinc-700" />
                  <Skeleton className="h-4 w-full max-w-[300px] bg-zinc-700" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full bg-zinc-700" />
                    <Skeleton className="h-4 w-full bg-zinc-700" />
                    <Skeleton className="h-4 w-3/4 bg-zinc-700" />
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}

// AI Rankings tab content
function RankingsTabContent({
  rankings,
  getEntityName,
}: {
  rankings: AIRanking[];
  getEntityName: (id: string) => string;
}) {
  if (rankings.length === 0) {
    return <p>No ranking data available.</p>;
  }

  // Group by query
  const queriesMap: Record<string, AIRanking[]> = {};
  rankings.forEach((ranking) => {
    if (!queriesMap[ranking.query]) {
      queriesMap[ranking.query] = [];
    }
    queriesMap[ranking.query].push(ranking);
  });

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {Object.entries(queriesMap).map(([query, queryRankings]) => (
        <motion.div key={query} variants={itemVariants}>
          <div className="mb-4">
            <h3 className="text-xl font-bold">&ldquo;{query}&rdquo;</h3>
            <p className="text-sm text-muted-foreground">
              Analysis performed on{" "}
              {new Date(queryRankings[0].analyzed_at).toLocaleString()}
            </p>
          </div>

          <div className="relative overflow-x-auto rounded-md border border-accent">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-zinc-900/50">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Entity
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Rank
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Score
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Model
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Reasoning
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {queryRankings
                    .sort((a, b) => (a.rank || 99) - (b.rank || 99))
                    .map((ranking, idx) => (
                      <motion.tr
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="border-b border-accent hover:bg-zinc-800/20"
                      >
                        <td className="px-6 py-4 font-medium text-white">
                          {getEntityName(ranking.entity_id)}
                        </td>
                        <td className="px-6 py-4">
                          {ranking.entity_type === "brand"
                            ? "Brand"
                            : "Competitor"}
                        </td>
                        <td className="px-6 py-4">{ranking.rank ?? "N/A"}</td>
                        <td className="px-6 py-4">{ranking.score}</td>
                        <td className="px-6 py-4">
                          <Badge className="bg-blue-500/20 text-blue-200 border-blue-500/30">
                            {ranking.llm_name}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 max-w-md">
                          {ranking.reasoning || "N/A"}
                        </td>
                      </motion.tr>
                    ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// Social Insights tab content
function SocialInsightsTabContent({
  insights,
  getEntityName,
}: {
  insights: SocialInsight[];
  getEntityName: (id: string) => string;
}) {
  if (insights.length === 0) {
    return <p>No social insights available.</p>;
  }

  return (
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="relative overflow-x-auto rounded-md border border-accent">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-zinc-900/50">
            <tr>
              <th scope="col" className="px-6 py-3">
                Entity
              </th>
              <th scope="col" className="px-6 py-3">
                Keyword
              </th>
              <th scope="col" className="px-6 py-3">
                Platform
              </th>
              <th scope="col" className="px-6 py-3">
                Mentions
              </th>
              <th scope="col" className="px-6 py-3">
                Sentiment
              </th>
              <th scope="col" className="px-6 py-3">
                Date Collected
              </th>
            </tr>
          </thead>
          <tbody>
            {insights.map((insight, idx) => (
              <motion.tr
                key={idx}
                variants={itemVariants}
                custom={idx}
                className="border-b border-accent hover:bg-zinc-800/20"
              >
                <td className="px-6 py-4 font-medium text-white">
                  {getEntityName(insight.entity_id)}
                </td>
                <td className="px-6 py-4">
                  {insight.keyword ? (
                    <Badge className="bg-zinc-700 text-zinc-300">
                      #{insight.keyword}
                    </Badge>
                  ) : (
                    "N/A"
                  )}
                </td>
                <td className="px-6 py-4">{insight.platform}</td>
                <td className="px-6 py-4">{insight.mention_count}</td>
                <td className="px-6 py-4">
                  <Badge
                    variant={
                      insight.sentiment === "positive"
                        ? "default"
                        : insight.sentiment === "negative"
                        ? "destructive"
                        : "outline"
                    }
                    className={
                      insight.sentiment === "positive"
                        ? "bg-green-500/20 text-green-200 border-green-500/30"
                        : insight.sentiment === "negative"
                        ? "bg-red-500/20 text-red-200 border-red-500/30"
                        : "bg-zinc-500/20 text-zinc-200 border-zinc-500/30"
                    }
                  >
                    {insight.sentiment || "Neutral"}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  {new Date(insight.data_fetched_at).toLocaleString()}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// Trends tab content
function TrendsTabContent({ charts }: { charts: ChartData[] }) {
  if (charts.length === 0) {
    return <p>No trend data available.</p>;
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="relative overflow-x-auto rounded-md border border-accent">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-zinc-900/50">
            <tr>
              <th scope="col" className="px-6 py-3">
                Keyword
              </th>
              <th scope="col" className="px-6 py-3">
                Trend Chart
              </th>
            </tr>
          </thead>
          <tbody>
            {charts.map((chart, idx) => (
              <motion.tr
                key={idx}
                variants={itemVariants}
                custom={idx}
                className="border-b border-accent bg-zinc-800/30 hover:bg-zinc-800/70"
              >
                <td className="px-6 py-4 font-medium text-white">
                  {chart.keyword}
                </td>
                <td className="px-6 py-4">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chart.trend_points}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1F2937",
                            borderColor: "#374151",
                            color: "#E5E7EB",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#60A5FA"
                          strokeWidth={2}
                          activeDot={{ r: 8, fill: "#3B82F6" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// Competitors tab content
function CompetitorsTabContent({
  comparisons,
}: {
  comparisons: Array<{
    competitor: string;
    competitor_id: string;
    ranking_diff: number;
    analysis?: string;
  }>;
}) {
  if (comparisons.length === 0) {
    return <p>No competitor analysis available.</p>;
  }

  return (
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="relative overflow-x-auto rounded-md border border-accent">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-zinc-900/50">
            <tr>
              <th scope="col" className="px-6 py-3">
                Competitor
              </th>
              <th scope="col" className="px-6 py-3">
                Ranking Difference
              </th>
              <th scope="col" className="px-6 py-3">
                Analysis
              </th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((comparison, idx) => (
              <motion.tr
                key={idx}
                variants={itemVariants}
                custom={idx}
                className="border-b border-accent bg-zinc-800/30 hover:bg-zinc-800/70"
              >
                <td className="px-6 py-4 font-medium text-white">
                  {comparison.competitor}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={
                      comparison.ranking_diff > 0
                        ? "text-green-400"
                        : comparison.ranking_diff < 0
                        ? "text-red-400"
                        : "text-zinc-400"
                    }
                  >
                    {comparison.ranking_diff > 0
                      ? `+${comparison.ranking_diff} (better)`
                      : comparison.ranking_diff < 0
                      ? `${comparison.ranking_diff} (worse)`
                      : "0 (equal)"}
                  </span>
                </td>
                <td className="px-6 py-4 max-w-md">
                  {comparison.analysis ? (
                    <div
                      className="text-zinc-400"
                      dangerouslySetInnerHTML={{
                        __html: comparison.analysis.replace(/\n/g, "<br/>"),
                      }}
                    />
                  ) : (
                    "N/A"
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 15,
    },
  },
};
