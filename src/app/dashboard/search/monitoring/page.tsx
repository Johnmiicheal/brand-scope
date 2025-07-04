/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow, parseISO, format } from "date-fns";
import { TbGitMerge, TbScanPosition, TbSearch, TbSparkles, TbTableSpark } from "react-icons/tb";
import ReactMarkdown from "react-markdown";
import { Claude, Gemini, OpenAI, Perplexity } from "@lobehub/icons";
import { GoogleSearchResult, Search } from "@/types/search";
import { GoogleSearch } from "@/types/search";
import { GoogleResults } from "@/components/ui/google-results";
import { Globe } from "lucide-react";
import { StepsTabContent } from "@/components/monitoring/steps-tab-content";
import type { ReactElement } from "react";

// --- Zod Schemas ---
const BrandResultSchema = z.object({
  name: z.string(),
  rank: z.number().min(1).max(10),
  score: z.number().min(0).max(100),
  reasoning: z.string(),
});
const LLMOutputSchema = z.object({
  brands: z.array(BrandResultSchema),
});
const AnalysisModelResultSchema = z.object({
  llm_name: z.string(),
  status: z.enum(["fulfilled", "rejected"]),
  data: LLMOutputSchema.nullable().optional(),
  error: z.string().nullable().optional(),
});
const AnalysisModelSummarySchema = z.object({
  model: z.string(),
  summary: z.string(),
  query: z.string(),
  reasoning: z.array(z.object({
    url_citation: z.object({
      url: z.string(),
      title: z.string(),
      snippet: z.string(),
    }),
  })),
});

const AnalysisRunSchema = z.object({
  analysis_date: z.string().datetime(),
  model_results: z.array(AnalysisModelResultSchema),
  model_summary: z.array(AnalysisModelSummarySchema),
});

// --- Scheduled Query Type (Updated to match provided schema) ---
export type ScheduledQuery = {
  id: string;
  query: string;
  results: z.infer<typeof AnalysisRunSchema> | null; // Directly AnalysisRunSchema, not string/array
  last_analysis_at: string | null;
  next_analysis_at: string | null;
  user_id: string;
  frequency: "daily" | "weekly";
  mode: "DeepFocus" | "Voyager" | "Explorer" | null;
  mode_id: string | null;
  status: "active" | "paused" | "error";
  location: string | null;
};

// --- Monitoring Results Interface (Updated to match provided schema) ---
interface MonitoringResults {
  search_id: string;
  mode: string;
  mode_id: string;
  monitoring: Array<ScheduledQuery>;
  searches: Array<Search>;
  search_results: Array<GoogleSearch>;
}

// --- Helper Functions ---
const formatRelativeDate = (dateString: string | null): string => {
  if (!dateString) return "--";
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (e) {
    return "Invalid Date";
  }
};

