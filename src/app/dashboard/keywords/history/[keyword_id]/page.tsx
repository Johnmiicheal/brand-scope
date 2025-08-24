/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { 
  Bot, 
  ArrowLeft, 
  TrendingUp, 
  Loader2,
  FileText,
  Globe,
  Target,
  Languages
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { KeywordAnalysisResults } from "@/components/keywords/keyword-analysis-results";

type MonthlySearchVolume = {
  month: string;
  year: string;
  monthlySearches: string;
};

type KeywordAnalysis = {
  id: string;
  created_at: string;
  keyword_input: string;
  business_brief: string;
  website: string;
  total_keywords: number;
  keywords_data: Array<{
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
  }>;
  top_keywords?: Array<unknown>;
  stats?: Record<string, unknown>;
  language?: string;
  location?: string;
  // Enhanced analysis session metrics
  avg_search_volume?: number;
  total_monthly_searches?: number;
  high_competition_count?: number;
  avg_competition_index?: number;
  avg_low_cpc_usd?: number;
  avg_high_cpc_usd?: number;
  high_value_keywords_count?: number;
  analysis_summary?: string;
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function KeywordAnalysisDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<KeywordAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const keywordId = params?.keyword_id as string;

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!user?.id || !keywordId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/keywords/history/${keywordId}?user_id=${user.id}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to load keyword analysis');
        } else {
          setAnalysis(data.analysis as KeywordAnalysis);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [user?.id, keywordId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleScheduleKeyword = async (keyword: string, frequency: string, country: string) => {
    try {
      const response = await fetch('/api/schedule-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: keyword,
          frequency: frequency,
          mode: 'explorer',
          location: country === 'global' ? 'Global' : country,
          user_id: user?.id,
          attached_brand_id: null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to schedule keyword monitoring');
      }

      // Success - the KeywordAnalysisResults component will handle the success message
    } catch (error) {
      console.error('Error scheduling keyword:', error);
      throw error; // Re-throw to let the component handle the error display
    }
  };

  const handleBack = () => {
    router.push('/dashboard/keywords/history');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-muted-foreground">Loading keyword analysis...</span>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {error || 'Keyword analysis not found'}
            </p>
            <Button onClick={handleBack} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to History
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div 
      className="flex flex-col gap-6 p-6"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <motion.div className="flex flex-col gap-2" variants={slideUp}>
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Keyword Analysis Results</h1>
            <p className="text-muted-foreground">
              Analysis from {formatDate(analysis.created_at)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Analysis Overview */}
      <motion.div variants={slideUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Analysis Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {analysis.keyword_input && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Target className="w-4 h-4" />
                    <span>Primary Keyword</span>
                  </div>
                  <p className="font-medium">{analysis.keyword_input}</p>
                </div>
              )}
              
              {analysis.website && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="w-4 h-4" />
                    <span>Website</span>
                  </div>
                  <p className="font-medium truncate">{analysis.website}</p>
                </div>
              )}

              {analysis.location && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="w-4 h-4" />
                    <span>Location</span>
                  </div>
                  <p className="font-medium">{analysis.location}</p>
                </div>
              )}

              {analysis.language && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Languages className="w-4 h-4" />
                    <span>Language</span>
                  </div>
                  <p className="font-medium uppercase">{analysis.language}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  <span>Keywords Found</span>
                </div>
                <p className="font-medium">{analysis.total_keywords || 0} keywords</p>
              </div>

              {/* Enhanced metrics */}
              {analysis.avg_search_volume !== undefined && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Target className="w-4 h-4" />
                    <span>Avg. Search Volume</span>
                  </div>
                  <p className="font-medium">{analysis.avg_search_volume.toLocaleString()}/month</p>
                </div>
              )}

              {analysis.high_competition_count !== undefined && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    <span>High Competition</span>
                  </div>
                  <p className="font-medium">{analysis.high_competition_count} keywords</p>
                </div>
              )}

              {analysis.avg_low_cpc_usd !== undefined && analysis.avg_high_cpc_usd !== undefined && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    <span>Avg. CPC Range (USD)</span>
                  </div>
                  <p className="font-medium font-mono">
                    ${analysis.avg_low_cpc_usd.toFixed(2)} - ${analysis.avg_high_cpc_usd.toFixed(2)}
                  </p>
                </div>
              )}

              {analysis.high_value_keywords_count !== undefined && analysis.high_value_keywords_count > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    <span>High-Value Keywords</span>
                  </div>
                  <p className="font-medium text-green-600">{analysis.high_value_keywords_count} keywords ({'>'}$5 USD)</p>
                </div>
              )}
            </div>
            
            {analysis.business_brief && (
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>Business Description</span>
                </div>
                <p className="text-sm bg-muted/50 p-3 rounded-lg">
                  {analysis.business_brief}
                </p>
              </div>
            )}

            {analysis.analysis_summary && (
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bot className="w-4 h-4" />
                  <span>AI Analysis Summary</span>
                </div>
                <p className="text-sm bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  {analysis.analysis_summary}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Results */}
      {analysis.keywords_data && Array.isArray(analysis.keywords_data) ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <KeywordAnalysisResults
            displaySummary={false}
            keywords={analysis.keywords_data.reduce((acc, keyword, index) => {
              acc[index.toString()] = {
                conversational_keyword: keyword.conversational_keyword,
                intent: keyword.intent,
                google_seed_keyword: keyword.google_seed_keyword,
                category: keyword.category,
                search_volume: keyword.search_volume,
                competition_index: keyword.competition_index,
                competition: keyword.competition,
                low_cpc: keyword.low_cpc,
                high_cpc: keyword.high_cpc,
                low_cpc_usd: keyword.low_cpc_usd,
                high_cpc_usd: keyword.high_cpc_usd,
                trend_3m: keyword.trend_3m,
                trend_6m: keyword.trend_6m,
                trend_11m: keyword.trend_11m,
                relevance_score: keyword.relevance_score,
                monthly_search_volumes: keyword.monthly_search_volumes,
              };
              return acc;
            }, {} as Record<string, {
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
            }>)}
            metadata={[{ language: analysis.language || 'en', country: analysis.location || 'Global' }]}
          />
        </motion.div>
      ) : (
        <motion.div variants={slideUp}>
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Keywords Found</h3>
              <p className="text-muted-foreground mb-6">
                No keyword data available for this analysis. Please try creating a new analysis.
              </p>
              <Button onClick={() => router.push('/dashboard/keywords')} className="bg-blue-500 hover:bg-blue-600">
                Create New Analysis
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
} 