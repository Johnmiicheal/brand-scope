"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TbSparkles, TbSearch, TbRefresh, TbLoader2 } from "react-icons/tb";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Search, Calendar, Loader2, Info } from "lucide-react";
import { Brand } from "@/contexts/brand-data-context";
import { AnalysisMode } from "@/types/search";
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
import { Input } from "@/components/ui/input";
import { countries } from "@/lib/countries";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { TextLoop } from "../ui/text-loop";
import ShinyText from "../ui/shiny-text";

interface CitationData {
  url_citation?: {
    url: string;
    title: string;
    snippet: string;
  };
  domain?: string;
  source?: string;
  text?: string;
  url?: string;
  title?: string;
}

// Types for the webhook response
interface StepsData {
  output: {
    topic: string;
    search_config: {
      location: string;
      language_code: string;
      google_domain: string;
      brand: string;
    };
    categories: Array<{
      header: string;
      subsearches: string[];
    }>;
    keywords: Record<
      string,
      {
        conversational_keyword: string;
        intent: string;
        search_intent: string;
        google_seed_keyword: string;
        category: string;
        search_volume: number;
        competition_index: number;
        low_cpc: string;
        trend_6m: string;
        relevance_score: number;
      }
    >;
  };
}

interface Citation {
  url: string;
  title: string;
  snippet: string;
}

interface KeywordData {
  conversational_keyword: string;
  intent: string;
  search_intent: string;
  google_seed_keyword: string;
  category: string;
  search_volume: number;
  competition_index: number;
  low_cpc: string;
  trend_6m: string;
  relevance_score: number;
}

interface StepsTabContentProps {
  citations: Citation[] | null;
  monitoringId: string;
  prompt: string;
  country: string;
  brand: Brand | null;
  orientation?: "horizontal" | "vertical";
}

