/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Eye, Activity } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ScheduledQueriesList,
  ScheduledQuery,
} from "@/components/library/scheduled-queries-list";
import { MonitoredSummary } from "@/components/dashboard/monitored-summary";
import {
  OpenAI,
  Claude,
  Perplexity,
  Gemini,
  AiStudio,
  DeepSeek,
  Grok,
  Meta,
  DeepMind,
} from "@lobehub/icons";
import { GoogleSearch } from "@/types/search";
import { MetricsHeader } from "@/components/dashboard/metrics-card";
import { toast } from "sonner";
import { BrandMetricsHeader } from "@/components/dashboard/brand-metrics-card";

interface Brand {
  id: string;
  name: string;
  industry: string | null;
  logo_url: string | null;
  website: string | null;
  language: string | null;
  location: string | null;
  created_at: string;
}

interface AnalysisSession {
  id: string;
  user_id: string;
  mode: string;
  query_count: number;
  total_rankings: number;
  rankings_data: any;
  top_entities: any;
  stats: any;
  analyzed_at: string;
  created_at: string;
  query: string | null;
  attached_brand_id: string[];
}

interface BrandMetrics {
  avgBrandVisibility: number;
  coverageRatio: number;
  totalMentions: number;
  maxMentions: number;
  uniqueModelMentions: Record<string, number>;
  visibilityTrend: number | undefined;
  coverageTrend: number | undefined;
  mentionsTrend: number | undefined;
}

interface TemporalBrandData {
  date: string;
  visibility: number;
  mentions: number;
  coverage: number;
}

