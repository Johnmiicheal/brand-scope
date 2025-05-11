/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */

"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Brand,
  BrandDataProvider,
  useBrandData,
} from "@/contexts/brand-data-context";
import { LoadingState } from "@/components/loading-state";
import ShinyText from "@/components/ui/shiny-text";
import { motion, AnimatePresence } from "framer-motion";
import { MetricsHeader } from "@/components/dashboard/metrics-card";
import { KeywordCloud } from "@/components/dashboard/keyword-cloud";
import { CompetitorNetwork } from "@/components/dashboard/competitor-network";
import { BrandInsights } from "@/components/dashboard/insights-card";
import Image from "next/image";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import {
  ChevronDown,
  Clock9,
  CloudUpload,
  RefreshCcw,
  SquareArrowOutUpRight,
  Star,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import {
  ScheduledQueriesList,
  ScheduledQuery,
} from "@/components/library/scheduled-queries-list";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";
import { ScrollArea } from "@/components/ui/scroll-area";

const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Retail",
  "Food & Beverage",
  "Travel",
  "Entertainment",
  "Education",
  "Real Estate",
  "Manufacturing",
  "Automotive",
  "Energy",
  "Telecommunications",
];

// Define props for the new table component
interface IndustryRankingsTableProps {
  brands: {
    brand_name: string;
    gpt_mentions: number;
    claude_mentions: number;
    perplexity_mentions: number;
    gemini_mentions: number;
    total_mentions: number;
  }[]
}

