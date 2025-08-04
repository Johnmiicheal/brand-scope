/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
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
import { motion } from "framer-motion";
import { Info, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipProvider,
  TooltipContent,
} from "@/components/ui/tooltip";
import { ChartContainer } from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  Bar,
  BarChart,
} from "recharts";
import {
  OpenAI,
  Claude,
  Perplexity,
  Gemini,
  AiStudio,
  DeepSeek,
  Grok,
  Meta,
} from "@lobehub/icons";

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
  const [monitoredSessions, setMonitoredSessions] = useState<[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brandMetrics, setBrandMetrics] = useState<BrandMetrics | null>(null);
  const [temporalData, setTemporalData] = useState<TemporalBrandData[]>([]);
  const [googleSearchResults, setGoogleSearchResults] = useState<any[]>([]);

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
      const { data: monitoredSessionsData, error: monitoredSessionsError } =
        await supabase
          .from("scheduled_queries")
          .select("*")
          .eq("user_id", user.id)
          .contains("attached_brand_id", [brandData.id]);

      if (monitoredSessionsError) {
        console.error(
          "Error fetching monitored sessions:",
          monitoredSessionsError
        );
        setError("Failed to load monitored sessions");
        return;
      }

      // Fetch Google search results for each monitored session
      const googleResultsPromises = monitoredSessionsData.map(async (session: any) => {
        const { data: search_results, error: searchError } = await supabase
          .from('search_results')
          .select('*')
          .eq('mode_id', session.id);
        
        if (searchError) {
          console.error(`Error fetching search results for session ${session.id}:`, searchError);
          return { sessionId: session.id, results: [] };
        }
        
        return { sessionId: session.id, results: search_results || [] };
      });

      const googleResults = await Promise.all(googleResultsPromises);
      setGoogleSearchResults(googleResults);
      console.log('Google search results for all sessions:', googleResults);


      setMonitoredSessions((monitoredSessionsData as unknown as []) || []);

      // Calculate brand-specific metrics from monitored sessions
      if (monitoredSessionsData && monitoredSessionsData.length > 0) {
        calculateBrandMetrics(monitoredSessionsData, brandData.name as string, googleResults);
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to load brand data");
    } finally {
      setLoading(false);
    }
  };

  const calculateBrandMetrics = (queries: any[], brandName: string, googleSearchResults: any[] = []) => {
    // Extract brand data from queries results to match metrics card format
    const brandData: any[] = [];
    const temporalDataMap: Record<string, TemporalBrandData> = {};

    console.log(`Calculating metrics for brand: ${brandName}`);
    console.log(`Processing ${queries.length} queries`);

    queries.forEach((query: any) => {
      if (query.results && Array.isArray(query.results)) {
        query.results.forEach((analysisRun: any) => {
          if (
            analysisRun.model_results &&
            Array.isArray(analysisRun.model_results)
          ) {
            // Create a brand entry for this analysis run
            const brandEntry = {
              brand_name: brandName,
              gpt_mentions: 0,
              gpt_search_mentions: 0,
              claude_mentions: 0,
              perplexity_mentions: 0,
              gemini_mentions: 0,
              total_mentions: 0,
              ai_overview_mentions: 0,
              google_ai_mode_mentions: 0,
              deepseek_mentions: 0,
              gpt_4_1_mentions: 0,
              grok_mentions: 0,
              llama_mentions: 0,
            };

            // Check for Google search results for this query
            const queryGoogleResults = googleSearchResults.find(
              (sessionResults) => sessionResults.sessionId === query.id
            );
            
            // If Google search results exist for this query, analyze them for brand mentions
            if (queryGoogleResults && queryGoogleResults.results.length > 0) {
              let googleMentions = 0;
              
              // Check each Google search result for brand mentions
              queryGoogleResults.results.forEach((result: any) => {
                const contentToCheck = [
                  result.title || '',
                  result.snippet || '',
                  result.content || ''
                ].join(' ').toLowerCase();
                
                // Check for exact brand name mentions
                if (contentToCheck.includes(brandName)) {
                  googleMentions += 1;
                }
              });
              
              // If brand mentions found in Google results, count towards AI overview
              if (googleMentions > 0) {
                brandEntry.ai_overview_mentions += googleMentions;
                brandEntry.total_mentions += googleMentions;
                console.log(`Added ${googleMentions} Google search result mentions to AI overview for query ${query.id}`);
              } else {
                // Still count as AI overview if Google results exist but no specific mentions found
                brandEntry.ai_overview_mentions += 1;
                brandEntry.total_mentions += 1;
                console.log(`Added Google search results presence to AI overview for query ${query.id}`);
              }
            }

            analysisRun.model_results.forEach((modelResult: any) => {
              if (
                modelResult.status === "fulfilled" &&
                modelResult.data?.brands
              ) {
                const brandData = modelResult.data.brands.find((brand: any) => {
                  return brand.name === brandName;
                });
                
                // Debug: Log all available brand names if no match found
                if (!brandData && modelResult.data?.brands?.length > 0) {
                  console.log(`No match found for "${brandName}". Available brands in ${modelResult.llm_name}:`, 
                    modelResult.data.brands.map((b: any) => b.name)
                  );
                }

                if (brandData) {
                  console.log(`Found brand match: "${brandData.name}" for target "${brandName}" in model ${modelResult.llm_name}`);
                  // Count mentions by model type
                  const modelName = modelResult.llm_name || "";
                  if (
                    modelName.includes("GPT") ||
                    modelName.includes("OpenAI")
                  ) {
                    brandEntry.gpt_search_mentions += 1;
                  } else if (modelName.includes("Claude")) {
                    brandEntry.claude_mentions += 1;
                  } else if (modelName.includes("Perplexity")) {
                    brandEntry.perplexity_mentions += 1;
                  } else if (modelName.includes("Gemini")) {
                    brandEntry.gemini_mentions += 1;
                  } else if (modelName.includes("AI Mode")) {
                    brandEntry.google_ai_mode_mentions += 1;
                  } else if (modelName.includes("DeepSeek")) {
                    brandEntry.deepseek_mentions += 1;
                  } else if (modelName.includes("Nano")) {
                    brandEntry.gpt_4_1_mentions += 1;
                  } else if (modelName.includes("Grok")) {
                    brandEntry.grok_mentions += 1;
                  } else if (modelName.includes("Llama")) {
                    brandEntry.llama_mentions += 1;
                  }

                  brandEntry.total_mentions += 1;
                }
              }
            });

            brandData.push(brandEntry);

            // Store temporal data
            if (analysisRun.analysis_date) {
              const date = analysisRun.analysis_date.split("T")[0];
              if (!temporalDataMap[date]) {
                temporalDataMap[date] = {
                  date,
                  visibility: 0,
                  mentions: 0,
                  coverage: 0,
                };
              }

              temporalDataMap[date].mentions += brandEntry.total_mentions;
            }
          }
        });
      }
    });

    // Use the exact same calculation logic as the main dashboard
    if (brandData.length > 0) {
      const totalMentions = brandData.reduce(
        (acc, brand) => acc + brand.total_mentions,
        0
      );
      
      // Calculate metrics exactly like the dashboard - process all potential brands
      const modelCounts = new Set<string>();
      const allBrandMentions: Record<string, number> = {};
      
      // First, collect all unique brands mentioned in the data
      const allBrandsInData = new Set<string>();
      queries.forEach((query: any) => {
        if (query.results && Array.isArray(query.results)) {
          query.results.forEach((analysisRun: any) => {
            if (analysisRun.model_results && Array.isArray(analysisRun.model_results)) {
              analysisRun.model_results.forEach((modelResult: any) => {
                if (modelResult.status === "fulfilled" && modelResult.data?.brands) {
                  modelResult.data.brands.forEach((brand: any) => {
                    allBrandsInData.add(brand.name);
                  });
                }
              });
            }
          });
        }
      });
      
      // Now process each brand like the dashboard does
      allBrandsInData.forEach((brandName) => {
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
        
        // Process each query result
        queries.forEach((query: any) => {
          if (query.results && Array.isArray(query.results)) {
            query.results.forEach((analysisRun: any) => {
              if (analysisRun.model_results && Array.isArray(analysisRun.model_results)) {
                analysisRun.model_results.forEach((modelResult: any) => {
                  if (modelResult.status === "fulfilled" && modelResult.data?.brands) {
                    const brandData = modelResult.data.brands.find(
                      (b: any) => b.name.toLowerCase() === brandName.toLowerCase()
                    );
                    
                    if (brandData) {
                      let mentionCount = 1;
                      
                      // Add mentions from reasoning if available
                      if (brandData.reasoning) {
                        const reasoningMatches = brandData.reasoning.match(
                          new RegExp(`\\b${brandName}\\b`, "gi")
                        );
                        if (reasoningMatches) {
                          mentionCount += reasoningMatches.length;
                        }
                      }
                      
                      // Assign mentions to the appropriate model
                      const modelName = modelResult.llm_name?.toLowerCase() || "";
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
                      
                      // Track which models were active
                      if (modelName.includes("gpt") || modelName.includes("openai")) {
                        modelCounts.add("GPT 4o Web Search");
                      } else if (modelName.includes("claude")) {
                        modelCounts.add("Claude 4.0 Sonnet");
                      } else if (modelName.includes("perplexity")) {
                        modelCounts.add("Perplexity Sonar");
                      } else if (modelName.includes("gemini")) {
                        modelCounts.add("Gemini 2.5 Flash");
                      } else if (modelName.includes("ai mode")) {
                        modelCounts.add("Google AI Mode");
                      } else if (modelName.includes("deepseek")) {
                        modelCounts.add("DeepSeek R1");
                      } else if (modelName.includes("nano")) {
                        modelCounts.add("GPT 4.1 Nano");
                      } else if (modelName.includes("grok")) {
                        modelCounts.add("Grok");
                      } else if (modelName.includes("llama")) {
                        modelCounts.add("Llama");
                      }
                    }
                  }
                });
              }
            });
          }
        });
        
        // Add Google search results mentions
        googleSearchResults.forEach((sessionResults) => {
          if (sessionResults.results && sessionResults.results.length > 0) {
            sessionResults.results.forEach((result: any) => {
              const contentToCheck = [
                result.title || '',
                result.snippet || '',
                result.content || ''
              ].join(' ').toLowerCase();
              
              if (contentToCheck.includes(brandName.toLowerCase())) {
                mentions.ai_overview_mentions += 1;
              }
            });
            modelCounts.add("Google AI Overview");
          }
        });
        
        // Calculate total mentions for this brand
        const totalMentions = Object.values(mentions).reduce(
          (sum, count) => sum + count,
          0
        );
        
        if (totalMentions > 0) {
          allBrandMentions[brandName] = totalMentions;
        }
      });
      
      // Calculate maxMentions from all brand mentions (same as dashboard)
      const maxMentions = Math.max(...Object.values(allBrandMentions));
      const maxModels = modelCounts.size;
      
      // Calculate coverage ratio exactly like dashboard
      const getCoverageRatio = (brand: any) => {
        const totalMentionsPerModel =
          (brand.claude_mentions > 0 ? 1 : 0) +
          (brand.perplexity_mentions > 0 ? 1 : 0) +
          (brand.gemini_mentions > 0 ? 1 : 0) +
          (brand.gpt_search_mentions > 0 ? 1 : 0) +
          (brand.ai_overview_mentions > 0 ? 1 : 0) +
          (brand.google_ai_mode_mentions > 0 ? 1 : 0) +
          (brand.deepseek_mentions > 0 ? 1 : 0) +
          (brand.gpt_4_1_mentions > 0 ? 1 : 0) +
          (brand.grok_mentions > 0 ? 1 : 0) +
          (brand.llama_mentions > 0 ? 1 : 0);
        
        return maxModels > 0 ? (totalMentionsPerModel / maxModels) * 100 : 0;
      };
      
      // Calculate visibility score exactly like dashboard
      const getVisibilityScore = (brand: any) => {
        const coverageRatio = getCoverageRatio(brand) / 100;
        const mentionsIndex = maxMentions > 0 ? brand.total_mentions / maxMentions : 0;
        return (100 * (coverageRatio + mentionsIndex)) / 2;
      };
      
      // Calculate visibility scores for each query and average them
      const queryVisibilityScores: number[] = [];
      const queryCoverageRatios: number[] = [];
      
      // Process each query separately to get individual scores
      queries.forEach((query: any, queryIndex: number) => {
        if (query.results && Array.isArray(query.results)) {
          query.results.forEach((analysisRun: any) => {
            if (analysisRun.model_results && Array.isArray(analysisRun.model_results)) {
              // Create a brand entry for this specific query
              const queryBrandEntry = {
                brand_name: brandName,
                gpt_mentions: 0,
                gpt_search_mentions: 0,
                claude_mentions: 0,
                perplexity_mentions: 0,
                gemini_mentions: 0,
                total_mentions: 0,
                ai_overview_mentions: 0,
                google_ai_mode_mentions: 0,
                deepseek_mentions: 0,
                gpt_4_1_mentions: 0,
                grok_mentions: 0,
                llama_mentions: 0,
              };
              
              // Check for Google search results for this specific query
              const queryGoogleResults = googleSearchResults.find(
                (sessionResults) => sessionResults.sessionId === query.id
              );
              
              if (queryGoogleResults && queryGoogleResults.results.length > 0) {
                let googleMentions = 0;
                                 queryGoogleResults.results.forEach((result: any) => {
                   const contentToCheck = [
                     result.title || '',
                     result.snippet || '',
                     result.content || ''
                   ].join(' ');
                   
                   if (contentToCheck.includes(brandName)) {
                     googleMentions += 1;
                   }
                 });
                
                if (googleMentions > 0) {
                  queryBrandEntry.ai_overview_mentions += googleMentions;
                  queryBrandEntry.total_mentions += googleMentions;
                } else {
                  queryBrandEntry.ai_overview_mentions += 1;
                  queryBrandEntry.total_mentions += 1;
                }
              }
              
              // Process model results for this query
              analysisRun.model_results.forEach((modelResult: any) => {
                if (modelResult.status === "fulfilled" && modelResult.data?.brands) {
                                     const brandData = modelResult.data.brands.find((brand: any) => {
                     return brand.name === brandName;
                   });
                  
                  if (brandData) {
                    const modelName = modelResult.llm_name || "";
                    if (modelName.includes("GPT") || modelName.includes("OpenAI")) {
                      queryBrandEntry.gpt_search_mentions += 1;
                    } else if (modelName.includes("Claude")) {
                      queryBrandEntry.claude_mentions += 1;
                    } else if (modelName.includes("Perplexity")) {
                      queryBrandEntry.perplexity_mentions += 1;
                    } else if (modelName.includes("Gemini")) {
                      queryBrandEntry.gemini_mentions += 1;
                    } else if (modelName.includes("AI Mode")) {
                      queryBrandEntry.google_ai_mode_mentions += 1;
                    } else if (modelName.includes("DeepSeek")) {
                      queryBrandEntry.deepseek_mentions += 1;
                    } else if (modelName.includes("Nano")) {
                      queryBrandEntry.gpt_4_1_mentions += 1;
                    } else if (modelName.includes("Grok")) {
                      queryBrandEntry.grok_mentions += 1;
                    } else if (modelName.includes("Llama")) {
                      queryBrandEntry.llama_mentions += 1;
                    }
                    queryBrandEntry.total_mentions += 1;
                  }
                }
              });
              
              // Calculate maxModels for this specific query from fulfilled models
              const queryModelCounts = new Set<string>();
              analysisRun.model_results.forEach((modelResult: any) => {
                if (modelResult.status === "fulfilled") {
                  const modelName = modelResult.llm_name?.toLowerCase() || "";
                  if (modelName.includes("gpt") || modelName.includes("openai")) {
                    queryModelCounts.add("GPT 4o Web Search");
                  } else if (modelName.includes("claude")) {
                    queryModelCounts.add("Claude 4.0 Sonnet");
                  } else if (modelName.includes("perplexity")) {
                    queryModelCounts.add("Perplexity Sonar");
                  } else if (modelName.includes("gemini")) {
                    queryModelCounts.add("Gemini 2.5 Flash");
                  } else if (modelName.includes("ai mode")) {
                    queryModelCounts.add("Google AI Mode");
                  } else if (modelName.includes("deepseek")) {
                    queryModelCounts.add("DeepSeek R1");
                  } else if (modelName.includes("nano")) {
                    queryModelCounts.add("GPT 4.1 Nano");
                  } else if (modelName.includes("grok")) {
                    queryModelCounts.add("Grok");
                  } else if (modelName.includes("llama")) {
                    queryModelCounts.add("Llama");
                  }
                }
              });
              
              // Add Google AI Overview if Google search results exist for this query
              if (queryGoogleResults && queryGoogleResults.results.length > 0) {
                queryModelCounts.add("Google AI Overview");
              }
              
              const queryMaxModels = queryModelCounts.size;
              
              // Calculate maxMentions for this query like the dashboard does
              // First collect all unique brands in this query
              const queryBrandsSet = new Set<string>();
              analysisRun.model_results.forEach((modelResult: any) => {
                if (modelResult.status === "fulfilled" && modelResult.data?.brands) {
                  modelResult.data.brands.forEach((brand: any) => {
                    queryBrandsSet.add(brand.name);
                  });
                }
              });
              
              // Now calculate mentions for each brand in this query (like dashboard)
              const queryBrandMentions: Record<string, number> = {};
              queryBrandsSet.forEach((queryBrandName) => {
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
                
                analysisRun.model_results.forEach((modelResult: any) => {
                  if (modelResult.status === "fulfilled" && modelResult.data?.brands) {
                    const brandData = modelResult.data.brands.find(
                      (b: any) => b.name === queryBrandName
                    );
                    
                    if (brandData) {
                      let mentionCount = 1;
                      
                      // Add mentions from reasoning if available
                      if (brandData.reasoning) {
                        const reasoningMatches = brandData.reasoning.match(
                          new RegExp(`\\b${queryBrandName}\\b`, "gi")
                        );
                        if (reasoningMatches) {
                          mentionCount += reasoningMatches.length;
                        }
                      }
                      
                      // Assign mentions to the appropriate model
                      const modelName = modelResult.llm_name?.toLowerCase() || "";
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
                });
                
                // Add Google search results mentions for this brand in this query
                if (queryGoogleResults && queryGoogleResults.results.length > 0) {
                  queryGoogleResults.results.forEach((result: any) => {
                    const contentToCheck = [
                      result.title || '',
                      result.snippet || '',
                      result.content || ''
                    ].join(' ');
                    
                    if (contentToCheck.includes(queryBrandName)) {
                      mentions.ai_overview_mentions += 1;
                    }
                  });
                }
                
                // Calculate total mentions for this brand in this query
                const totalMentions = Object.values(mentions).reduce(
                  (sum, count) => sum + count,
                  0
                );
                
                if (totalMentions > 0) {
                  queryBrandMentions[queryBrandName] = totalMentions;
                }
              });
              
              // Get the maximum mentions for any brand in this query
              const queryMaxMentions = Math.max(...Object.values(queryBrandMentions));
              
              // Calculate coverage ratio for this specific query
              const queryCoverageCount = 
                (queryBrandEntry.claude_mentions > 0 ? 1 : 0) +
                (queryBrandEntry.perplexity_mentions > 0 ? 1 : 0) +
                (queryBrandEntry.gemini_mentions > 0 ? 1 : 0) +
                (queryBrandEntry.gpt_search_mentions > 0 ? 1 : 0) +
                (queryBrandEntry.ai_overview_mentions > 0 ? 1 : 0) +
                (queryBrandEntry.google_ai_mode_mentions > 0 ? 1 : 0) +
                (queryBrandEntry.deepseek_mentions > 0 ? 1 : 0) +
                (queryBrandEntry.gpt_4_1_mentions > 0 ? 1 : 0) +
                (queryBrandEntry.grok_mentions > 0 ? 1 : 0) +
                (queryBrandEntry.llama_mentions > 0 ? 1 : 0);
              
              const queryCoverageRatio = queryMaxModels > 0 ? (queryCoverageCount / queryMaxModels) * 100 : 0;
              
              // Calculate visibility score for this specific query
              const queryCoverageRatioDecimal = queryCoverageRatio / 100;
              const queryMentionsIndex = queryMaxMentions > 0 ? queryBrandEntry.total_mentions / queryMaxMentions : 0;
              const queryVisibilityScore = Math.min((100 * (queryCoverageRatioDecimal + queryMentionsIndex)) / 2, 100);
              
              queryCoverageRatios.push(queryCoverageRatio);
              queryVisibilityScores.push(queryVisibilityScore);
              
              console.log(`Query ${queryIndex + 1} - Coverage: ${queryCoverageRatio}%, Visibility: ${queryVisibilityScore}%, MaxModels: ${queryMaxModels}, Mentions: ${queryBrandEntry.total_mentions}, MaxMentions: ${queryMaxMentions}`);
            }
          });
        }
      });
      
      // Calculate averages
      const avgCoverageRatio = queryCoverageRatios.length > 0 
        ? queryCoverageRatios.reduce((sum, ratio) => sum + ratio, 0) / queryCoverageRatios.length 
        : 0;
      const avgVisibilityScore = queryVisibilityScores.length > 0 
        ? queryVisibilityScores.reduce((sum, score) => sum + score, 0) / queryVisibilityScores.length 
        : 0;
      
      // Use the accumulated data for total mentions and model mentions
      const coverageRatio = avgCoverageRatio; // Use averaged coverage ratio
      const visibilityScore = avgVisibilityScore; // Use averaged visibility score
      
      // Debug logging
      console.log('Brand Project Metrics Calculation:');
      console.log('Brand total mentions:', brandData[0].total_mentions);
      console.log('Max mentions across all data:', maxMentions);
      console.log('Max models active:', maxModels);
      console.log('Coverage ratio:', coverageRatio);
      console.log('Average visibility score:', visibilityScore);
      console.log('Individual query visibility scores:', queryVisibilityScores);
      
      // Calculate temporal data using the same logic as main metrics
      Object.keys(temporalDataMap).forEach((date) => {
        const temporalEntry = temporalDataMap[date];
        
        // Calculate coverage for this date using the same logic
        const dateCoverageCount = 
          (brandData[0].claude_mentions > 0 ? 1 : 0) +
          (brandData[0].perplexity_mentions > 0 ? 1 : 0) +
          (brandData[0].gemini_mentions > 0 ? 1 : 0) +
          (brandData[0].gpt_search_mentions > 0 ? 1 : 0) +
          (brandData[0].ai_overview_mentions > 0 ? 1 : 0) +
          (brandData[0].google_ai_mode_mentions > 0 ? 1 : 0) +
          (brandData[0].deepseek_mentions > 0 ? 1 : 0) +
          (brandData[0].gpt_4_1_mentions > 0 ? 1 : 0) +
          (brandData[0].grok_mentions > 0 ? 1 : 0) +
          (brandData[0].llama_mentions > 0 ? 1 : 0);
        
        temporalEntry.coverage = maxModels > 0 ? (dateCoverageCount / maxModels) * 100 : 0;
        
        // Calculate visibility for this date using the same logic
        const dateCoverageRatio = temporalEntry.coverage / 100;
        const dateMentionsIndex = maxMentions > 0 ? temporalEntry.mentions / maxMentions : 0;
        temporalEntry.visibility = (100 * (dateCoverageRatio + dateMentionsIndex)) / 2;
      });

      // Calculate model mentions
      const uniqueModelMentions: Record<string, number> = {};
      brandData.forEach((brand) => {
        if (brand.claude_mentions > 0)
          uniqueModelMentions["Claude 4.0 Sonnet"] =
            (uniqueModelMentions["Claude 4.0 Sonnet"] || 0) + 1;
        if (brand.perplexity_mentions > 0)
          uniqueModelMentions["Perplexity Sonar"] =
            (uniqueModelMentions["Perplexity Sonar"] || 0) + 1;
        if (brand.gemini_mentions > 0)
          uniqueModelMentions["Gemini 2.5 Flash"] =
            (uniqueModelMentions["Gemini 2.5 Flash"] || 0) + 1;
        if (brand.gpt_search_mentions > 0)
          uniqueModelMentions["GPT 4o Web Search"] =
            (uniqueModelMentions["GPT 4o Web Search"] || 0) + 1;
        if (brand.ai_overview_mentions > 0)
          uniqueModelMentions["Google AI Overview"] =
            (uniqueModelMentions["Google AI Overview"] || 0) + 1;
        if (brand.google_ai_mode_mentions > 0)
          uniqueModelMentions["Google AI Mode"] =
            (uniqueModelMentions["Google AI Mode"] || 0) + 1;
        if (brand.deepseek_mentions > 0)
          uniqueModelMentions["DeepSeek R1"] =
            (uniqueModelMentions["DeepSeek R1"] || 0) + 1;
        if (brand.gpt_4_1_mentions > 0)
          uniqueModelMentions["GPT 4.1 Nano"] =
            (uniqueModelMentions["GPT 4.1 Nano"] || 0) + 1;
        if (brand.grok_mentions > 0)
          uniqueModelMentions["Grok"] = (uniqueModelMentions["Grok"] || 0) + 1;
        if (brand.llama_mentions > 0)
          uniqueModelMentions["Llama"] =
            (uniqueModelMentions["Llama"] || 0) + 1;
      });

      // Calculate trends
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
          visibilityTrend =
            (latest.visibility - previous.visibility) / previous.visibility;
        }
        if (previous.coverage > 0) {
          coverageTrend =
            (latest.coverage - previous.coverage) / previous.coverage;
        }
        if (previous.mentions > 0) {
          mentionsTrend =
            (latest.mentions - previous.mentions) / previous.mentions;
        }
      }

      setBrandMetrics({
        avgBrandVisibility: visibilityScore,
        coverageRatio: coverageRatio,
        totalMentions: totalMentions,
        maxMentions: maxMentions,
        uniqueModelMentions: uniqueModelMentions,
        visibilityTrend,
        coverageTrend,
        mentionsTrend,
      });

      setTemporalData(temporalArray);
    }
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
    "Google AI Mode": AiStudio.Color,
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

      {/* Brand Metrics Dashboard */}
      {brandMetrics && monitoredSessions.length > 0 && (
        <div className="mb-8 space-y-6">
          <h2 className="text-2xl font-semibold">
            Brand Performance Analytics
          </h2>

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
                      <p>
                        Average visibility score across all prompts for this
                        brand
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-2xl font-bold mb-1">
                {brandMetrics.avgBrandVisibility.toFixed(1)}%
              </div>
              {brandMetrics.visibilityTrend !== undefined && (
                <div
                  className={`text-sm flex items-center gap-1 ${
                    brandMetrics.visibilityTrend > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {brandMetrics.visibilityTrend > 0 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {Math.abs(brandMetrics.visibilityTrend * 100).toFixed(1)}% vs
                  previous
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
                      <p>
                        Average ratio of models that mentioned this brand across
                        all prompts
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-2xl font-bold mb-1">
                {brandMetrics.coverageRatio.toFixed(1)}%
              </div>
              {brandMetrics.coverageTrend !== undefined && (
                <div
                  className={`text-sm flex items-center gap-1 ${
                    brandMetrics.coverageTrend > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {brandMetrics.coverageTrend > 0 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {Math.abs(brandMetrics.coverageTrend * 100).toFixed(1)}% vs
                  previous
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
                      <p>
                        Total number of mentions across all prompts for this
                        brand
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-2xl font-bold mb-1">
                {brandMetrics.maxMentions}
              </div>
              {brandMetrics.mentionsTrend !== undefined && (
                <div
                  className={`text-sm flex items-center gap-1 ${
                    brandMetrics.mentionsTrend > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {brandMetrics.mentionsTrend > 0 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {Math.abs(brandMetrics.mentionsTrend * 100).toFixed(1)}% vs
                  previous
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
              <div className="text-sm text-muted-foreground mb-1">
                Listed in Models
              </div>
              <div className="space-y-2 mt-2">
                {Object.entries(brandMetrics.uniqueModelMentions).map(
                  ([model, count]) => {
                    const IconComponent = modelIcons[model];
                    return (
                      <div key={model} className="flex justify-between text-xs">
                        <span className="truncate flex items-center gap-1">
                          <IconComponent className="w-4 h-4" />
                          {model}
                        </span>
                        <span className="text-blue-500 font-semibold">
                          {count}
                        </span>
                      </div>
                    );
                  }
                )}
                {Object.keys(brandMetrics.uniqueModelMentions).length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{Object.keys(brandMetrics.uniqueModelMentions).length - 3}{" "}
                    more
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
                  {temporalData.length > 0
                    ? "Average visibility trend across all prompts"
                    : "No temporal data available yet"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {temporalData.length > 0 ? (
                  <ChartContainer config={{}} className="h-[300px] w-full">
                    <AreaChart
                      data={temporalData.map((d) => ({
                        date: new Date(d.date).toLocaleDateString("en-US", {
                          day: "2-digit",
                          month: "short",
                        }),
                        visibility: Number(d.visibility.toFixed(1)),
                      }))}
                      margin={{ left: 12, right: 12, top: 20, bottom: 20 }}
                    >
                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        opacity={0.1}
                      />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        style={{
                          fontSize: "12px",
                          fill: "var(--muted-foreground)",
                        }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                        style={{
                          fontSize: "12px",
                          fill: "var(--muted-foreground)",
                        }}
                      />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: "var(--background)",
                          border: "1px solid var(--border)",
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                        formatter={(value) => [`${value}%`, "Visibility"]}
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
                    ? "Number of prompts where brand was mentioned by each model"
                    : "No model mentions data available yet"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(brandMetrics.uniqueModelMentions).length > 0 ? (
                  <ChartContainer config={{}} className="h-[300px] w-full">
                    <BarChart
                      data={Object.entries(
                        brandMetrics.uniqueModelMentions
                      ).map(([model, count]) => ({
                        model: model.replace(/\s*(4\.0|2\.5|4o)\s*/g, ""),
                        count,
                      }))}
                      margin={{ left: 12, right: 12, top: 20, bottom: 20 }}
                    >
                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        opacity={0.1}
                      />
                      <XAxis
                        dataKey="model"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        style={{
                          fontSize: "10px",
                          fill: "var(--muted-foreground)",
                        }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        style={{
                          fontSize: "12px",
                          fill: "var(--muted-foreground)",
                        }}
                      />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: "var(--background)",
                          border: "1px solid var(--border)",
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                        formatter={(value) => [`${value}`, "Mentions"]}
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
              <MonitoredSummary
                queries={monitoredSessions as unknown as ScheduledQuery[]}
                brandName={brandName}
              />
              <ScheduledQueriesList
                queries={monitoredSessions as unknown as ScheduledQuery[]}
              />
              
              {/* Google Search Results Display */}
              {googleSearchResults.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Google Search Results</h3>
                  <div className="space-y-4">
                    {googleSearchResults.map((sessionResults) => (
                      <Card key={sessionResults.sessionId} className="bg-background border-[#e2e2e2]/70 dark:border-accent">
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
                              {sessionResults.results.slice(0, 5).map((result: any, index: number) => (
                                <div key={index} className="p-3 bg-muted/50 rounded-lg">
                                  <div className="text-sm font-medium text-blue-600">
                                    {result.title || `Result ${index + 1}`}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {result.snippet || 'No snippet available'}
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
                                  +{sessionResults.results.length - 5} more results
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
