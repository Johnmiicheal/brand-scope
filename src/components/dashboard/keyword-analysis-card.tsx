/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  ArrowRight,
  Calendar,
  Target,
  BarChart3,
  Clock,
  Eye,
  Search,
  TextSearch,
  Loader2,
  Info,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { KeywordAnalysisResults } from "@/components/keywords/keyword-analysis-results";
import { countries } from "@/lib/countries";
import { Input } from "../ui/input";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface KeywordRecommendation {
  conversational_keyword: string;
  intent: string;
  relevance_score: number;
  search_volume: number;
}

interface AnalysisSession {
  id: string;
  business_brief?: string;
  website?: string;
  keyword_input?: string;
  total_keywords: number;
  created_at: string;
  top_keywords?: KeywordRecommendation[];
  stats?: {
    avg_relevance_score: number;
    high_volume_count: number;
    intent_distribution: Record<string, number>;
  };
}

interface KeywordSummary {
  total_sessions: number;
  total_keywords: number;
  avg_relevance_score: number;
  high_volume_keywords: number;
  last_analysis_date: string | null;
}

export function KeywordAnalysisCard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recentSession, setRecentSession] = useState<AnalysisSession | null>(
    null
  );
  const [summary, setSummary] = useState<KeywordSummary>({
    total_sessions: 0,
    total_keywords: 0,
    avg_relevance_score: 0,
    high_volume_keywords: 0,
    last_analysis_date: null,
  });

  // Modal states
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedKeyword, setSelectedKeyword] =
    useState<KeywordRecommendation | null>(null);
  const [scheduleFrequency, setScheduleFrequency] = useState("weekly");
  const [scheduleCountry, setScheduleCountry] = useState("global");
  const [isScheduling, setIsScheduling] = useState(false);
  const [fullKeywordsData, setFullKeywordsData] = useState<Record<string, any>>(
    {}
  );
  const [editedKeyword, setEditedKeyword] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchOptimizedKeywordData();
    }
  }, [user]);

  const fetchOptimizedKeywordData = async () => {
    try {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // Fetch from optimized summary table first (single row, very fast)
      const { data: summaryData, error: summaryError } = await supabase
        .from("keyword_analysis_summary")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (summaryError && summaryError.code !== "PGRST116") {
        console.error("Error fetching summary:", summaryError);
      }

      if (summaryData) {
        setSummary({
          total_sessions: Number(summaryData.total_sessions) || 0,
          total_keywords: Number(summaryData.total_keywords) || 0,
          avg_relevance_score: Number(summaryData.avg_relevance_score) || 0,
          high_volume_keywords: Number(summaryData.high_volume_keywords) || 0,
          last_analysis_date: summaryData.last_analysis_date
            ? String(summaryData.last_analysis_date)
            : null,
        });
      }

      // Fetch only the most recent session with top keywords (very fast, single row)
      const { data: recentSessionData, error: sessionError } = await supabase
        .from("keyword_analysis_sessions")
        .select(
          "id, business_brief, website, keyword_input, total_keywords, created_at, top_keywords, stats"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (sessionError && sessionError.code !== "PGRST116") {
        console.error("Error fetching recent session:", sessionError);
      }

      if (recentSessionData) {
        setRecentSession(recentSessionData as unknown as AnalysisSession);
      }
    } catch (error) {
      console.error("Error fetching keyword data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFullKeywordData = async () => {
    if (!recentSession?.id || !user?.id) return;

    try {
      const { data: sessionData, error } = await supabase
        .from("keyword_analysis_sessions")
        .select("keywords_data")
        .eq("id", recentSession.id)
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching full keyword data:", error);
        return;
      }

      if (sessionData) {
        setFullKeywordsData(sessionData.keywords_data || {});
      }
    } catch (error) {
      console.error("Error fetching full keyword data:", error);
    }
  };

  const handleViewAllAnalyses = async () => {
    await fetchFullKeywordData();
    setShowAnalysisModal(true);
  };

  const handleKeywordClick = (keyword: KeywordRecommendation) => {
    setSelectedKeyword(keyword);
    setShowScheduleModal(true);
  };

  const handleScheduleKeyword = async () => {
    if (!selectedKeyword || !user?.id) return;

    setIsScheduling(true);
    toast({
      title: "Monitoring Started",
      description: `Monitoring "${selectedKeyword.conversational_keyword}" has started. You can now close this modal and continue with your work.`,
    });
    try {
      const response = await fetch("/api/schedule-query", {
        method: "POST",
        body: JSON.stringify({
          query: editedKeyword || selectedKeyword?.conversational_keyword || "",
          frequency: scheduleFrequency,
          location: scheduleCountry,
          user_id: user.id,
          attached_brand_id: [""],
          mode: "Explorer"
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to schedule keyword");
      }

      toast({
        title: "Keyword Monitoring Completed",
        description: `"${selectedKeyword.conversational_keyword}" has been scheduled for ${scheduleFrequency} monitoring.`,
      });

      setShowScheduleModal(false);
      setSelectedKeyword(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule keyword monitoring. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsScheduling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getIntentColor = (intent: string) => {
    switch (intent?.toLowerCase()) {
      case "commercial":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "informational":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "navigational":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "transactional":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "exploratory":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  if (loading) {
    return (
      <Card className="relative overflow-hidden h-full bg-background shadow-none border-[#e2e2e2]/70 dark:border-accent">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1">
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-60" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn}>
      <Card className="relative overflow-hidden h-full bg-background shadow-none border-[#e2e2e2]/70 dark:border-accent">
        <div className="absolute top-4 right-4">
          <Badge
            variant="secondary"
            className="bg-blue-500/10 text-blue-600 border-blue-500/20"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            AI-Powered
          </Badge>
        </div>

        <CardHeader className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div>
              <CardTitle className="text-xl">Keyword Analysis</CardTitle>
              <CardDescription>
                AI-powered keyword discovery for your brand
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-4">
          {summary.total_sessions > 0 ? (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/50 dark:bg-muted/20 rounded-lg p-3 border">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Total Keywords</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {summary.total_keywords}
                  </div>
                </div>
                <div className="bg-white/50 dark:bg-muted/20 rounded-lg p-3 border">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Avg. Relevance</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {summary.avg_relevance_score.toFixed(1)}/10
                  </div>
                </div>
              </div>

              {/* Recent Analysis */}
              {recentSession && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>Latest Analysis</span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {formatDate(recentSession.created_at)}
                    </span>
                  </div>

                  <div className="bg-white/30 dark:bg-muted/20 rounded-lg p-3 border">
                    <div className="text-sm font-medium mb-1">
                      {recentSession.business_brief ||
                        recentSession.website ||
                        recentSession.keyword_input ||
                        "Latest Analysis"}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <span className="flex items-center gap-1">
                        <TextSearch className="w-3 h-3" />
                        {recentSession.total_keywords} keywords found
                      </span>
                      {recentSession.stats?.high_volume_count && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {recentSession.stats.high_volume_count} high-volume
                        </span>
                      )}
                    </div>

                    {/* Top Keywords Preview */}
                    {recentSession.top_keywords &&
                      recentSession.top_keywords.length > 0 && (
                        <ScrollArea className="h-28">
                          <div className="flex flex-wrap gap-1">
                            {recentSession.top_keywords
                              .slice(0, 4)
                              .map((keyword, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className={`text-xs ${getIntentColor(
                                    keyword.intent
                                  )} flex items-center gap-1 !bg-zinc-800 !text-zinc-200 py-2 rounded-md cursor-pointer hover:bg-zinc-700 transition-colors`}
                                  title={`Click to schedule monitoring: ${keyword.conversational_keyword} (${keyword.relevance_score}/10)`}
                                  onClick={() => handleKeywordClick(keyword)}
                                >
                                  <Search className="w-3 h-3" />
                                  {keyword.conversational_keyword}
                                  {/* {keyword.conversational_keyword.length > 20 ? '...' : ''} */}
                                </Badge>
                              ))}
                          </div>
                        </ScrollArea>
                      )}
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {summary.high_volume_keywords} high-volume keywords
                </span>
                <span className="flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  {summary.total_sessions} analyses
                </span>
              </div>
            </>
          ) : (
            <>
              {/* Empty State */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span>
                    Discover <strong>50+ keyword opportunities</strong>
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>
                    <strong>5 free analyses</strong> per day
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>
                    Schedule keywords for <strong>monitoring</strong>
                  </span>
                </div>
              </div>
            </>
          )}

          <div className="pt-2">
            {summary.total_sessions > 0 ? (
              <Button
                className="w-full group bg-blue-500 hover:bg-blue-600"
                onClick={handleViewAllAnalyses}
              >
                View All Analysis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : (
              <Link href="/dashboard/keywords">
                <Button className="w-full group bg-blue-500 hover:bg-blue-600">
                  Start Keyword Analysis
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Full Analysis Modal */}
      <Dialog open={showAnalysisModal} onOpenChange={setShowAnalysisModal}>
        <DialogContent className="!max-w-max !w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Keyword Analysis</DialogTitle>
            <DialogDescription>
              All keywords discovered in your latest analysis
            </DialogDescription>
          </DialogHeader>

          {Object.keys(fullKeywordsData).length > 0 && (
            <KeywordAnalysisResults
              keywords={fullKeywordsData}
              metadata={[]}
              onScheduleKeyword={async (
                keyword: string,
                frequency: string,
                country: string
              ) => {
                // Handle scheduling from the full analysis view
                const keywordData = Object.values(fullKeywordsData).find(
                  (k: any) => k.conversational_keyword === keyword
                );
                if (keywordData) {
                  setSelectedKeyword(keywordData as KeywordRecommendation);
                  setScheduleFrequency(frequency);
                  setScheduleCountry(country);
                  setEditedKeyword(keywordData.conversational_keyword);
                  await handleScheduleKeyword();
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Keyword Modal */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Keyword Monitoring</DialogTitle>
            <DialogDescription>
              Configure monitoring settings for &quot;
              {editedKeyword || selectedKeyword?.conversational_keyword || ""}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedKeyword && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">Keyword Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    Search Volume:{" "}
                    {selectedKeyword.search_volume?.toLocaleString() || "N/A"}
                  </div>
                  <div>Intent: {selectedKeyword.intent}</div>
                  <div>Relevance: {selectedKeyword.relevance_score}/10</div>
                </div>
              </div>
            )}

              <div className="space-y-3 w-full">
                <label className="text-sm font-medium">
                  Keyword
                </label>
                <Input
                  value={editedKeyword || selectedKeyword?.conversational_keyword || ""}
                  onChange={(e) => setEditedKeyword(e.target.value)}
                  className="w-full"
                />
              </div>
            <div className="flex gap-5 w-full items-center justify-between">

              <div className="space-y-2 w-full">
                <label className="text-sm font-medium">
                  Monitoring Frequency
                </label>
                <Select
                  value={scheduleFrequency}
                  onValueChange={setScheduleFrequency}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 w-full">
                <label className="text-sm font-medium">Location</label>
                <Select
                  value={scheduleCountry}
                  onValueChange={setScheduleCountry}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global" disabled>
                      Select Location
                    </SelectItem>
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleScheduleKeyword}
                disabled={isScheduling}
                className="flex-1 bg-blue-600 hover:bg-blue-500"
              >
                {isScheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                {isScheduling ? "Scheduling..." : "Schedule Monitoring"}
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setShowScheduleModal(false)}
                disabled={isScheduling}
              >
                Cancel
              </Button>
            </div>
            {isScheduling && (
              <div className="flex items-center gap-2 p-4 mt-5 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                <Info className="w-4 h-4" />
                You can now close this modal and continue with your work.
            </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