// --- MonitoringContent Component ---
function MonitoringContent() {
  const searchParams = useSearchParams();
  const queryId = searchParams.get("mode_id");
  const { session, user } = useAuth();
  const [scheduledQuery, setScheduledQuery] =
    useState<MonitoringResults | null>(null);
  const [analysisRun, setAnalysisRun] = useState<z.infer<
    typeof AnalysisRunSchema
  > | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>("GPT 4o");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnalysisDate, setSelectedAnalysisDate] = useState<
    string | null
  >(null);

  useEffect(() => {
    const fetchScheduledQuery = async () => {
      if (!queryId) {
        setError("No query ID provided.");
        setLoading(false);
        return;
      }
      if (!user?.id) {
        setLoading(true);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let url = "/api/monitoring";
        if (queryId) {
          url += `?mode_id=${queryId}`;
        } else {
          throw new Error("No mode_id provided");
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

        const data: MonitoringResults = await response.json();
        setScheduledQuery(data);

        // Extract the results from monitoring[0]
        const firstResult = data.monitoring[0];
        if (firstResult?.results) {
          setAnalysisRun(firstResult.results);
          // Set the default model if results exist
          const models =
            Array.isArray(firstResult.results) && firstResult.results.length > 0
              ? [
                  ...new Set(
                    firstResult.results.flatMap(
                      (run) =>
                        run.model_results?.map(
                          (r: { llm_name: string }) => r.llm_name
                        ) || []
                    )
                  ),
                ]
              : [];
          setSelectedModel(models[0] || null);
          // Set the default analysis date to the most recent
          if (
            Array.isArray(firstResult.results) &&
            firstResult.results.length > 0
          ) {
            const sorted = [...firstResult.results].sort(
              (a, b) =>
                new Date(b.analysis_date).getTime() -
                new Date(a.analysis_date).getTime()
            );
            setSelectedAnalysisDate(sorted[0].analysis_date);
          }
        } else {
          setAnalysisRun(null);
          setSelectedModel(null);
        }
      } catch (err) {
        console.error("Error fetching scheduled query details:", err);
        setError(
          err instanceof Error
            ? err.message
            : "An unknown error occurred while fetching data."
        );
        setScheduledQuery(null);
        setAnalysisRun(null);
      } finally {
        setLoading(false);
      }
    };

    fetchScheduledQuery();
  }, [queryId, user?.id, session]);

  //   console.log(analysisRun)

  // --- Memos for filtered results ---
  const filteredModelResults = useMemo(() => {
    if (!analysisRun || !Array.isArray(analysisRun)) return [];

    return analysisRun
      ?.filter((item) => item.analysis_date === selectedAnalysisDate)
      .flatMap(
        (run) =>
          run.model_results?.filter(
            (r: { llm_name: string }) =>
              !selectedModel || r.llm_name === selectedModel
          ) || []
      );
  }, [analysisRun, selectedAnalysisDate, selectedModel]);

  const filteredModelSummary = useMemo(() => {
    if (!analysisRun || !Array.isArray(analysisRun)) return null;

    const summaries = analysisRun
      ?.filter((item) => item.analysis_date === selectedAnalysisDate)
      .flatMap(
        (run) =>
          run.model_summary?.filter(
            (r: { model: string }) =>
              !selectedModel || r.model === selectedModel
          ) || []
      );

    // Return the first matching summary or null if none found
    return summaries.length > 0 ? summaries[0] : null;
  }, [analysisRun, selectedAnalysisDate, selectedModel]);

  const modelsInRun = useMemo(() => {
    if (!analysisRun || !Array.isArray(analysisRun)) return [];

    const allModels = analysisRun.flatMap(
      (run) =>
        run.model_results?.map((r: { llm_name: string }) => r.llm_name) || []
    );

    return [...new Set(allModels)];
  }, [analysisRun]);

  // Extract sources from citations
  const citations = useMemo(() => {
    if (!analysisRun || !Array.isArray(analysisRun)) return [];

    // Get citations from the first run that matches the selected date
    const selectedRun = analysisRun.find(
      (run) => run.analysis_date === selectedAnalysisDate
    );

    return selectedRun?.model_citations || [];
  }, [analysisRun, selectedAnalysisDate]);

  // console.log("Citations: ", citations)

  const analysisDates = useMemo(() => {
    if (!analysisRun || !Array.isArray(analysisRun)) return [];
    return [...new Set(analysisRun.map((run) => run.analysis_date))];
  }, [analysisRun]);

  // --- Render Logic ---
  if (loading) return <MonitoringLoadingState />;
  if (error)
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
  if (!scheduledQuery || !scheduledQuery.monitoring[0])
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested scheduled query could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );

  const firstResult = scheduledQuery.monitoring[0];

  return (
    <div className="mx-auto p-2 sm:p-4 w-full h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-lg p-3 sm:p-6 w-full"
      >
        {/* Display Basic Scheduled Query Info Card */}
        <Card className="mb-6 bg-background">
          <CardHeader>
            <CardTitle className="break-words">
              Monitoring:{" "}
              <span className="text-primary">{firstResult.query}</span>
            </CardTitle>
            <CardDescription>
              Details and analysis history for this scheduled query.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Frequency</p>
              <p className="font-medium capitalize">{firstResult.frequency}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Mode</p>
              <p>
                {firstResult.mode ? (
                  <Badge variant="outline">{firstResult.mode}</Badge>
                ) : (
                  "--"
                )}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Location</p>
              <p className="font-medium capitalize flex items-center">
                <span>
                  <Globe className="w-4 h-4 mr-1" />{" "}
                </span>
                {firstResult.location}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p>
                <Badge
                  variant={
                    firstResult.status === "active" ? "success" : "secondary"
                  }
                >
                  {firstResult.status}
                </Badge>
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Next Run</p>
              <p>{formatRelativeDate(firstResult.next_analysis_at)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Date Filter */}
        {analysisRun && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4 sm:mb-6 w-full gap-9">
            <div className="w-full sm:w-[200px]">
              <Select
                value={selectedAnalysisDate || ""}
                onValueChange={setSelectedAnalysisDate}
                disabled={analysisDates.length === 0}
              >
                <SelectTrigger className="bg-background border-accent">
                  <SelectValue placeholder="Filter by Date" />
                </SelectTrigger>
                <SelectContent className="p-1">
                  {analysisDates.map((date) => (
                    <SelectItem key={date} value={date}>
                      {format(new Date(date), "PPpp")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-[200px]">
              <Select
                value={selectedModel!}
                onValueChange={(value) => {
                  setSelectedModel(value);
                }}
                disabled={!analysisRun || modelsInRun.length === 0}
              >
                <SelectTrigger className="bg-background border-accent">
                  <SelectValue placeholder="Filter by Model" />
                </SelectTrigger>
                <SelectContent className="p-1">
                  {modelsInRun.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Display Results Card */}
        {!analysisRun ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No analysis results available for this query yet.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Analysis Run Details</CardTitle>
              <CardDescription>
                Showing results from{" "}
                {format(new Date(selectedAnalysisDate || "000"), "PPp")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnalysisRunDetailsContent
                modelResults={filteredModelResults}
                modelSummary={filteredModelSummary}
                selectedModel={selectedModel}
                searchResults={scheduledQuery?.search_results[0]?.results}
                rankings={scheduledQuery?.search_results[0]?.rankings}
                scheduledQuery={scheduledQuery}
              />
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}

// --- Main Page Component ---
export default function MonitoringPage() {
  return (
    <Suspense fallback={<MonitoringLoadingState />}>
      <MonitoringContent />
    </Suspense>
  );
}

// --- Loading State Component ---
function MonitoringLoadingState() {
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
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-12 w-full bg-zinc-700" />
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}

// --- AnalysisRunDetailsContent Component ---
function AnalysisRunDetailsContent({
  modelResults,
  modelSummary,
  selectedModel,
  searchResults,
  rankings,
  scheduledQuery,
}: {
  modelResults: NonNullable<z.infer<typeof AnalysisRunSchema>["model_results"]>;
  modelSummary: z.infer<typeof AnalysisModelSummarySchema> | null;
  selectedModel: string | null;
  searchResults: GoogleSearchResult | undefined;
  rankings: unknown;
  scheduledQuery: MonitoringResults | null;
}): ReactElement {
  // Filter logic
  const filteredResults = useMemo(() => {
    return selectedModel === "__all__"
      ? modelResults
      : modelResults?.filter((r) => r.llm_name === selectedModel);
  }, [modelResults, selectedModel]);

  const citations = modelSummary?.model === selectedModel ? modelSummary?.reasoning : null;

  if (!filteredResults || filteredResults.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-4">
        No results found for the selected model in this run.
      </p>
    );
  }

  return (
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

          {modelSummary && (
            <TabsTrigger
              value="summary"
              className="data-[state=active]:bg-zinc-700 cursor-pointer whitespace-nowrap"
            >
              <TbSparkles className="w-4 h-4 mr-1 hidden sm:inline" />
              AI Response
            </TabsTrigger>
          )}

          <TabsTrigger
            value="citations"
            className="data-[state=active]:bg-zinc-700 cursor-pointer whitespace-nowrap"
          >
            <TbScanPosition className="w-4 h-4 mr-1 hidden sm:inline" />
            Citations
          </TabsTrigger>

          <TabsTrigger
            value="steps"
            className="data-[state=active]:bg-zinc-700 cursor-pointer whitespace-nowrap"
          >
            <TbGitMerge className="w-4 h-4 mr-1 hidden sm:inline" />
            Steps
          </TabsTrigger>

          {searchResults && (
            <TabsTrigger
              value="google"
              className="data-[state=active]:bg-zinc-700 cursor-pointer whitespace-nowrap"
            >
              <TbSearch className="w-4 h-4 mr-1 hidden sm:inline" />
              Google Search
            </TabsTrigger>
          )}
        </TabsList>
      </div>

      <TabsContent value="rankings" className="space-y-4">
        <RankingsTabContent rankings={modelResults} />
      </TabsContent>

      <TabsContent value="summary" className="space-y-4">
        {modelSummary && <SummaryTabContent item={modelSummary} />}
      </TabsContent>

      <TabsContent value="citations" className="space-y-4">
        <CitationsTabContent citations={citations} />
      </TabsContent>

      <TabsContent value="steps" className="space-y-4">
        {(() => {
          const stepsProps = {
            citations: citations ? citations.map(c => c.url_citation) : null,
            monitoringId: scheduledQuery?.monitoring[0]?.mode_id || scheduledQuery?.mode_id || "",
            prompt: scheduledQuery?.monitoring[0]?.query || "",
            country: scheduledQuery?.monitoring[0]?.location || "United States"
          };
          console.log('StepsTabContent props:', stepsProps);
          return (
            <StepsTabContent 
              citations={stepsProps.citations}
              monitoringId={stepsProps.monitoringId}
              prompt={stepsProps.prompt}
              country={stepsProps.country}
            />
          );
        })()}
      </TabsContent>

      <TabsContent value="google" className="space-y-4">
        {searchResults && <GoogleResults googleResults={searchResults} rankings={rankings} />}
      </TabsContent>
    </Tabs>
  );
}

// --- AnalysisLoadingState Component ---
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
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-12 w-full bg-zinc-700" />
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}

interface Citation {
  url_citation: {
    url: string;
    title: string;
    snippet: string;
  };
}

// Citations tab content
function CitationsTabContent({
  citations,
}: {
  citations: z.infer<typeof AnalysisModelSummarySchema>["reasoning"] | null;
}): ReactElement {
  if (!citations || citations.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">No citations available.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {citations.map((citation, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                type: "spring",
                damping: 15,
                stiffness: 100,
                delay: index * 0.1,
              }}
            >
              <Card className="h-full bg-zinc-800/50 border-accent hover:bg-zinc-800/70 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium line-clamp-2">
                    {citation.url_citation.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pt-2">
                      <Badge variant="outline" className="text-xs">
                        {new URL(citation.url_citation.url).hostname}
                      </Badge>
                      <a
                        href={citation.url_citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Visit Source
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function RankingsTabContent({
  rankings,
}: {
  rankings: NonNullable<z.infer<typeof AnalysisRunSchema>["model_results"]>;
}): ReactElement {
  return (
    <div>
      <div className="gap-6">
        <motion.div
          className="space-y-4 sm:space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {Object.entries(rankings).map(([query, queryRankings]) => (
            <motion.div key={query} variants={itemVariants}>
              <div className="relative overflow-x-auto rounded-md border border-accent w-full">
                <table className="w-full text-xs sm:text-sm text-left">
                  <thead className="text-xs uppercase bg-zinc-900/50">
                    <tr>
                      <th scope="col" className="px-2 sm:px-6 py-2 sm:py-3">
                        Name
                      </th>
                      <th scope="col" className="px-2 sm:px-6 py-2 sm:py-3">
                        Rank
                      </th>
                      <th scope="col" className="px-2 sm:px-6 py-2 sm:py-3">
                        Score
                      </th>
                      <th scope="col" className="px-2 sm:px-6 py-2 sm:py-3">
                        Model
                      </th>
                      <th scope="col" className="px-2 sm:px-6 py-2 sm:py-3">
                        Reasoning
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {queryRankings.data?.brands
                        .sort((a, b) => (a.rank || 99) - (b.rank || 99))
                        .map((ranking, idx) => (
                          <motion.tr
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="border-b border-accent hover:bg-zinc-800/20"
                          >
                            <td className="px-2 sm:px-6 py-3 sm:py-4 font-medium text-white">
                              {ranking.name}
                            </td>

                            <td className="px-2 sm:px-6 py-3 sm:py-4">
                              {ranking.rank ?? "N/A"}
                            </td>
                            <td className="px-2 sm:px-6 py-3 sm:py-4">
                              {ranking.score}
                            </td>
                            <td className="px-2 sm:px-6 py-3 sm:py-4">
                              <Badge className="bg-blue-500/20 text-blue-200 border-blue-500/30 text-xs whitespace-nowrap">
                                {queryRankings.llm_name}
                              </Badge>
                            </td>
                            <td className="px-2 sm:px-6 py-3 sm:py-4 max-w-[200px] sm:max-w-md">
                              <div className="line-clamp-3 sm:line-clamp-none text-xs sm:text-sm">
                                {ranking.reasoning || "N/A"}
                              </div>
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
      </div>
    </div>
  );
}

function SummaryTabContent({
  item,
}: {
  item: NonNullable<z.infer<typeof AnalysisModelSummarySchema>>;
}): ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full space-y-6 pb-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          damping: 12,
          stiffness: 100,
          delay: 0.15,
        }}
      >
        <div className="group relative overflow-auto rounded-xl transition-all hover:shadow-lg dark:border-gray-800">
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
          </div>
        </div>
      </motion.div>
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