export default function BrandProjectPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const brandName = decodeURIComponent(params.brand_name as string);

  const [brand, setBrand] = useState<Brand | null>(null);
  const [sessions, setSessions] = useState<AnalysisSession[]>([]);
  const [monitoredSessions, setMonitoredSessions] = useState<ScheduledQuery[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brandMetrics, setBrandMetrics] = useState<BrandMetrics | null>(null);
  const [temporalData, setTemporalData] = useState<TemporalBrandData[]>([]);
  const [googleSearchResults, setGoogleSearchResults] = useState<any[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState<string>("all");
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | null;
    to: Date | null;
  }>({ from: null, to: null });
  const [loadingGoogleResults, setLoadingGoogleResults] = useState(false);

  useEffect(() => {
    if (user?.id && brandName) {
      fetchBrandAndSessions();
    }
  }, [user?.id, brandName]);

  const fetchBrandAndSessions = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // First, fetch the brand
      const { data: brandData, error: brandError } = await supabase
        .from("brand_project")
        .select("*")
        // .eq("user_id", user.id)
        .eq("name", brandName)
        .single();

      if (brandError || !brandData) {
        setError("Brand not found");
        return;
      }

      setBrand(brandData as unknown as Brand);
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to load brand data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Google search results using the monitoring API
  const fetchGoogleSearchResults = async (
    mode_id: string,
    dateRange?: string,
    customRange?: { from: Date | undefined; to: Date | undefined }
  ) => {
    if (!mode_id) return;

    try {
      setLoadingGoogleResults(true);
      const response = await fetch(`/api/monitoring?mode_id=${mode_id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch Google search results");
      }

      const data = await response.json();

      // Filter search results by date range if provided
      if (dateRange && dateRange !== "all" && data.search_results) {
        const now = new Date();
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        const filteredResults = data.search_results.filter((result: any) => {
          if (!result.created_at) return false;
          const resultDate = new Date(result.created_at);

          switch (dateRange) {
            case "today":
              const resultDateOnly = new Date(
                resultDate.getFullYear(),
                resultDate.getMonth(),
                resultDate.getDate()
              );
              return resultDateOnly.getTime() === today.getTime();
            case "7days":
              const sevenDaysAgo = new Date(today);
              sevenDaysAgo.setDate(today.getDate() - 7);
              return resultDate >= sevenDaysAgo && resultDate <= now;
            case "30days":
              const thirtyDaysAgo = new Date(today);
              thirtyDaysAgo.setDate(today.getDate() - 30);
              return resultDate >= thirtyDaysAgo && resultDate <= now;
            case "custom":
              if (!customRange?.from || !customRange?.to) return true;
              return (
                resultDate >= customRange.from && resultDate <= customRange.to
              );
            default:
              return true;
          }
        });

        data.search_results = filteredResults;
      }

      setGoogleSearchResults(data);
    } catch (error) {
      console.error("Error fetching Google search results:", error);
      setGoogleSearchResults([]);
    } finally {
      setLoadingGoogleResults(false);
    }
  };

  // Effect to fetch Google search results when selected query or date changes
  useEffect(() => {
    if (monitoredSessions[0]?.mode_id) {
      fetchGoogleSearchResults(
        monitoredSessions[0]?.mode_id,
        selectedDateRange,
        customDateRange as { from: Date | undefined; to: Date | undefined }
      );
    }
  }, [monitoredSessions, selectedDateRange, customDateRange]);

  useEffect(() => {
    async function fetchScheduledQueries() {
      if (!user) return;

      try {
        setLoading(true);
          const response = await fetch(`/api/monitoring?brand_id=${brand?.id}`);

        if (!response.ok) {
          setError(
            `We could not fetch your scheduled queries. Please try again later.`
          );
          throw new Error(
            `Error fetching scheduled queries: ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log("data: ", data);
        const filteredDataByMyBrand = data.monitoring.filter((item: any) =>
          item?.attached_brand_id?.includes(brand?.id)
        );
        console.log("filteredDataByMyBrand: ", filteredDataByMyBrand);

        if (data && data.monitoring) {
          setMonitoredSessions(filteredDataByMyBrand);
        }
      } catch (error) {
        setError(
          `We could not fetch your scheduled queries. Please try again later.`
        );
        setLoading(false);
        console.error("Failed to fetch scheduled queries:", error);
        toast.error(
          "Failed to load scheduled queries. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchScheduledQueries();
  }, [brand]);

  // Utility function to process a single monitored session
  const processMonitoredSession = (
    session: ScheduledQuery,
    googleSearchResults: any,
    selectedDateRange: string,
    customDateRange: { from: Date | null; to: Date | null }
  ) => {
    const results = session?.results;

    if (!results || !Array.isArray(results)) {
      return {
        sessionId: session.id,
        allAnalysisBrands: [],
        temporalBrandMentionsInSummaries: [],
        getDateFilteredResults: [],
        brandMentionsInSummaries: [],
      };
    }

    // Extract all brands from session results
    const allBrands = results
      .flatMap(
        (result: {
          model_results: { llm_name: string; data: { brands: any[] } }[];
        }) =>
          result.model_results?.flatMap(
            (r: { llm_name: string; data: { brands: any[] } }) =>
              r.data?.brands || []
          )
      )
      .filter(Boolean);

    // Safely extract and parse rankings from Google search results
    const flat_google_overview_brands =
      googleSearchResults?.search_results
        ?.flatMap((result: GoogleSearch) => {
          try {
            if (!result.rankings) return [];
            const rankings =
              typeof result.rankings === "string"
                ? JSON.parse(result.rankings)
                : result.rankings;
            return rankings.brands
              .map((rank: any) => rank.name)
              .filter(Boolean);
          } catch (e) {
            console.error("Error parsing rankings:", e);
            return [];
          }
        })
        .filter(Boolean) || [];

    const unique_google_overview_brands = [
      ...new Set(flat_google_overview_brands),
    ];

    // Deduplicate based on brand name
    const uniqueBrands = new Map();
    allBrands.forEach((brand) => {
      if (brand.name && !uniqueBrands.has(brand.name)) {
        uniqueBrands.set(brand.name, brand);
      }
    });
    unique_google_overview_brands.forEach((brand) => {
      if (brand && !uniqueBrands.has(brand)) {
        uniqueBrands.set(brand, { name: brand });
      }
    });

    const allAnalysisBrands = Array.from(uniqueBrands.values());

    // Calculate temporal brand mentions
    const google_overview = googleSearchResults?.search_results?.flatMap(
      (result: GoogleSearch) => result.ai_overview
    );

    const brandMentionsArray: any[] = [];

    // Process each result (which represents a different analysis date)
    results.forEach((result) => {
      const brandMentionsMap = new Map();

      // Process each brand
      allAnalysisBrands.forEach((brand) => {
        const brandName = brand.name;
        const mentions = {
          claude_mentions: 0,
          perplexity_mentions: 0,
          gemini_mentions: 0,
          gpt_search_mentions: 0,
          ai_overview_mentions: 0,
          google_ai_mode_mentions: 0,
          deepseek_mentions: 0,
          gpt_4_1_mentions: 0,
          grok_mentions: 0,
          llama_mentions: 0,
        };

        // Process model results for this date
        result.model_results?.forEach(
          (modelResult: { llm_name: string; data: { brands: any[] } }) => {
            const modelName = modelResult.llm_name.toLowerCase();

            const brandData = modelResult.data?.brands?.find(
              (b) => b.name === brandName
            );
            if (brandData) {
              let mentionCount = 1;

              if (brandData.reasoning) {
                const reasoningMatches = brandData.reasoning.match(
                  new RegExp(`\\b${brandName}\\b`, "gi")
                );
                if (reasoningMatches) {
                  mentionCount += reasoningMatches.length;
                }
              }

              // Assign mentions to the appropriate model
              if (modelName.includes("claude")) {
                mentions.claude_mentions += mentionCount;
              } else if (modelName.includes("perplexity")) {
                mentions.perplexity_mentions += mentionCount;
              } else if (modelName.includes("gemini")) {
                mentions.gemini_mentions += mentionCount;
              } else if (modelName.includes("search")) {
                mentions.gpt_search_mentions += mentionCount;
              } else if (modelName.includes("ai overview")) {
                mentions.ai_overview_mentions += mentionCount;
              } else if (modelName.includes("google ai mode")) {
                mentions.google_ai_mode_mentions += mentionCount;
              } else if (modelName.includes("deepseek")) {
                mentions.deepseek_mentions += mentionCount;
              } else if (modelName.includes("nano")) {
                mentions.gpt_4_1_mentions += mentionCount;
              } else if (modelName.includes("grok")) {
                mentions.grok_mentions += mentionCount;
              } else if (modelName.includes("llama")) {
                mentions.llama_mentions += mentionCount;
              }
            }
          }
        );

        if (google_overview) {
          google_overview.forEach((overview: any) => {
            if (overview.includes(brandName)) {
              mentions.ai_overview_mentions += 1;
            }
          });
        }

        const total_mentions = Object.values(mentions).reduce(
          (sum, count) => sum + count,
          0
        );

        if (total_mentions > 0) {
          brandMentionsMap.set(brandName, {
            brand_name: brandName,
            analysis_date: result.analysis_date,
            session_id: session.id,
            ...mentions,
            total_mentions,
          });
        }
      });

      brandMentionsArray.push(...Array.from(brandMentionsMap.values()));
    });

    const temporalBrandMentionsInSummaries = brandMentionsArray.sort((a, b) => {
      const dateCompare =
        new Date(a.analysis_date).getTime() -
        new Date(b.analysis_date).getTime();
      if (dateCompare === 0) {
        return b.total_mentions - a.total_mentions;
      }
      return dateCompare;
    });

    // Filter results by date range
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let dateFilteredResults = results;
    switch (selectedDateRange) {
      case "today":
        dateFilteredResults = results.filter((result) => {
          const resultDate = new Date(result.analysis_date);
          const resultDateOnly = new Date(
            resultDate.getFullYear(),
            resultDate.getMonth(),
            resultDate.getDate()
          );
          return resultDateOnly.getTime() === today.getTime();
        });
        break;
      case "7days":
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        dateFilteredResults = results.filter((result) => {
          const resultDate = new Date(result.analysis_date);
          return resultDate >= sevenDaysAgo && resultDate <= now;
        });
        break;
      case "30days":
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        dateFilteredResults = results.filter((result) => {
          const resultDate = new Date(result.analysis_date);
          return resultDate >= thirtyDaysAgo && resultDate <= now;
        });
        break;
      case "custom":
        if (customDateRange.from && customDateRange.to) {
          dateFilteredResults = results.filter((result) => {
            const resultDate = new Date(result.analysis_date);
            return (
              resultDate >= customDateRange.from! &&
              resultDate <= customDateRange.to!
            );
          });
        }
        break;
    }

    // Calculate current brand mentions based on filtered results
    const brandMentionsMap = new Map();

    allAnalysisBrands.forEach((brand) => {
      const brandName = brand.name;
      const mentions = {
        claude_mentions: 0,
        perplexity_mentions: 0,
        gemini_mentions: 0,
        gpt_search_mentions: 0,
        ai_overview_mentions: 0,
        google_ai_mode_mentions: 0,
        deepseek_mentions: 0,
        gpt_4_1_mentions: 0,
        grok_mentions: 0,
        llama_mentions: 0,
      };

      dateFilteredResults.forEach((result) => {
        result?.model_results?.forEach(
          (modelResult: { llm_name: string; data: { brands: any[] } }) => {
            const modelName = modelResult.llm_name.toLowerCase();

            const brandData = modelResult.data?.brands?.find(
              (b) => b.name === brandName
            );
            if (brandData) {
              let mentionCount = 1;

              if (brandData.reasoning) {
                const reasoningMatches = brandData.reasoning.match(
                  new RegExp(`\\b${brandName}\\b`, "gi")
                );
                if (reasoningMatches) {
                  mentionCount += reasoningMatches.length;
                }
              }

              if (modelName.includes("claude")) {
                mentions.claude_mentions += mentionCount;
              } else if (modelName.includes("perplexity")) {
                mentions.perplexity_mentions += mentionCount;
              } else if (modelName.includes("gemini")) {
                mentions.gemini_mentions += mentionCount;
              } else if (modelName.includes("search")) {
                mentions.gpt_search_mentions += mentionCount;
              } else if (modelName.includes("ai overview")) {
                mentions.ai_overview_mentions += mentionCount;
              } else if (modelName.includes("google ai mode")) {
                mentions.google_ai_mode_mentions += mentionCount;
              } else if (modelName.includes("deepseek")) {
                mentions.deepseek_mentions += mentionCount;
              } else if (modelName.includes("nano")) {
                mentions.gpt_4_1_mentions += mentionCount;
              } else if (modelName.includes("grok")) {
                mentions.grok_mentions += mentionCount;
              } else if (modelName.includes("llama")) {
                mentions.llama_mentions += mentionCount;
              }
            }
          }
        );
      });

      if (google_overview) {
        google_overview.forEach((overview: any) => {
          if (overview.includes(brandName)) {
            mentions.ai_overview_mentions += 1;
          }
        });
      }

      const total_mentions = Object.values(mentions).reduce(
        (sum, count) => sum + count,
        0
      );

      if (total_mentions > 0) {
        brandMentionsMap.set(brandName, {
          brand_name: brandName,
          session_id: session.id,
          ...mentions,
          total_mentions,
        });
      }
    });

    const brandMentionsInSummaries = Array.from(brandMentionsMap.values()).sort(
      (a, b) => b.total_mentions - a.total_mentions
    );

    return {
      sessionId: session.id,
      allAnalysisBrands,
      temporalBrandMentionsInSummaries,
      getDateFilteredResults: dateFilteredResults,
      brandMentionsInSummaries,
    };
  };

  // Process all monitored sessions - returns arrays of arrays
  const processedSessionsData = useMemo(() => {
    const sessionsData = monitoredSessions.map((session) =>
      processMonitoredSession(
        session,
        googleSearchResults,
        selectedDateRange,
        customDateRange
      )
    );

    return {
      // Array of brandMentionsInSummaries arrays (one per session)
      brandMentionsSummariesBySession: sessionsData.map(
        (session) => session.brandMentionsInSummaries
      ),

      // Array of temporalBrandMentionsInSummaries arrays (one per session)
      temporalBrandMentionsBySession: sessionsData.map(
        (session) => session.temporalBrandMentionsInSummaries
      ),

      // Array of allAnalysisBrands arrays (one per session)
      allAnalysisBrandsBySession: sessionsData.map(
        (session) => session.allAnalysisBrands
      ),

      // Session IDs for reference
      sessionIds: sessionsData.map((session) => session.sessionId),
    };
  }, [
    monitoredSessions,
    googleSearchResults,
    selectedDateRange,
    customDateRange,
  ]);

  // Extract the arrays
  const brandMentionsSummariesBySession =
    processedSessionsData.brandMentionsSummariesBySession;
  const temporalBrandMentionsBySession =
    processedSessionsData.temporalBrandMentionsBySession;
  const allAnalysisBrandsBySession =
    processedSessionsData.allAnalysisBrandsBySession;
  const sessionIds = processedSessionsData.sessionIds;

  // For backward compatibility with existing UI components, use data from first session if available
  const allAnalysisBrands = allAnalysisBrandsBySession[0] || [];
  const temportalBrandMentionsInSummaries =
    temporalBrandMentionsBySession[0] || [];
  const brandMentionsInSummaries = brandMentionsSummariesBySession[0] || [];

  console.log("Brand mentions by session:", brandMentionsSummariesBySession);
  console.log(
    "Temporal brand mentions by session:",
    temporalBrandMentionsBySession
  );
  console.log("Session IDs:", sessionIds);

  console.log(googleSearchResults);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getModeColor = (mode: string) => {
    switch (mode.toLowerCase()) {
      case "voyager":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "explorer":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
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
    "Google AI Mode": DeepMind.Color,
    "DeepSeek R1": DeepSeek.Color,
    "GPT 4.1 Nano": OpenAI,
    Grok: Grok,
    Llama: Meta.Color,
  };

  if (loading) {
    return (
      <div className="h-full text-white flex flex-col items-center justify-center">
        <div className="px-4 sm:px-5 py-6">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || "Brand not found"}</p>
            <div className="space-x-2">
              <Button onClick={fetchBrandAndSessions} variant="outline">
                Try Again
              </Button>
              <Button
                onClick={() => router.push("/dashboard/projects")}
                variant="default"
              >
                Back to Projects
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/projects")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Button>
      </div>

      {/* Brand Info */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          {brand.logo_url ? (
            <img
              src={brand.logo_url}
              alt={brand.name}
              className="w-16 h-16 object-contain rounded-lg border"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">
                {brand.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold">{brand.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              {brand.industry && (
                <Badge variant="secondary">{brand.industry}</Badge>
              )}
              {brand.location && (
                <Badge variant="outline">{brand.location}</Badge>
              )}
            </div>
          </div>
        </div>

        {brand.website && (
          <p className="text-muted-foreground">
            <a
              href={brand.website}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary"
            >
              {brand.website}
            </a>
          </p>
        )}
      </div>

      <BrandMetricsHeader
        className="!w-full mb-8"
        brands={brandMentionsSummariesBySession}
        temporalBrands={temporalBrandMentionsBySession}
        selectedBrand={new Set([brand?.name || ""])}
        selectedModel={new Set()}
        queries={monitoredSessions as unknown as ScheduledQuery[]}
        brandName={brandName}
      />
      {/* Analysis Sessions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Analysis Sessions</h2>
            <p className="text-muted-foreground mt-1">
              {sessions.length + monitoredSessions.length}{" "}
              {sessions.length + monitoredSessions.length === 1
                ? "session"
                : "sessions"}{" "}
              found
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href={`/dashboard/search?attached_brand_id=${brand.id}`}>
              New Analysis
            </Link>
          </Button>
        </div>

        {sessions.length + monitoredSessions.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No Analysis Sessions Yet
            </h3>
            <p className="text-muted-foreground mb-6">
              This brand hasn&apos;t been used in any analysis sessions yet.
            </p>
            <Button asChild>
              <Link href="/dashboard/search">Start First Analysis</Link>
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="monitored">
            <TabsList className="bg-zinc-800/50 border-zinc-700 gap-4">
              <TabsTrigger
                value="monitored"
                className="data-[state=active]:!bg-blue-600 data-[state=active]:!text-white"
              >
                Monitored Queries ({monitoredSessions.length})
              </TabsTrigger>
              <TabsTrigger
                value="analysis"
                className="data-[state=active]:!bg-blue-600 data-[state=active]:!text-white"
              >
                Search Analysis ({sessions.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="analysis">
              <div className="grid gap-4">
                {sessions.map((session) => (
                  <Card
                    key={session.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`${getModeColor(
                                session.mode
                              )} flex items-center gap-1`}
                            >
                              {session.mode}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              <Calendar className="h-3 w-3" />
                              {formatDate(session.analyzed_at)}
                            </Badge>
                          </div>
                          {session.query && (
                            <CardTitle className="text-lg font-medium">
                              {session.query}
                            </CardTitle>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {session.query_count}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Queries
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {session.total_rankings}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Rankings
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {session.top_entities
                              ? Object.keys(session.top_entities).length
                              : 0}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Entities
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {session.stats?.avg_score}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Avg Score
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Session ID: {session.id.slice(0, 8)}...
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            href={`/dashboard/search/analysis?mode_id=${session.id}`}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="monitored">
              <ScheduledQueriesList
                queries={monitoredSessions as unknown as ScheduledQuery[]}
              />

              {/* Google Search Results Display */}
              {googleSearchResults.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">
                    Google Search Results
                  </h3>
                  <div className="space-y-4">
                    {googleSearchResults.map((sessionResults) => (
                      <Card
                        key={sessionResults.sessionId}
                        className="bg-background border-[#e2e2e2]/70 dark:border-accent"
                      >
                        <CardHeader>
                          <CardTitle className="text-sm">
                            Session: {sessionResults.sessionId.slice(0, 8)}...
                          </CardTitle>
                          <CardDescription>
                            {sessionResults.results.length} search results found
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {sessionResults.results.length > 0 ? (
                            <div className="space-y-2">
                              {sessionResults.results
                                .slice(0, 5)
                                .map((result: any, index: number) => (
                                  <div
                                    key={index}
                                    className="p-3 bg-muted/50 rounded-lg"
                                  >
                                    <div className="text-sm font-medium text-blue-600">
                                      {result.title || `Result ${index + 1}`}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {result.snippet || "No snippet available"}
                                    </div>
                                    {result.url && (
                                      <div className="text-xs text-green-600 mt-1 truncate">
                                        {result.url}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              {sessionResults.results.length > 5 && (
                                <div className="text-xs text-muted-foreground text-center">
                                  +{sessionResults.results.length - 5} more
                                  results
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground text-center py-4">
                              No search results available for this session
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