// Updated component for the Industry Rankings Table
function IndustryRankingsTable({
  brands
}: IndustryRankingsTableProps) {
  if(!brands) return null;
  const all_total_mentions = brands.reduce((acc, brand) => acc + brand.total_mentions, 0);

  return (
    <Card className="bg-background border-accent text-white">
      <CardHeader>
        <CardTitle>Brand Ranking</CardTitle>
        <CardDescription>
          Brands ranked by visibility score
        </CardDescription>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px] sticky top-0 bg-background">Rank</TableHead>
                  <TableHead className="sticky top-0 bg-background">Entity</TableHead>
                  <TableHead className="text-right sticky top-0 bg-background">Visibility %</TableHead>
                  <TableHead className="text-right sticky top-0 bg-background">Mentions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground"
                    >
                      No ranking data available yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  brands.map((entity, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="flex items-center gap-2">
                        {entity.brand_name}
                      </TableCell>
                      <TableCell className="text-right">
                        {((entity.total_mentions / all_total_mentions) * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {entity.total_mentions}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </motion.div>
      </CardContent>
    </Card>
  );
}



function DashboardContent() {
  const router = useRouter();
  const { brand, metrics, competitors, keywords, isLoading, error, refetch } =
    useBrandData();
  const [sessionKey, setSessionKey] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<ScheduledQuery | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      }
      setSessionKey(session?.access_token || "");
      setUser(session?.user || null);
    };
    checkAuth();
  }, [router]);

  // Function to fetch scheduled queries for the dashboard
  const [queries, setQueries] = useState<ScheduledQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  useEffect(() => {
    async function fetchScheduledQueries() {
      if (!sessionKey) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/monitoring?user_id=${user?.id}`);

        if (!response.ok) {
          throw new Error(
            `Error fetching scheduled queries: ${response.statusText}`
          );
        }

        const data = await response.json();

        if (data && data.monitoring) {
          setQueries(data.monitoring);
          setSelectedQuery(data.monitoring[0]);
        } else {
          setQueries([]);
        }
      } catch (error) {
        console.error("Failed to fetch scheduled queries:", error);
        toast({
          title: "Error",
          description:
            "Failed to load scheduled queries. Please try again later.",
          variant: "destructive",
        });
        setQueries([]);
      } finally {
        setLoading(false);
      }
    }

    fetchScheduledQueries();
  }, [sessionKey, toast, user?.id]);

  const [isExpanded, setIsExpanded] = useState(false);

  const results = selectedQuery?.results;
  const analysis_dates = results?.map((result: { analysis_date: string; }) => result.analysis_date);

  const analysis_models = useMemo(() => {
    if (!results || !Array.isArray(results)) return [];
    const allModels = results?.flatMap((result: { model_results: { llm_name: string; }[]; }) => 
      result.model_results?.map((r: { llm_name: string; }) => r.llm_name) || []
    );
    return [...new Set(allModels)];
  }, [results]);

  const analysis_brands = useMemo(() => {
    if (!results || !Array.isArray(results)) return [];
    const allBrands = results.flatMap((result: { model_results: { llm_name: string; data: { brands: any[]; }; }[]; }) => 
      result.model_results?.flatMap((r: { llm_name: string; data: { brands: any[]; }; }) => 
        r.data?.brands || []
      )
    ).filter(Boolean);
    return [...new Set(allBrands)];
  }, [results]);

  // Calculate brand mentions in model summaries
  const brandMentionsInSummaries = useMemo(() => {
    if (!results || !Array.isArray(results) || !analysis_brands || analysis_brands.length === 0) {
      return [];
    }

    // Initialize a map to store brand mentions
    const brandMentionsMap = new Map();

    // Process each brand
    analysis_brands.forEach(brand => {
      const brandName = brand.name;
      const mentions = {
        gpt_mentions: 0,
        claude_mentions: 0,
        perplexity_mentions: 0,
        gemini_mentions: 0,
      };

      // Process each model's results
      results.forEach(result => {
        result.model_results?.forEach((modelResult: { llm_name: string; data: { brands: any[]; }; }) => {
          const modelName = modelResult.llm_name.toLowerCase();
          
          // Count mentions in brand data
          const brandData = modelResult.data?.brands?.find(b => b.name === brandName);
          if (brandData) {
            let mentionCount = 1; // Count direct mention in brand analysis
            
            // Add mentions from reasoning if available
            if (brandData.reasoning) {
              const reasoningMatches = brandData.reasoning.match(new RegExp(`\\b${brandName}\\b`, 'gi'));
              if (reasoningMatches) {
                mentionCount += reasoningMatches.length;
              }
            }

            // Assign mentions to the appropriate model
            if (modelName.includes('gpt')) {
              mentions.gpt_mentions += mentionCount;
            } else if (modelName.includes('claude')) {
              mentions.claude_mentions += mentionCount;
            } else if (modelName.includes('perplexity')) {
              mentions.perplexity_mentions += mentionCount;
            } else if (modelName.includes('gemini')) {
              mentions.gemini_mentions += mentionCount;
            }
          }
        });
      });

      const total_mentions = Object.values(mentions).reduce((sum, count) => sum + count, 0);
      
      if (total_mentions > 0) {
        brandMentionsMap.set(brandName, {
          brand_name: brandName,
          ...mentions,
          total_mentions
        });
      }
    });

    // Convert map to array and sort by total mentions
    return Array.from(brandMentionsMap.values())
      .sort((a, b) => b.total_mentions - a.total_mentions);
  }, [results, analysis_brands]);

  // For debugging
  // console.log("Brand Mentions:", brandMentionsInSummaries);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-3xl">
          <div className="flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <ShinyText
              text="Fetching your latest data..."
              disabled={false}
              speed={3}
              className="font-medium text-sm"
            />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="min-h-screen flex-1">
            <div className="space-y-6">
              <motion.div
                className="w-full flex justify-between rounded-md p-3 items-center bg-accent border-dashed border-1 cursor-pointer hover:bg-accent/80 transition duration-300"
                onClick={() => setIsExpanded(!isExpanded)}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2">
                  <Clock9 className="w-4 h-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {currentTime.toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: false,
                    })}
                  </p>
                  {"•"}
                  <p>{queries.length} active prompts</p>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              </motion.div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <Card className="bg-background rounded-md p-4">
                      <ScheduledQueriesList 
                        queries={queries} 
                        onSelectQuery={(query) => {
                          setSelectedQuery(query);
                          setIsExpanded(false); // Close the list after selection
                        }}
                      />
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Display selected query info
              {selectedQuery && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-accent/50 rounded-lg p-4 mb-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium mb-1">
                        Currently Viewing: {selectedQuery.query}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Mode: {selectedQuery.mode}</span>
                        <span>•</span>
                        <span>Frequency: {selectedQuery.frequency}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedQuery(null)}
                    >
                      Clear
                    </Button>
                  </div>
                </motion.div>
              )} */}

              <MetricsHeader metrics={metrics} competitors={competitors} />
                {/* Industry Ranking Table - Full width */}
                <div className="lg:col-span-2">
                  <IndustryRankingsTable
                    brands={brandMentionsInSummaries}
                  />
                </div>

              {/* Main content grid */}
              <div className="flex flex-col lg:flex-row w-full gap-6 h-full">
                {/* Left column - Make keyword cloud take full width */}
                <div className="space-y-6 lg:w-[65%] h-full">
                  <KeywordCloud keywords={keywords} />
                </div>

              

                <div className="space-y-6 lg:w-[35%] h-full">
                  <CompetitorNetwork brands={analysis_brands} />
                </div>


              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <BrandDataProvider>
      <DashboardContent />
    </BrandDataProvider>
  );
}
