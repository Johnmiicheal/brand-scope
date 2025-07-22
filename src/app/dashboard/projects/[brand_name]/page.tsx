/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Calendar, 
  Eye,
  Activity
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger, } from "@/components/ui/tabs";
import { ScheduledQueriesList, ScheduledQuery } from "@/components/library/scheduled-queries-list";
import { MonitoredSummary } from "@/components/dashboard/monitored-summary";
import { motion } from "framer-motion";
import { Info, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { 
  Tooltip,
  TooltipTrigger,
  TooltipProvider,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  ChartContainer,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip as ChartTooltip, Bar, BarChart } from "recharts";

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
  const [monitoredSessions, setMonitoredSessions] = useState<[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brandMetrics, setBrandMetrics] = useState<BrandMetrics | null>(null);
  const [temporalData, setTemporalData] = useState<TemporalBrandData[]>([]);

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
        .eq("user_id", user.id)
        .eq("name", brandName)
        .single();

      if (brandError || !brandData) {
        setError("Brand not found");
        return;
      }

      setBrand(brandData as unknown as Brand);

      // Then, fetch analysis sessions that have this brand attached
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("ai_ranking_sessions")
        .select("*")
        .eq("user_id", user.id)
        .contains("attached_brand_id", [brandData.id])
        .order("analyzed_at", { ascending: false });

      if (sessionsError) {
        console.error("Error fetching sessions:", sessionsError);
        setError("Failed to load analysis sessions");
        return;
      }

      setSessions((sessionsData as unknown as AnalysisSession[]) || []);

      // Then, fetch monitored sessions that have this brand attached
      const { data: monitoredSessionsData, error: monitoredSessionsError } = await supabase
        .from("scheduled_queries")
        .select("*")
        .eq("user_id", user.id)
        .contains("attached_brand_id", [brandData.id]);

      if (monitoredSessionsError) {
        console.error("Error fetching monitored sessions:", monitoredSessionsError);
        setError("Failed to load monitored sessions");
        return;
      }

      setMonitoredSessions((monitoredSessionsData as unknown as []) || []);

      // Calculate brand-specific metrics from monitored sessions
      if (monitoredSessionsData && monitoredSessionsData.length > 0) {
        calculateBrandMetrics(monitoredSessionsData, brandData.name as string);
      }

    } catch (error) {
      console.error("Error:", error);
      setError("Failed to load brand data");
    } finally {
      setLoading(false);
    }
  };

    const calculateBrandMetrics = (queries: any[], brandName: string) => {
    let totalMentions = 0;
    let totalScore = 0;
    let scoreCount = 0;
    let totalCoverage = 0;
    let coverageCount = 0;
    const modelCounts: Record<string, number> = {};
    const temporalDataMap: Record<string, TemporalBrandData> = {};
    const modelsSet = new Set<string>();

    console.log(`Calculating metrics for brand: ${brandName}`);
    console.log(`Processing ${queries.length} queries`);

    // Process each scheduled query's results
    queries.forEach((query: any) => {
      console.log(`Processing query: ${query.query || query.id}`);
      console.log(`Query results:`, query.results);
      
      if (query.results && Array.isArray(query.results)) {
        console.log(`Found ${query.results.length} analysis runs`);
        
        query.results.forEach((analysisRun: any, runIndex: number) => {
          console.log(`Processing analysis run ${runIndex + 1}:`, {
            analysis_date: analysisRun.analysis_date,
            model_results_count: analysisRun.model_results?.length || 0
          });
          
          if (analysisRun.model_results && Array.isArray(analysisRun.model_results)) {
            let sessionMentions = 0;
            let sessionScore = 0;
            let sessionScoreCount = 0;
            let modelsWithBrand = 0;
            const totalModels = analysisRun.model_results.length;

            analysisRun.model_results.forEach((modelResult: any, modelIndex: number) => {
              if (modelResult.llm_name) {
                modelsSet.add(modelResult.llm_name);
              }

              console.log(`  Model ${modelIndex + 1} (${modelResult.llm_name}):`, {
                status: modelResult.status,
                has_data: !!modelResult.data,
                brands_count: modelResult.data?.brands?.length || 0
              });

              // Process brand rankings if the model result was successful
              if (modelResult.status === 'fulfilled' && modelResult.data?.brands) {
                const brandData = modelResult.data.brands.find((brand: any) => 
                  brand.name.toLowerCase().includes(brandName.toLowerCase())
                );
                
                console.log(`    Brand data found:`, brandData);
                
                if (brandData) {
                  // For monitoring data, we typically don't have total_mentions field
                  // Instead, let's count based on the score or rank existing
                  const mentions = 1; // Each successful mention counts as 1
                  sessionMentions += mentions;
                  
                  // Count scores (brand visibility)
                  if (typeof brandData.score === 'number') {
                    sessionScore += brandData.score;
                    sessionScoreCount += 1;
                  }
                  
                  // Count models that mentioned this brand (for coverage ratio)
                  modelsWithBrand++;
                  
                  // Count unique model mentions (one per model per prompt)
                  modelCounts[modelResult.llm_name] = (modelCounts[modelResult.llm_name] || 0) + 1;
                }
              }
            });

            console.log(`  Session totals:`, {
              sessionMentions,
              sessionScore,
              sessionScoreCount,
              modelsWithBrand,
              totalModels
            });

            // Calculate session-level metrics
            if (sessionScoreCount > 0) {
              totalScore += sessionScore;
              scoreCount += sessionScoreCount;
            }
            
            totalMentions += sessionMentions;
            
            if (totalModels > 0) {
              totalCoverage += (modelsWithBrand / totalModels) * 100;
              coverageCount++;
            }

            // Store temporal data - use analysis_date instead of analyzed_at
            if (analysisRun.analysis_date) {
              const date = analysisRun.analysis_date.split('T')[0];
              console.log(`  Adding temporal data for date: ${date}`);
              
              if (!temporalDataMap[date]) {
                temporalDataMap[date] = {
                  date,
                  visibility: 0,
                  mentions: 0,
                  coverage: 0,
                };
              }
              
              temporalDataMap[date].mentions += sessionMentions;
              if (sessionScoreCount > 0) {
                temporalDataMap[date].visibility += sessionScore / sessionScoreCount;
              }
              if (totalModels > 0) {
                temporalDataMap[date].coverage += (modelsWithBrand / totalModels) * 100;
              }
            }
          }
        });
      }
    });

    // Calculate averages
    const avgBrandVisibility = scoreCount > 0 ? (totalScore / scoreCount) : 0;
    const avgCoverage = coverageCount > 0 ? (totalCoverage / coverageCount) : 0;

    // Calculate trends (compare latest vs previous)
    const temporalArray = Object.values(temporalDataMap).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    let visibilityTrend: number | undefined;
    let coverageTrend: number | undefined;
    let mentionsTrend: number | undefined;

    if (temporalArray.length >= 2) {
      const latest = temporalArray[temporalArray.length - 1];
      const previous = temporalArray[temporalArray.length - 2];
      
      if (previous.visibility > 0) {
        visibilityTrend = (latest.visibility - previous.visibility) / previous.visibility;
      }
      if (previous.coverage > 0) {
        coverageTrend = (latest.coverage - previous.coverage) / previous.coverage;
      }
      if (previous.mentions > 0) {
        mentionsTrend = (latest.mentions - previous.mentions) / previous.mentions;
      }
    }

    console.log('Final calculated metrics:', {
      avgBrandVisibility,
      avgCoverage,
      totalMentions,
      modelCounts,
      temporalArrayLength: temporalArray.length,
      temporalArray,
      visibilityTrend,
      coverageTrend,
      mentionsTrend
    });

    setBrandMetrics({
      avgBrandVisibility,
      coverageRatio: avgCoverage,
      totalMentions,
      uniqueModelMentions: modelCounts,
      visibilityTrend,
      coverageTrend,
      mentionsTrend,
    });

    setTemporalData(temporalArray);
  };

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
              <Button onClick={() => router.push("/dashboard/projects")} variant="default">
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

      {/* Brand Metrics Dashboard */}
      {brandMetrics && monitoredSessions.length > 0 && (
        <div className="mb-8 space-y-6">
          <h2 className="text-2xl font-semibold">Brand Performance Analytics</h2>
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Average Brand Visibility */}
            <motion.div
              className="p-6 bg-card/5 border border-[#e2e2e2]/70 dark:border-accent rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                Average Brand Visibility
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm w-full">
                      <p>Average visibility score across all prompts for this brand</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-2xl font-bold mb-1">{brandMetrics.avgBrandVisibility.toFixed(1)}%</div>
              {brandMetrics.visibilityTrend !== undefined && (
                <div className={`text-sm flex items-center gap-1 ${
                  brandMetrics.visibilityTrend > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {brandMetrics.visibilityTrend > 0 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {Math.abs(brandMetrics.visibilityTrend * 100).toFixed(1)}% vs previous
                </div>
              )}
            </motion.div>

            {/* Coverage Ratio */}
            <motion.div
              className="p-6 bg-card/5 border border-[#e2e2e2]/70 dark:border-accent rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                Coverage Ratio
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm w-full">
                      <p>Average ratio of models that mentioned this brand across all prompts</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-2xl font-bold mb-1">{brandMetrics.coverageRatio.toFixed(1)}%</div>
              {brandMetrics.coverageTrend !== undefined && (
                <div className={`text-sm flex items-center gap-1 ${
                  brandMetrics.coverageTrend > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {brandMetrics.coverageTrend > 0 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {Math.abs(brandMetrics.coverageTrend * 100).toFixed(1)}% vs previous
                </div>
              )}
            </motion.div>

            {/* Total Mentions */}
            <motion.div
              className="p-6 bg-card/5 border border-[#e2e2e2]/70 dark:border-accent rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                Total Mentions
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm w-full">
                      <p>Total number of mentions across all prompts for this brand</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-2xl font-bold mb-1">{brandMetrics.totalMentions}</div>
              {brandMetrics.mentionsTrend !== undefined && (
                <div className={`text-sm flex items-center gap-1 ${
                  brandMetrics.mentionsTrend > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {brandMetrics.mentionsTrend > 0 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {Math.abs(brandMetrics.mentionsTrend * 100).toFixed(1)}% vs previous
                </div>
              )}
            </motion.div>

            {/* Listed in Models */}
            <motion.div
              className="p-6 bg-card/5 border border-[#e2e2e2]/70 dark:border-accent rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <div className="text-sm text-muted-foreground mb-1">Listed in Models</div>
              <div className="text-2xl font-bold mb-2">{Object.keys(brandMetrics.uniqueModelMentions).length}</div>
              <div className="space-y-1">
                {Object.entries(brandMetrics.uniqueModelMentions).slice(0, 3).map(([model, count]) => (
                  <div key={model} className="flex justify-between text-xs">
                    <span className="truncate">{model.replace(/\s*(4\.0|2\.5|4o)\s*/g, '')}</span>
                    <span className="text-blue-500 font-semibold">{count}</span>
                  </div>
                ))}
                {Object.keys(brandMetrics.uniqueModelMentions).length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{Object.keys(brandMetrics.uniqueModelMentions).length - 3} more
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visibility Over Time Chart */}
            <Card className="bg-background border-[#e2e2e2]/70 dark:border-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Brand Visibility Over Time
                </CardTitle>
                <CardDescription>
                  {temporalData.length > 0 ? 'Average visibility trend across all prompts' : 'No temporal data available yet'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {temporalData.length > 0 ? (
                  <ChartContainer config={{}} className="h-[300px] w-full">
                    <AreaChart
                      data={temporalData.map(d => ({
                        date: new Date(d.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
                        visibility: Number(d.visibility.toFixed(1))
                      }))}
                      margin={{ left: 12, right: 12, top: 20, bottom: 20 }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        style={{ fontSize: '12px', fill: 'var(--muted-foreground)' }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                        style={{ fontSize: '12px', fill: 'var(--muted-foreground)' }}
                      />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: 'var(--background)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          fontSize: '12px',
                        }}
                        formatter={(value) => [`${value}%`, 'Visibility']}
                      />
                      <Area
                        type="monotone"
                        dataKey="visibility"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Run more analyses to see trend data</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Model Mentions Chart */}
            <Card className="bg-background border-[#e2e2e2]/70 dark:border-accent">
              <CardHeader>
                <CardTitle>Model Mentions Distribution</CardTitle>
                <CardDescription>
                  {Object.keys(brandMetrics.uniqueModelMentions).length > 0 
                    ? 'Number of prompts where brand was mentioned by each model'
                    : 'No model mentions data available yet'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(brandMetrics.uniqueModelMentions).length > 0 ? (
                  <ChartContainer config={{}} className="h-[300px] w-full">
                    <BarChart
                      data={Object.entries(brandMetrics.uniqueModelMentions).map(([model, count]) => ({
                        model: model.replace(/\s*(4\.0|2\.5|4o)\s*/g, ''),
                        count
                      }))}
                      margin={{ left: 12, right: 12, top: 20, bottom: 20 }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
                      <XAxis
                        dataKey="model"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        style={{ fontSize: '10px', fill: 'var(--muted-foreground)' }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        style={{ fontSize: '12px', fill: 'var(--muted-foreground)' }}
                      />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: 'var(--background)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          fontSize: '12px',
                        }}
                        formatter={(value) => [`${value}`, 'Mentions']}
                      />
                      <Bar
                        dataKey="count"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-4 opacity-50 bg-muted rounded flex items-center justify-center">
                        📊
                      </div>
                      <p>No model mentions available yet</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Analysis Sessions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Analysis Sessions</h2>
            <p className="text-muted-foreground mt-1">
              {sessions.length + monitoredSessions.length} {sessions.length + monitoredSessions.length === 1 ? "session" : "sessions"} found
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href={`/dashboard/search?attached_brand_id=${brand.id}`}>New Analysis</Link>
          </Button>
        </div>

        {sessions.length + monitoredSessions.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Analysis Sessions Yet</h3>
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
              <TabsTrigger value="monitored" className="data-[state=active]:!bg-blue-600 data-[state=active]:!text-white">Monitored Queries ({monitoredSessions.length})</TabsTrigger>
              <TabsTrigger value="analysis" className="data-[state=active]:!bg-blue-600 data-[state=active]:!text-white">Search Analysis ({sessions.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="analysis">
            <div className="grid gap-4">
            {sessions.map((session) => (
              <Card key={session.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`${getModeColor(session.mode)} flex items-center gap-1`}
                        >
                          {session.mode}
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
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
                      <div className="text-sm text-muted-foreground">Queries</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {session.total_rankings}
                      </div>
                      <div className="text-sm text-muted-foreground">Rankings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {session.top_entities ? Object.keys(session.top_entities).length : 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Entities</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {session.stats?.avg_score}%
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Score</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Session ID: {session.id.slice(0, 8)}...
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/search/analysis?mode_id=${session.id}`}>
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
              <MonitoredSummary queries={monitoredSessions as unknown as ScheduledQuery[]} />
              <ScheduledQueriesList queries={monitoredSessions as unknown as ScheduledQuery[]} />
            </TabsContent>
          </Tabs>
         
        )}
      </div>
    </div>
  );
} 