/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { cn } from "@/lib/utils";

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
    status: z.enum(['fulfilled', 'rejected']),
    data: LLMOutputSchema.nullable().optional(),
    error: z.string().nullable().optional(),
});
const AnalysisRunSchema = z.object({
    analysis_date: z.string().datetime(),
    model_results: z.array(AnalysisModelResultSchema),
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
};

// --- Monitoring Results Interface (Updated to match provided schema) ---
interface MonitoringResults {
    search_id: string;
    mode: string;
    mode_id: string;
    monitoring: Array<ScheduledQuery>;
}

// --- Helper Functions ---
const formatRelativeDate = (dateString: string | null): string => {
    if (!dateString) return '--';
    try {
        const date = parseISO(dateString);
        return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) { return 'Invalid Date'; }
};

// --- Component Definition ---
export default function ScheduledQueryDetailPage() {
  const searchParams = useSearchParams();
  const queryId = searchParams.get("mode_id");
  const { session, user } = useAuth();
  const [scheduledQuery, setScheduledQuery] = useState<MonitoringResults | null>(null);
  const [analysisRun, setAnalysisRun] = useState<z.infer<typeof AnalysisRunSchema> | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>('GPT 4o');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnalysisDate, setSelectedAnalysisDate] = useState<string | null>(null);

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
          const models = Array.isArray(firstResult.results) && firstResult.results.length > 0
            ? [...new Set(firstResult.results.flatMap(run => run.model_results?.map((r: { llm_name: string; }) => r.llm_name) || []))]
            : [];
          setSelectedModel(models[0] || null);
          // Set the default analysis date to the most recent
          if (Array.isArray(firstResult.results) && firstResult.results.length > 0) {
            const sorted = [...firstResult.results].sort((a, b) => new Date(b.analysis_date).getTime() - new Date(a.analysis_date).getTime());
            setSelectedAnalysisDate(sorted[0].analysis_date);
          }
        } else {
          setAnalysisRun(null);
          setSelectedModel(null);
        }

      } catch (err) {
        console.error("Error fetching scheduled query details:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred while fetching data."
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
    
    return analysisRun?.filter((item) => item.analysis_date === selectedAnalysisDate).flatMap(run => 
      run.model_results?.filter(
        (r: { llm_name: string; }) => (!selectedModel || r.llm_name === selectedModel)
      ) || []
    );
  }, [analysisRun, selectedAnalysisDate, selectedModel]);

  const modelsInRun = useMemo(() => {
    if (!analysisRun || !Array.isArray(analysisRun)) return [];
    
    const allModels = analysisRun.flatMap(run => 
      run.model_results?.map((r: { llm_name: string; }) => r.llm_name) || []
    );
    
    return [...new Set(allModels)];
  }, [analysisRun]);

  const analysisDates = useMemo(() => {
    if (!analysisRun || !Array.isArray(analysisRun)) return [];
    return [...new Set(analysisRun.map(run => run.analysis_date))];
  }, [analysisRun]);

  // --- Render Logic ---
  if (loading) return <AnalysisLoadingState />;
  if (error) return (
      <div className="container mx-auto p-4">
        <Card>
        <CardHeader><CardTitle>Error</CardTitle></CardHeader>
        <CardContent><p className="text-red-500">{error}</p></CardContent>
        </Card>
      </div>
    );
  if (!scheduledQuery || !scheduledQuery.monitoring[0]) return (
      <div className="container mx-auto p-4">
        <Card>
        <CardHeader><CardTitle>Not Found</CardTitle></CardHeader>
        <CardContent><p>The requested scheduled query could not be found.</p></CardContent>
        </Card>
      </div>
    );

  const firstResult = scheduledQuery.monitoring[0];
//   console.log("Analysis: ", analysisRun)
//   console.log("Models", modelsInRun)

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
            <CardTitle className="break-words">Monitoring: <span className="text-primary">{firstResult.query}</span></CardTitle>
            <CardDescription>Details and analysis history for this scheduled query.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-muted-foreground">Frequency</p><p className="font-medium capitalize">{firstResult.frequency}</p></div>
            <div><p className="text-muted-foreground">Mode</p><p>{firstResult.mode ? <Badge variant="outline">{firstResult.mode}</Badge> : "--"}</p></div>
            <div><p className="text-muted-foreground">Status</p><p><Badge variant={firstResult.status === 'active' ? 'success' : 'secondary'}>{firstResult.status}</Badge></p></div>
            <div><p className="text-muted-foreground">Next Run</p><p>{formatRelativeDate(firstResult.next_analysis_at)}</p></div>
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
                  {analysisDates.map(date => (
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
                    <SelectItem key={model} value={model}>{model}</SelectItem>
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
                Showing results from {format(new Date(selectedAnalysisDate|| '000'), 'PPp')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnalysisRunDetailsContent
                modelResults={filteredModelResults}
                selectedModel={selectedModel}
              />
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}

// --- AnalysisRunDetailsContent Component ---
function AnalysisRunDetailsContent({
  modelResults,
  selectedModel
}: {
  modelResults: z.infer<typeof AnalysisRunSchema>['model_results'];
  selectedModel: string | null;
}) {
  // Filter logic
  const filteredResults = useMemo(() => {
    return selectedModel === "__all__"
      ? modelResults
      : modelResults?.filter(r => r.llm_name === selectedModel);
  }, [modelResults, selectedModel]);

  if (!filteredResults || filteredResults.length === 0) {
    return <p className="text-muted-foreground text-center py-4">No results found for the selected model in this run.</p>;
  }

  return (
    <div className="gap-6">
        <motion.div
      className="space-y-4 sm:space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {Object.entries(filteredResults).map(([query, queryRankings]) => (
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
                        
                        <td className="px-2 sm:px-6 py-3 sm:py-4">{ranking.rank ?? "N/A"}</td>
                        <td className="px-2 sm:px-6 py-3 sm:py-4">{ranking.score}</td>
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
  );
}

// --- AnalysisLoadingState Component ---
function AnalysisLoadingState() {
  return (
    <div className="mx-auto p-2 sm:p-4 bg-gradient-to-b from-background to-zinc-900 w-full h-full">
      <div className="rounded-lg p-3 sm:p-6 border border-accent">
        <div className="mb-4 sm:mb-6">
          <Skeleton className="h-8 sm:h-10 w-[180px] sm:w-[250px] mb-2 bg-zinc-800" />
          <Skeleton className="h-4 sm:h-5 w-[120px] sm:w-[150px] bg-zinc-800" />
        </div>
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
              <Card key={i} className="bg-zinc-800/50 border-accent">
              <CardHeader><Skeleton className="h-6 sm:h-7 w-[150px] sm:w-[200px] mb-2 bg-zinc-700" /></CardHeader>
              <CardContent><Skeleton className="h-12 w-full bg-zinc-700" /></CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
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