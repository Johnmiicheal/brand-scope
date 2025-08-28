"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Monitor,
  Eye,
  TrendingUp,
  Target,
  Calendar,
  MapPin,
  Download,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { countries } from "@/lib/countries";
import { AnalysisMode } from "@/types/search";
import { Brand } from "@/contexts/brand-data-context";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { TextLoop } from "../ui/text-loop";
import ShinyText from "../ui/shiny-text";

type MonthlySearchVolume = {
  month: string;
  year: string;
  monthlySearches: string;
};

type KeywordData = {
  conversational_keyword: string;
  intent: string;
  google_seed_keyword: string;
  category: string;
  search_volume: number;
  competition_index: number;
  competition?: string | null;
  low_cpc?: string | null;
  high_cpc?: string | null;
  low_cpc_usd?: string | null;
  high_cpc_usd?: string | null;
  trend_3m?: string;
  trend_6m: string;
  trend_11m?: string;
  relevance_score: number;
  monthly_search_volumes?: MonthlySearchVolume[];
};

type KeywordAnalysisResultsProps = {
  keywords: Record<string, KeywordData>;
  metadata: Array<{ language: string; country: string }>;
  limit?: number;
  displaySummary?: boolean;
};

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

export function KeywordAnalysisResults({
  keywords,
  metadata,
  limit = 50,
  displaySummary = true,
}: KeywordAnalysisResultsProps) {
  const { user, subscription } = useAuth();
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordData | null>(
    null
  );
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState("weekly");
  const [scheduleCountry, setScheduleCountry] = useState("global");
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<AnalysisMode>("Explorer");
  const [scheduleBrand, setScheduleBrand] = useState<Brand | null>(null);
  const [availableBrands, setAvailableBrands] = useState<Brand[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [monitoredKeywords, setMonitoredKeywords] = useState<string[]>([]);

  const keywordEntries = Object.entries(keywords);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined = undefined;

    if (isScheduling) {
      interval = setInterval(() => {
        setElapsedSeconds((prevSeconds) => prevSeconds + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isScheduling]);

  const formatTime = (totalSeconds: number): string => {
    if (totalSeconds < 0) return "0s";
    if (totalSeconds === 0) return "0s";

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts: string[] = [];

    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) {
      if (seconds > 0 || (hours === 0 && minutes === 0)) {
        parts.push(`${seconds}s`);
      }
    }
    return parts.join(" ");
  };

  // Fetch monitored keywords
  useEffect(() => {
    const fetchMonitoredKeywords = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from("scheduled_queries")
          .select("query")
          .eq("user_id", user.id)
          .eq("status", "active");

        if (error) {
          console.error("Error fetching monitored keywords:", error);
          return;
        }

        const monitoredQueries = (data?.map((item) => item.query) ||
          []) as string[];
        setMonitoredKeywords(monitoredQueries);
        console.log("subscription: ", subscription);
      } catch (error) {
        console.error("Error fetching monitored keywords:", error);
      }
    };

    fetchMonitoredKeywords();
  }, [user?.id, subscription]);

  // Fetch available brands for selection
  useEffect(() => {
    const fetchBrands = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from("brand_project")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching brands:", error);
          return;
        }

        setAvailableBrands((data as unknown as Brand[]) || []);
        // Set default to first brand if available
        if (data && data.length > 0) {
          setScheduleBrand(data[0] as unknown as Brand);
        }
      } catch (error) {
        console.error("Error fetching brands:", error);
      }
    };

    fetchBrands();
  }, [user?.id]);

  const getIntentColor = (intent: string) => {
    switch (intent.toLowerCase()) {
      case "transactional":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "commercial":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "informational":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "navigational":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "generic":
        return "bg-slate-500/10 text-slate-500 border-slate-500/20";
      case "specific":
        return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
      case "brand":
        return "bg-pink-500/10 text-pink-500 border-pink-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend.startsWith("+")) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (trend.startsWith("-")) {
      return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
    }
    return <div className="w-4 h-4" />;
  };

  const isKeywordMonitored = (keyword: string) => {
    return monitoredKeywords.includes(keyword);
  };

  const handleScheduleKeyword = async () => {
    if (!selectedKeyword || !user?.id) return;

    setIsScheduling(true);
    toast.info(
      `Monitoring "${selectedKeyword.conversational_keyword}" has started. You can now close this modal and continue with your work.`
    );

    try {
      if (subscription?.price_id === null && monitoredKeywords.length >= 1 && subscription.payg_credits === 0) {
        toast.error(
          "You have reached the limit of 1 monitored keyword. Please upgrade to a paid plan to monitor more keywords."
        );
        return;
      }
      const response = await fetch("/api/schedule-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: selectedKeyword.conversational_keyword,
          frequency: scheduleFrequency,
          location: scheduleCountry,
          user_id: user.id,
          attached_brand_id: scheduleBrand ? [scheduleBrand.id] : [""],
          attached_brand_name: scheduleBrand ? scheduleBrand.name : "",
          attached_brand_industry: scheduleBrand ? scheduleBrand.industry : "",
          attached_brand_logo_url: scheduleBrand
            ? scheduleBrand.logo_url || ""
            : "",
          attached_brand_website: scheduleBrand ? scheduleBrand.website : "",
          attached_brand_language: scheduleBrand ? scheduleBrand.language : "",
          attached_brand_location: scheduleBrand ? scheduleBrand.location : "",
          mode: scheduleMode,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to schedule keyword");
      }

      toast.success(
        `"${selectedKeyword.conversational_keyword}" has been scheduled for ${scheduleFrequency} monitoring.`
      );

      // Refresh monitored keywords
      setMonitoredKeywords((prev) => [
        ...prev,
        selectedKeyword.conversational_keyword,
      ]);

      setIsScheduleModalOpen(false);
      setSelectedKeyword(null);
    } catch (error) {
      toast.error("Failed to schedule keyword monitoring. Please try again.");
      console.error(error);
    } finally {
      setIsScheduling(false);
    }
  };

  const openScheduleModal = (keyword: KeywordData) => {
    if (subscription?.price_id === null && monitoredKeywords.length >= 1 && subscription.payg_credits === 0) {
      toast.error(
        "You have reached the limit of 1 monitored keyword. Please upgrade to a paid plan to monitor more keywords."
      );
      return;
    } else {
      setSelectedKeyword(keyword);
      // Reset to defaults when opening modal
      setScheduleMode("Explorer");
      setScheduleBrand(availableBrands.length > 0 ? availableBrands[0] : null);
      setIsScheduleModalOpen(true);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Conversational Keyword",
      "Google Seed Keyword",
      "Intent",
      "Category",
      "Search Volume",
      "Competition Level",
      "Competition Index",
      "Low CPC",
      "High CPC",
      "Low CPC (USD)",
      "High CPC (USD)",
      "Trend (3M)",
      "Trend (6M)",
      "Trend (11M)",
      "Relevance Score",
    ];

    const csvData = keywordEntries
      .slice(0, limit)
      .map(([, keyword]) => [
        keyword.conversational_keyword,
        keyword.google_seed_keyword,
        keyword.intent,
        keyword.category,
        keyword.search_volume,
        keyword.competition || 'N/A',
        keyword.competition_index,
        keyword.low_cpc || 'N/A',
        keyword.high_cpc || 'N/A',
        keyword.low_cpc_usd || 'N/A',
        keyword.high_cpc_usd || 'N/A',
        keyword.trend_3m || 'N/A',
        keyword.trend_6m,
        keyword.trend_11m || 'N/A',
        keyword.relevance_score,
      ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        row
          .map((cell) => {
            // Escape cells that contain commas, quotes, or newlines
            const cellStr = String(cell);
            if (
              cellStr.includes(",") ||
              cellStr.includes('"') ||
              cellStr.includes("\n")
            ) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `keyword-analysis-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(
      `Export Complete - Exported ${keywordEntries.length} keywords to CSV`
    );
  };

  return (
    <TooltipProvider>
      <motion.div
        className="space-y-6"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        {/* Metadata Card */}
        {displaySummary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Analysis Overview
              </CardTitle>
              <CardDescription>
                Found {keywordEntries.length} keyword opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 text-sm text-muted-foreground">
                {metadata &&
                  metadata.map((meta, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {meta.language.toUpperCase()} • {meta.country}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Keywords Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="text-start">
                <CardTitle>Keyword Opportunities</CardTitle>
                <CardDescription>
                  Click on any keyword row to schedule it for monitoring
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <motion.div variants={staggerContainer}>
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">AI Prompt</TableHead>
                    <TableHead className="w-[180px]">Google Seed Keyword</TableHead>
                    <TableHead className="w-[120px]">Intent</TableHead>
                    <TableHead className="w-[120px]">Category</TableHead>
                    <TableHead className="w-[140px]">Search Volume</TableHead>
                    <TableHead className="w-[140px]">Competition</TableHead>
                    <TableHead className="w-[120px]">CPC (USD)</TableHead>
                    <TableHead className="w-[140px]">Trends</TableHead>
                    <TableHead className="w-[100px]">Relevance</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keywordEntries.slice(0, limit).map(([id, keyword]) => {
                    const isMonitored = isKeywordMonitored(
                      keyword.conversational_keyword
                    );

                    const tableRow = (
                      <motion.tr
                        key={id}
                        variants={fadeIn}
                        className={`transition-colors ${
                          isMonitored
                            ? "!cursor-not-allowed"
                            : "cursor-pointer hover:bg-muted/50"
                        }`}
                        onClick={() =>
                          !isMonitored && openScheduleModal(keyword)
                        }
                      >
                        <TableCell className="font-medium">
                            <div className="font-semibold text-sm break-words whitespace-normal">
                              {keyword.conversational_keyword}
                            </div>
                        </TableCell>
                        <TableCell>
                        <div className="text-foreground text-sm break-words whitespace-normal">
                                {keyword.google_seed_keyword}
                            </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getIntentColor(keyword.intent)}
                          >
                            {keyword.intent}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getCategoryColor(keyword.category)}
                          >
                            {keyword.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Target className="w-4 h-4 text-muted-foreground" />
                            {keyword.search_volume.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {keyword.competition && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  keyword.competition === 'HIGH' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                                  keyword.competition === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                                  keyword.competition === 'LOW' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                  'bg-gray-500/10 text-gray-600 border-gray-500/20'
                                }`}
                              >
                                {keyword.competition}
                              </Badge>
                            )}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              {keyword.competition_index.toFixed(1)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {keyword.low_cpc_usd && keyword.high_cpc_usd ? (
                              <span className="font-mono text-sm">
                                {keyword.low_cpc_usd} - {keyword.high_cpc_usd}
                              </span>
                            ) : keyword.low_cpc_usd ? (
                              <span className="font-mono text-sm">
                                {keyword.low_cpc_usd}+
                              </span>
                            ) : keyword.low_cpc ? (
                              <span className="font-mono text-sm text-muted-foreground">
                                {keyword.low_cpc}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            )}
                            {keyword.low_cpc_usd && keyword.low_cpc && keyword.low_cpc !== keyword.low_cpc_usd && (
                              <span className="font-mono text-xs text-muted-foreground">
                                ({keyword.low_cpc})
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {/* Primary trend (6M) */}
                            <div className="flex items-center gap-1">
                              {getTrendIcon(keyword.trend_6m)}
                              <span
                                className={`text-sm font-medium ${
                                  keyword.trend_6m.startsWith("+")
                                    ? "text-green-600"
                                    : keyword.trend_6m.startsWith("-")
                                    ? "text-red-600"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {keyword.trend_6m}
                              </span>
                              <span className="text-xs text-muted-foreground">6M</span>
                            </div>
                            {/* Additional trends */}
                            <div className="flex items-center gap-2 text-xs">
                              {keyword.trend_3m && (
                                <span
                                  className={`${
                                    keyword.trend_3m.startsWith("+")
                                      ? "text-green-500"
                                      : keyword.trend_3m.startsWith("-")
                                      ? "text-red-500"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  3M: {keyword.trend_3m}
                                </span>
                              )}
                              {keyword.trend_11m && (
                                <span
                                  className={`${
                                    keyword.trend_11m.startsWith("+")
                                      ? "text-green-500"
                                      : keyword.trend_11m.startsWith("-")
                                      ? "text-red-500"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  11M: {keyword.trend_11m}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                keyword.relevance_score >= 8
                                  ? "bg-green-500"
                                  : keyword.relevance_score >= 6
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                            ></div>
                            {keyword.relevance_score}/10
                          </div>
                        </TableCell>
                        <TableCell>
                            {isMonitored ? (
                              <Button
                                size="sm"
                                className="w-fit bg-blue-700 text-white"
                                onClick={() => {
                                  window.location.assign(`/dashboard`);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                                View Report
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isMonitored) {
                                    openScheduleModal(keyword);
                                  }
                                }}
                                disabled={isMonitored}
                                className="flex items-center gap-1"
                              >
                                <Monitor className="w-4 h-4" />
                                {isMonitored ? "Monitored" : "Monitor"}
                              </Button>
                            )}
                        </TableCell>
                      </motion.tr>
                    );

                    return isMonitored ? (
                      <Tooltip key={id}>
                        <TooltipTrigger asChild>{tableRow}</TooltipTrigger>
                        <TooltipContent side="top" className="p-3 bg-blue-600">
                          <p className="font-medium mb-2">
                            🔍 Already Monitored
                          </p>
                          <p className="text-xs opacity-90">
                            This keyword is currently being tracked
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      tableRow
                    );
                  })}
                </TableBody>
              </Table>
            </motion.div>
          </CardContent>
        </Card>

        {/* Schedule Modal */}
        <Dialog
          open={isScheduleModalOpen}
          onOpenChange={setIsScheduleModalOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Keyword Monitoring</DialogTitle>
              <DialogDescription>
                Configure monitoring settings for &quot;
                {selectedKeyword?.conversational_keyword}&quot;
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {selectedKeyword && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Keyword Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      Search Volume:{" "}
                      {selectedKeyword.search_volume.toLocaleString()}
                    </div>
                    <div>
                      Competition:{" "}
                      {selectedKeyword.competition_index.toFixed(1)}
                    </div>
                    <div>Intent: {selectedKeyword.intent}</div>
                    <div>Relevance: {selectedKeyword.relevance_score}/10</div>
                  </div>
                </div>
              )}
              {isScheduling ? (
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="w-full ">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="flex items-center space-x-2">
                        <span
                          className={cn(
                            "px-2 py-1 text-xs rounded-full",
                            scheduleMode === "Voyager" &&
                              "bg-orange-500/20 text-orange-400",
                            scheduleMode === "Explorer" &&
                              "bg-green-500/20 text-green-400"
                          )}
                        >
                          {scheduleMode}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-1 text-xs rounded-full",
                            "bg-blue-500/20 text-blue-400"
                          )}
                        >
                          Monitor
                        </span>

                        <span className="text-xs text-muted-foreground">
                          thought for {formatTime(elapsedSeconds)}
                        </span>
                      </div>
                      <h1 className="text-2xl font-bold mb-3 text-center text-foreground dark:text-white">
                        Analyzing Your Search Query
                      </h1>
                    </div>
                    <p className="text-muted-foreground mb-10 text-center">
                      We&apos;re gathering data and insights about{" "}
                      {selectedKeyword?.conversational_keyword || "your query"}
                      This may take a few moments.
                    </p>
                    <div className="flex flex-col justify-center items-start gap-4">
                      <div className="space-y-2">
                        <p className="text-sm text-neutral-500">
                          Processing with
                        </p>
                        <TextLoop interval={1.5}>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            🔍 Retrieving relevant information...
                          </p>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            📚 Processing search results...
                          </p>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            🤖 Generating response...
                          </p>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            ✨ Enhancing with context...
                          </p>
                        </TextLoop>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-neutral-500">
                          Generating response
                        </p>
                        <ShinyText
                          text="Combining insights from multiple sources for a comprehensive answer..."
                          disabled={false}
                          speed={3}
                          className="font-medium text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Analysis Mode Selection */}
                  <div className="space-y-2 w-full">
                    <label className="text-sm font-medium">Analysis Mode</label>
                    <Select
                      value={scheduleMode}
                      onValueChange={(value: AnalysisMode) =>
                        setScheduleMode(value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Explorer">
                          Explorer - Native Search
                        </SelectItem>
                        <SelectItem value="Voyager">
                          Voyager - Non-Native Search
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Brand Selection */}
                  {availableBrands.length > 0 && (
                    <div className="space-y-2 w-full">
                      <label className="text-sm font-medium">Brand</label>
                      <Select
                        value={scheduleBrand?.id || ""}
                        onValueChange={(value: string) => {
                          const selected = availableBrands.find(
                            (b) => b.id === value
                          );
                          setScheduleBrand(selected || null);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a brand" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableBrands.length === 0 ? (
                            <SelectItem value="N/A" disabled>
                              No brands available
                            </SelectItem>
                          ) : (
                            availableBrands.map((brand) => (
                              <SelectItem key={brand.id} value={brand.id}>
                                {brand.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

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
                            <SelectItem
                              key={country.value}
                              value={country.value}
                            >
                              {country.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleScheduleKeyword}
                  disabled={isScheduling}
                  className="flex-1"
                >
                  {isScheduling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      Schedule Monitoring
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsScheduleModalOpen(false)}
                  disabled={isScheduling}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </TooltipProvider>
  );
}
