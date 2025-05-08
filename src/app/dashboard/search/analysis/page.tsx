/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/ban-ts-comment */

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
import {
  SearchResults,
  AIRanking,
  SocialInsight,
  Summary,
} from "@/types/search";
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
import {
  TbAt,
  TbScanPosition,
  TbSearch,
  TbSparkles,
  TbTableSpark,
  TbTextScan2,
} from "react-icons/tb";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from "react-markdown";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Claude, Gemini, OpenAI, Perplexity } from "@lobehub/icons";
import { GoogleResults } from "@/components/ui/google-results";

// Type for brand data
interface Brand {
  id: string;
  name: string;
}

export default function AnalysisPage() {
  const searchParams = useSearchParams();
  const searchId = searchParams.get("search_id");
  const modeId = searchParams.get("mode_id");
  const { session } = useAuth();
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

        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session}`,
          },
        });

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
          if (models[0]) setSelectedModel(models[0] as string);

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
          data.mode === "Explorer" &&
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
    results?.ai_rankings?.filter(
      (r) => !selectedModel || r.llm_name === selectedModel
    ) || [];

  const filteredSummary =
    results?.summary?.find(
      (s) => !selectedModel || s.model === selectedModel
    ) || null;
  // console.log(filteredSummary)

  // Check for Voyager mode
  const isVoyagerMode = results?.mode === "Voyager";
  const isExplorerMode = results?.mode === "Explorer";

  const safeParseJSON = (
    str: string | null,
    fallback: string | null = null
  ) => {
    try {
      // Check if str is a string and not empty
      if (typeof str === "string" && str.trim() !== "") {
        return JSON.parse(str);
      }
      // If str is already an object, return it
      if (typeof str === "object" && str !== null) {
        return str;
      }
      return fallback;
    } catch (error) {
      console.error("Error parsing JSON:", error, "Input:", str);
      return fallback;
    }
  };

  const firstLevelLinks = (results?.social_insights || [])
    .map(
      (item) =>
        (item?.links || [])
          .map((link) => safeParseJSON(link, link))
          .filter((link) => link !== "" && link != null) // Exclude empty strings and null
    )
    .flat();

  const sourcesLinks = firstLevelLinks.slice(0, 15);

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

  const faviconUrls = sourcesLinks
    .map((link) => link?.favicon || null)
    .filter((favicon) => favicon !== null)
    .join(", ");

  return (
    <div className="mx-auto p-2 sm:p-4 w-full h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-lg p-3 sm:p-6 w-full"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 w-full gap-3 sm:gap-0">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-medium">
                Analysis Results
              </h1>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  results.mode === "Voyager"
                    ? "bg-orange-500/20 text-orange-400"
                    : results.mode === "Explorer"
                    ? "bg-green-500/20 text-green-400"
                    : ""
                }`}
              >
                {results.mode}
              </span>
            </div>
          </div>

          {results.ai_rankings.length > 0 && (
            <div className="w-full sm:w-[200px]">
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

        <Tabs defaultValue="rankings" className="w-full">
          <div className="flex flex-col sm:flex-row w-full justify-between items-start sm:items-center gap-3 sm:gap-0">
            <TabsList className="mb-4 bg-transparent overflow-x-auto w-full sm:w-auto pb-1 flex justify-start">
              <TabsTrigger
                value="rankings"
                className="data-[state=active]:bg-zinc-700 cursor-pointer whitespace-nowrap"
              >
                <TbTableSpark className="w-4 h-4 mr-1 hidden sm:inline" />
                AI Ranking
              </TabsTrigger>

              <TabsTrigger
                value="summary"
                className="data-[state=active]:bg-zinc-700 cursor-pointer whitespace-nowrap"
              >
                <TbSparkles className="w-4 h-4 mr-1 hidden sm:inline" />
                AI Response
              </TabsTrigger>

              <TabsTrigger
                value="searches"
                className="data-[state=active]:bg-zinc-700 cursor-pointer whitespace-nowrap"
              >
                <TbSearch className="w-4 h-4 mr-1 hidden sm:inline" />
                Google Search
              </TabsTrigger>
            </TabsList>

            {(isExplorerMode || isVoyagerMode) && (
              <Sheet>
                <SheetTrigger asChild>
                  <div className="bg-zinc-900 border text-muted-foreground inline-flex h-8 w-fit items-center justify-center rounded-lg py-1 px-3 text-xs gap-2 cursor-pointer">
                    <div className="flex -space-x-2 overflow-hidden p-1">
                      {faviconUrls
                        ?.split(",")
                        .slice(0, 4)
                        .map(
                          (
                            iconUrl,
                            index // Show max 4 icons
                          ) => (
                            <img
                              key={index}
                              className="inline-block h-5 w-5 rounded-full ring-2 ring-white dark:ring-gray-800 bg-zinc-900"
                              src={iconUrl}
                              alt={`Favicon ${index + 1}`}
                              // Add error handling for broken image links
                              onError={(e) => {
                                // Replace with a placeholder or hide the image on error
                                const imgElement =
                                  e.currentTarget as HTMLImageElement;
                                imgElement.src =
                                  "https://placehold.co/24x24/cccccc/ffffff?text=?";
                                imgElement.onerror = null; // Prevent infinite loop if placeholder fails
                              }}
                            />
                          )
                        )}
                      {faviconUrls?.split(",").length > 4 && (
                        <span className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-200 text-xs font-medium text-gray-500 ring-2 ring-white dark:ring-gray-800 dark:bg-gray-700 dark:text-gray-400">
                          +{faviconUrls?.split(",").length - 4}
                        </span>
                      )}
                    </div>
                    Sources
                  </div>
                </SheetTrigger>
                <SheetContent className="sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle className="text-2xl font-bold">
                      Citation Sources
                    </SheetTitle>
                    <SheetDescription className="text-white/60">
                      View citations used in our analysis.
                    </SheetDescription>
                  </SheetHeader>
                  <ScrollArea className="px-2 sm:px-4 h-[90%] w-full space-y-4">
                    {sourcesLinks?.length === 0 ? (
                      <p className="text-gray-500 text-center">
                        No insights available.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {sourcesLinks?.map((insight, index) => (
                          <div
                            key={index}
                            className="w-full cursor-pointer group hover:bg-neutral-800 rounded-md p-3"
                            onClick={() => window.open(insight.url, "_blank")}
                          >
                            <p className="text-white/80 font-semibold text-sm sm:text-base">
                              {insight?.title}
                            </p>
                            <p
                              className="text-white/60 font-regular text-xs sm:text-sm"
                              style={{
                                WebkitLineClamp: "3",
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                display: "-webkit-box",
                              }}
                            >
                              {insight?.summary}
                            </p>
                            <div className="flex gap-2 items-center mt-3">
                              <img
                                src={insight?.favicon}
                                alt={"favicon"}
                                className="rounded-md w-4 h-4 sm:w-5 sm:h-5"
                              />
                              <p className="text-xs">
                                {new URL(insight?.id).hostname || "No Hostname"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            )}
          </div>

          <TabsContent value="rankings" className="space-y-4">
            <RankingsTabContent
              rankings={filteredRankings}
              getEntityName={getEntityName}
            />
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <SummaryTabContent item={filteredSummary} />
          </TabsContent>

          <TabsContent value="searches" className="space-y-4">
            <GoogleResults googleResults={results?.search_results[0]?.results} rankings={results?.search_results[0]?.rankings} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

// Loading state component
function AnalysisLoadingState() {
  return (
    <div className="mx-auto p-2 sm:p-4 w-full h-full">
      <div className="rounded-lg p-3 sm:p-6 border border-accent">
        <div className="mb-4 sm:mb-6">
          <Skeleton className="h-8 sm:h-10 w-[180px] sm:w-[250px] mb-2 bg-zinc-800" />
          <Skeleton className="h-4 sm:h-5 w-[120px] sm:w-[150px] bg-zinc-800" />
        </div>

        <div className="space-y-4">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className="bg-zinc-800/50 border-accent">
                <CardHeader>
                  <Skeleton className="h-6 sm:h-7 w-[150px] sm:w-[200px] mb-2 bg-zinc-700" />
                  <Skeleton className="h-3 sm:h-4 w-full max-w-[250px] sm:max-w-[300px] bg-zinc-700" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-3 sm:h-4 w-full bg-zinc-700" />
                    <Skeleton className="h-3 sm:h-4 w-full bg-zinc-700" />
                    <Skeleton className="h-3 sm:h-4 w-3/4 bg-zinc-700" />
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
      className="space-y-4 sm:space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {Object.entries(queriesMap).map(([query, queryRankings]) => (
        <motion.div key={query} variants={itemVariants}>
          <div className="mb-3 sm:mb-4">
            <h3 className="text-lg sm:text-xl font-bold break-words">
              &ldquo;{query}&rdquo;
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Analysis performed on{" "}
              {new Date(queryRankings[0].analyzed_at).toLocaleString()}
            </p>
          </div>

          {/* Responsive Container: Table for md+ screens, Cards for smaller screens */}
          <div className="relative overflow-hidden rounded-md border border-accent">
            {/* Table for Medium screens and up */}
            <table className="hidden w-full text-xs text-left md:table sm:text-sm">
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
                    Sentiment
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
                        key={`${ranking.id}-desktop-${idx}`}
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
                          <Badge className="bg-blue-500/20 text-blue-200 border-blue-500/30 text-xs whitespace-nowrap">
                            {ranking.llm_name}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              ranking.sentiment === "positive"
                                ? "default"
                                : ranking.sentiment === "negative"
                                ? "destructive"
                                : "outline"
                            }
                            className={`text-xs ${
                              ranking.sentiment === "positive"
                                ? "bg-green-500/20 text-green-200 border-green-500/30"
                                : ranking.sentiment === "negative"
                                ? "bg-red-500/20 text-red-200 border-red-500/30"
                                : "bg-zinc-500/20 text-zinc-200 border-zinc-500/30"
                            }`}
                          >
                            {ranking.sentiment || "Neutral"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 max-w-md">
                          <div className="text-sm">
                            {ranking.reasoning || "N/A"}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                </AnimatePresence>
              </tbody>
            </table>

            {/* Cards for Small screens */}
            <div className="block md:hidden">
              <AnimatePresence>
                {queryRankings
                  .sort((a, b) => (a.rank || 99) - (b.rank || 99))
                  .map((ranking, idx) => (
                    <motion.div
                      key={`${ranking.id}-mobile-${idx}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 border-b border-accent last:border-b-0 bg-zinc-800/10 hover:bg-zinc-800/30"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-white text-sm">
                          {getEntityName(ranking.entity_id)}
                        </span>
                        <Badge className="bg-blue-500/20 text-blue-200 border-blue-500/30 text-xs whitespace-nowrap ml-2">
                          {ranking.llm_name}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                        <div>
                          <span className="text-muted-foreground">Rank: </span>
                          <span>{ranking.rank ?? "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Score: </span>
                          <span>{ranking.score}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Type: </span>
                          <span>
                            {ranking.entity_type === "brand"
                              ? "Brand"
                              : "Competitor"}
                          </span>
                        </div>
                        <div>
                        <span
                          className={`text-xs font-bold ${
                            ranking.sentiment === "positive"
                              ? "text-green-300"
                              : ranking.sentiment === "negative"
                              ? "text-red-300"
                              : "text-zinc-300"
                          }`}
                        >
                          {ranking.sentiment || "Neutral"}
                        </span>
                      </div>
                      </div>
                     
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Reasoning:
                        </p>
                        <p className="text-xs text-white/90 line-clamp-3">
                          {ranking.reasoning || "N/A"}
                        </p>
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// Summary tab content
function SummaryTabContent({ item }: { item: Summary | null }) {
  const parseReasoning = JSON.parse(item?.reasoning || "[]")
  if (!item) {
    return <p>No summary data available.</p>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full space-y-6 pb-8"
    >
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          damping: 12,
          stiffness: 100,
          delay: 0.15,
        }}
      >
        <div className="group relative overflow-auto rounded-xl transition-all">
          <div className="p-4">
            <div className="flex md:flex-row flex-col md:items-center mb-14 gap-3">
              <p className="text-xl font-semibold">&quot;{item.query}&quot;</p>
              <div className="flex">
                {item.model?.toLowerCase().includes("gpt") && (
                  <OpenAI.Combine className="h-5 w-5" />
                )}
                {item.model?.toLowerCase().includes("claude") && (
                  <Claude.Combine className="h-5 w-5" />
                )}
                {item.model?.toLowerCase().includes("gemini") && (
                  <Gemini.Combine className="h-5 w-5" />
                )}
                {item.model?.toLowerCase().includes("perplexity") && (
                  <Perplexity.Combine className="h-5 w-5" />
                )}
              </div>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              <ReactMarkdown>{item.summary}</ReactMarkdown>
            </div>

            {parseReasoning &&
              Array.isArray(parseReasoning) &&
              parseReasoning.length > 0 && (
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Citations
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {parseReasoning.map((citation, idx) => (
                      <a
                        key={idx}
                        href={citation.url_citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-md bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
                      >
                        {citation.url_citation.title}
                        <svg
                          className="ml-1 h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </motion.div>
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
      <div className="relative overflow-hidden rounded-md border border-accent">
        {/* Table for Medium screens and up */}
        <table className="hidden w-full text-xs text-left md:table sm:text-sm">
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
                key={`${insight.id}-desktop-${idx}`}
                variants={itemVariants}
                custom={idx}
                className="border-b border-accent hover:bg-zinc-800/20"
              >
                <td className="px-6 py-4 font-medium text-white">
                  {getEntityName(insight.entity_id)}
                </td>
                <td className="px-6 py-4">
                  {insight.keyword ? (
                    <Badge className="bg-zinc-700 text-zinc-300 text-xs">
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
                    className={`text-xs ${
                      insight.sentiment === "positive"
                        ? "bg-green-500/20 text-green-200 border-green-500/30"
                        : insight.sentiment === "negative"
                        ? "bg-red-500/20 text-red-200 border-red-500/30"
                        : "bg-zinc-500/20 text-zinc-200 border-zinc-500/30"
                    }`}
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

        {/* Cards for Small screens */}
        <div className="block md:hidden">
          <AnimatePresence>
            {insights.map((insight, idx) => (
              <motion.div
                key={`${insight.id}-mobile-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 border-b border-accent last:border-b-0 bg-zinc-800/10 hover:bg-zinc-800/30"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-white text-sm">
                    {getEntityName(insight.entity_id)}
                  </span>
                  <Badge
                    variant={
                      insight.sentiment === "positive"
                        ? "default"
                        : insight.sentiment === "negative"
                        ? "destructive"
                        : "outline"
                    }
                    className={`text-xs ml-2 ${
                      insight.sentiment === "positive"
                        ? "bg-green-500/20 text-green-200 border-green-500/30"
                        : insight.sentiment === "negative"
                        ? "bg-red-500/20 text-red-200 border-red-500/30"
                        : "bg-zinc-500/20 text-zinc-200 border-zinc-500/30"
                    }`}
                  >
                    {insight.sentiment || "Neutral"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                  <div>
                    <span className="text-muted-foreground">Platform: </span>
                    <span>{insight.platform}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mentions: </span>
                    <span>{insight.mention_count}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Keyword: </span>
                    {insight.keyword ? (
                      <Badge className="bg-zinc-700 text-zinc-300 text-[10px] px-1 py-0">
                        #{insight.keyword}
                      </Badge>
                    ) : (
                      "N/A"
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Collected:{" "}
                  {new Date(insight.data_fetched_at).toLocaleDateString()}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
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