export function StepsTabContent({
  citations,
  monitoringId,
  prompt,
  country,
  brand,
  orientation = "vertical",
}: StepsTabContentProps) {
  const { user, subscription } = useAuth();

  const [stepsData, setStepsData] = useState<StepsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Monitoring modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordData | null>(
    null
  );
  const [scheduleFrequency, setScheduleFrequency] = useState<
    "daily" | "weekly"
  >("daily");
  const [scheduleCountry, setScheduleCountry] =
    useState<string>("United States");
  const [editedKeyword, setEditedKeyword] = useState<string>("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<AnalysisMode>("Explorer");
  const [scheduleBrand, setScheduleBrand] = useState<Brand | null>(null);
  const [availableBrands, setAvailableBrands] = useState<Brand[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [monitoredKeywords, setMonitoredKeywords] = useState<string[]>([]);

  // const keywordEntries = Object.entries(prompt);

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
      } catch (error) {
        console.error("Error fetching monitored keywords:", error);
      }
    };

    fetchMonitoredKeywords();
  }, [user?.id]);

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
        // Set default to attached brand if available
        if (brand && data?.some((b) => b.id === brand.id)) {
          setScheduleBrand(brand);
        } else if (data && data.length > 0) {
          setScheduleBrand(data[0] as unknown as Brand);
        }
      } catch (error) {
        console.error("Error fetching brands:", error);
      }
    };

    fetchBrands();
  }, [user?.id, brand]);

  // Function to export keywords data to CSV
  const exportKeywordsToCSV = (keywords: Record<string, KeywordData>) => {
    if (!keywords || Object.keys(keywords).length === 0) {
      alert("No keyword data available to export");
      return;
    }

    // Convert keywords object to array and prepare CSV data
    const keywordArray = Object.entries(keywords).map(
      ([, keyword]: [string, KeywordData]) => ({
        "Conversational Keyword": keyword.conversational_keyword || "",
        "Seed Keyword": keyword.google_seed_keyword || "",
        Intent: keyword.intent || "",
        "Search Volume": keyword.search_volume || 0,
        "Competition Index": keyword.competition_index || 0,
        CPC: keyword.low_cpc || "",
        "Trend (6M)": keyword.trend_6m || "",
        "Relevance Score": keyword.relevance_score || 0,
        Category: keyword.category || "",
      })
    );

    // Create CSV headers
    const headers = Object.keys(keywordArray[0]);

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...keywordArray.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row];
            // Escape commas and quotes in values
            const escaped = String(value).replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(",")
      ),
    ].join("\n");

    // Create and download the file
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
  };

  // Check for existing steps on component mount
  useEffect(() => {
    if (monitoringId) {
      fetchExistingSteps();
    }
  }, [monitoringId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchExistingSteps = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/generate-steps?monitoringId=${monitoringId}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.steps && data.steps.length > 0) {
          setStepsData(data.steps[0].steps_data);
        }
      }
    } catch (err) {
      console.error("Error fetching existing steps:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleKeyword = async () => {
    if (!selectedKeyword || !user?.id) return;

    setIsScheduling(true);
    toast.info(
      `Monitoring "${selectedKeyword.conversational_keyword}" has started. This may take some time`
    );

    try {
      if (subscription?.price_id === null && monitoredKeywords.length >= 1) {
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
          query: editedKeyword || selectedKeyword?.conversational_keyword || "",
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

      setShowScheduleModal(false);
      setSelectedKeyword(null);
    } catch (error) {
      toast.error("Failed to schedule keyword monitoring. Please try again.");
      console.error(error);
    } finally {
      setIsScheduling(false);
    }
  };

  const openScheduleModal = (keyword: KeywordData) => {
    if (subscription?.price_id === null && monitoredKeywords.length >= 1) {
      toast.error(
        "You have reached the limit of 1 monitored keyword. Please upgrade to a paid plan to monitor more keywords."
      );
      return;
    } else {
      setSelectedKeyword(keyword);
      setEditedKeyword(keyword.conversational_keyword);
      // Reset to defaults when opening modal
      setScheduleMode("Explorer");
      setScheduleBrand(
        brand || (availableBrands.length > 0 ? availableBrands[0] : null)
      );
      setShowScheduleModal(true);
    }
  };

  const generateSteps = async () => {
    console.log("Generate steps called with:", {
      citations,
      monitoringId,
      prompt,
      country,
      user: user?.id,
    });

    if (!citations || citations.length === 0) {
      setError("No citations available for steps generation");
      return;
    }

    if (!user?.id) {
      setError("User authentication required");
      return;
    }

    if (!monitoringId || monitoringId.trim() === "") {
      setError("Invalid monitoring ID");
      return;
    }

    if (!prompt || prompt.trim() === "") {
      setError("Query prompt is required");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Extract URLs from the new citation schema
      const extractedUrls: string[] = [];

      citations.forEach((citation: CitationData) => {
        if (citation && typeof citation === "object") {
          // Extract from direct url field (flattened structure from dashboard)
          if (citation.url && typeof citation.url === "string") {
            const trimmedUrl = citation.url.trim();
            if (trimmedUrl !== "" && !extractedUrls.includes(trimmedUrl)) {
              extractedUrls.push(trimmedUrl);
            }
          }
          // Legacy support: Extract from url_citation.url field (if it still exists)
          else if (
            citation.url_citation?.url &&
            typeof citation.url_citation.url === "string"
          ) {
            const trimmedUrl = citation.url_citation.url.trim();
            if (trimmedUrl !== "" && !extractedUrls.includes(trimmedUrl)) {
              extractedUrls.push(trimmedUrl);
            }
          }
        }
      });

      if (extractedUrls.length === 0) {
        setError("No valid URLs found in citations");
        return;
      }

      const payload = {
        prompt: prompt.trim(),
        country: country || "United States",
        citations: extractedUrls,
        monitoringId: monitoringId.trim(),
        userId: user.id,
        brandName: brand?.name || "",
        brandIndustry: brand?.industry || "",
        brandLogoUrl: brand?.logo_url || "",
        brandWebsite: brand?.website || "",
        brandLanguage: brand?.language || "",
        brandLocation: brand?.location || "",
      };

      console.log("Sending payload to generate-steps:", payload);

      const response = await fetch("/api/generate-steps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Response:", errorData);
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setStepsData(data.stepsData);
    } catch (err) {
      console.error("Error generating steps:", err);
      setError(err instanceof Error ? err.message : "Failed to generate steps");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return <StepsLoadingSkeleton />;
  }

  if (!citations || citations.length === 0) {
    return (
      <div className="text-center py-8">
        <TbSearch className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          No Citations Available
        </h3>
        <p className="text-sm text-muted-foreground">
          Steps generation requires citations from the AI analysis. Please wait
          for the analysis to complete.
        </p>
      </div>
    );
  }

  if (!stepsData && !isGenerating) {
    return (
      <div className="text-center py-8">
        <TbSparkles className="w-12 h-12 mx-auto text-primary mb-4" />
        <h3 className="text-lg font-medium mb-2">Generate Search Steps</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Create detailed search steps and keyword analysis based on the
          citations from your monitoring query.
        </p>
        <Button
          onClick={generateSteps}
          disabled={isGenerating}
          className="mb-4"
        >
          <TbSparkles className="w-4 h-4 mr-2" />
          Generate Steps
        </Button>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="text-center py-8">
        <TbLoader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
        <h3 className="text-lg font-medium mb-2">Generating Steps...</h3>
        <p className="text-sm text-muted-foreground">
          This may take up to 30 seconds. You can navigate away and come back
          later.
        </p>
      </div>
    );
  }

  if (!stepsData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No steps data available.</p>
        <Button onClick={generateSteps} variant="outline" className="mt-4">
          <TbRefresh className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 border border-accent rounded-lg"
    >
      <div
        className={cn(
          "flex flex-col gap-6",
          orientation === "horizontal" && "flex-row"
        )}
      >
        {/* Search Categories with Stepper */}
        <Card className="border-none">
          <CardHeader>
            <CardTitle className="flex-col flex items-start gap-4">
              <div className="flex gap-2">
                <TbSearch className="w-5 h-5 text-primary" />
                Steps and searches done by llms (Chain of thought/Query Fan out)
              </div>
              <p className="text-sm text-muted-foreground italic">
                Cover this topic clusters:
              </p>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {stepsData?.output?.categories.map((category, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex items-start gap-6 pb-0"
                >
                  {/* Stepper Indicator */}
                  <div className="flex flex-col items-center">
                    {/* Step Number Circle - aligned with header */}
                    <motion.div
                      className="flex items-center justify-center w-2 h-2 rounded-full bg-neutral-800 text-primary-foreground text-sm font-semibold shadow-lg relative mt-1.5"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: index * 0.1 + 0.2,
                        type: "spring",
                        stiffness: 300,
                      }}
                    >
                      {/* Pulse ring animation */}
                      <motion.div
                        className="absolute inset-0 rounded-full bg-primary/20"
                        initial={{ scale: 1, opacity: 0 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{
                          delay: index * 0.1 + 0.5,
                          duration: 1.5,
                          repeat: Infinity,
                          repeatDelay: 2,
                        }}
                      />
                    </motion.div>

                    {/* Connecting Line - continuous */}
                    <motion.div
                      className="w-0.5 bg-muted/80 "
                      style={{
                        height:
                          index === stepsData.output.categories.length - 1
                            ? "80px"
                            : "80px",
                      }}
                      initial={{ height: 0 }}
                      animate={{
                        height:
                          index === stepsData.output.categories.length - 1
                            ? "80px"
                            : "80px",
                      }}
                      transition={{ delay: index * 0.1 + 0.4, duration: 0.5 }}
                    />
                  </div>

                  {/* Step Content */}
                  <div className="flex-1">
                    <h4 className="font-semibold mb-3 text-foreground">
                      Cluster {index + 1}: {category.header}
                    </h4>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {category.subsearches.map((search, searchIndex) => (
                        <Badge
                          key={searchIndex}
                          variant="secondary"
                          className="text-xs py-1.5 px-3 flex items-center rounded-md bg-muted/50 text-muted-foreground hover:bg-muted/80 transition-colors"
                        >
                          <Search className="w-3 h-3 mr-2" />
                          {search}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Completion Indicator */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: stepsData?.output?.categories?.length * 0.1 + 0.2,
                }}
                className="flex items-center gap-6"
              >
                {/* Final Step Indicator */}
                <motion.div
                  className="flex items-center justify-center w-2 h-2 rounded-full bg-neutral-800 relative"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: stepsData?.output?.categories?.length * 0.1 + 0.4,
                    type: "spring",
                    stiffness: 300,
                  }}
                ></motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    delay: stepsData?.output?.categories?.length * 0.1 + 0.6,
                  }}
                  className="text-sm text-muted-foreground italic"
                >
                  Search analysis steps completed. Your Brand need to be mentioned on this searches in order to appear on llms.
                </motion.div>
              </motion.div>
            </div>
          </CardContent>
        </Card>

        {/* Keywords Analysis */}
        <Card
          className={cn(
            orientation === "horizontal"
              ? "!border-l border-accent border-0 rounded-none"
              : "border-none"
          )}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-between w-full">
              <div className="flex flex-col gap-2">
                <p>Keyword Analysis</p>
                <p className="text-xs text-muted-foreground italic">
                  🧠 LLMs split 1 prompt into multiple searches on Google/Bing.
                  To rank on ChatGPT, Gemini, Perplexity, you need to rank first
                  on these keywords on Google/Bing
                </p>
                <Badge variant="outline" className="w-fit">
                  {Object.keys(stepsData?.output?.keywords || {}).length}{" "}
                  keywords
                </Badge>
              </div>
              <Button
                onClick={() =>
                  exportKeywordsToCSV(stepsData?.output?.keywords || {})
                }
                size="sm"
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="">
            <ScrollArea
              className={`rounded-lg bg-muted/20 ${
                orientation === "horizontal" ? "h-[700px]" : "h-[480px]"
              }`}
            >
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-muted">
                    <TableHead className="font-semibold text-foreground w-2/3">
                      AI Prompt
                    </TableHead>
                    <TableHead className="font-semibold text-foreground">
                      Google Seed Keyword
                    </TableHead>
                    <TableHead className="font-semibold text-foreground">
                      Intent
                    </TableHead>
                    <TableHead className="font-semibold text-foreground text-right">
                      Volume
                    </TableHead>
                    <TableHead className="font-semibold text-foreground text-center">
                      Difficulty
                    </TableHead>
                    <TableHead className="font-semibold text-foreground text-center">
                      CPC
                    </TableHead>
                    <TableHead className="font-semibold text-foreground text-center">
                      Trend
                    </TableHead>
                    <TableHead className="font-semibold text-foreground text-center">
                      Score
                    </TableHead>
                    <TableHead className="font-semibold text-foreground">
                      Category
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(stepsData?.output?.keywords || {}).map(
                    ([key, keyword], index) => (
                      <motion.tr
                        key={key}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-muted/30 hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => openScheduleModal(keyword)}
                      >
                        <TableCell className="py-4">
                          <div>
                            <p className="font-medium text-sm text-foreground mb-1 hover:text-blue-500 transition-colors break-words whitespace-normal">
                              {keyword.conversational_keyword}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className=" text-foreground text-sm">
                            {keyword.google_seed_keyword}
                          </div>
                        </TableCell>

                        <TableCell className="py-4">
                          <div>
                            <Badge
                              variant="outline"
                              className="text-xs py-1 bg-gradient-to-t from-zinc-500/30 to-muted/20"
                            >
                              {keyword.intent}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <p className="font-medium text-sm">
                            {keyword.search_volume.toLocaleString()}
                          </p>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              keyword.competition_index >= 7
                                ? "text-red-600"
                                : keyword.competition_index >= 4
                                ? "text-orange-500"
                                : "text-green-600"
                            )}
                          >
                            {keyword.competition_index}/10
                          </span>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <p className="font-medium text-sm">
                            {keyword.low_cpc}
                          </p>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <p
                            className={cn(
                              "font-medium text-sm",
                              keyword.trend_6m.includes("+")
                                ? "text-green-600"
                                : keyword.trend_6m.includes("-")
                                ? "text-red-600"
                                : "text-muted-foreground"
                            )}
                          >
                            {keyword.trend_6m}
                          </p>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <span
                            className={cn(
                              "inline-block px-3 py-1 rounded-full text-xs font-medium text-white",
                              keyword.relevance_score >= 8
                                ? "bg-gradient-to-b from-green-300/40 to-green-800/20 border border-green-800"
                                : keyword.relevance_score >= 5
                                ? "bg-gradient-to-b from-orange-500/40 to-orange-800/20 border border-orange-600"
                                : "bg-gradient-to-b from-red-400/20 to-red-600/50 border border-red-600"
                            )}
                          >
                            {keyword.relevance_score}/10
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge variant="outline" className="text-xs">
                            {keyword.category}
                          </Badge>
                        </TableCell>
                      </motion.tr>
                    )
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Regenerate Button */}
      {/* <div className="flex justify-center">
        <Button onClick={generateSteps} variant="outline" disabled={isGenerating}>
          <TbRefresh className="w-4 h-4 mr-2" />
          Regenerate Steps
        </Button>
      </div> */}

      {/* Schedule Keyword Modal */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Keyword Monitoring</DialogTitle>
            <DialogDescription>
              Configure monitoring settings for &quot;
              {editedKeyword || selectedKeyword?.conversational_keyword || ""}
              &quot;
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
                  <div>Competition: {selectedKeyword.competition_index}/10</div>
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
              <>
                <div className="space-y-3 w-full">
                  <label className="text-sm font-medium">Keyword</label>
                  <Input
                    value={
                      editedKeyword ||
                      selectedKeyword?.conversational_keyword ||
                      ""
                    }
                    onChange={(e) => setEditedKeyword(e.target.value)}
                    className="w-full"
                  />
                </div>

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
                          Explorer - Comprehensive Analysis
                        </SelectItem>
                        <SelectItem value="Voyager">
                          Voyager - Focused Analysis
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
                        onValueChange={(value: "daily" | "weekly") =>
                          setScheduleFrequency(value)
                        }
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
                              value={country.label}
                            >
                              {country.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleScheduleKeyword}
                disabled={isScheduling}
                className="flex-1 bg-blue-600 hover:bg-blue-500"
              >
                {isScheduling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Calendar className="w-4 h-4" />
                )}
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

function StepsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[200px]" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-[60px] mb-1" />
                  <Skeleton className="h-4 w-[80px]" />
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[150px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <Skeleton className="h-5 w-[200px] mb-3" />
                  <div className="flex flex-wrap gap-2">
                    {Array(3)
                      .fill(0)
                      .map((_, j) => (
                        <Skeleton key={j} className="h-6 w-[100px]" />
                      ))}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[150px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-[200px] mb-3" />
                  <div className="grid grid-cols-4 gap-3">
                    {Array(4)
                      .fill(0)
                      .map((_, j) => (
                        <Skeleton key={j} className="h-8 w-full" />
                      ))}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
