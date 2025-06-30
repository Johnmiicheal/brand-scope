"use client";

import { motion } from "framer-motion";
import { 
  Bot, 
  Sparkles, 
  TrendingUp, 
  ArrowRight, 
  Calendar,
  Target,
  BarChart3,
  Clock,
  Eye,
  Search
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

interface KeywordRecommendation {
  id: string;
  conversational_keyword: string;
  intent: string;
  google_seed_keyword: string;
  category: string;
  search_volume: number;
  competition_index: number;
  low_cpc: string;
  trend_6m: string;
  relevance_score: number;
  created_at: string;
}

interface AnalysisSession {
  id: string;
  business_brief?: string;
  website?: string;
  keyword_input?: string;
  total_keywords: number;
  created_at: string;
}

interface KeywordStats {
  totalSessions: number;
  totalKeywords: number;
  avgRelevanceScore: number;
  highVolumeKeywords: number;
  lastAnalysisDate: string | null;
}

export function KeywordAnalysisCard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recentSessions, setRecentSessions] = useState<AnalysisSession[]>([]);
  const [topKeywords, setTopKeywords] = useState<KeywordRecommendation[]>([]);
  const [stats, setStats] = useState<KeywordStats>({
    totalSessions: 0,
    totalKeywords: 0,
    avgRelevanceScore: 0,
    highVolumeKeywords: 0,
    lastAnalysisDate: null
  });

  useEffect(() => {
    if (user) {
      fetchKeywordData();
    }
  }, [user]);

  const fetchKeywordData = async () => {
    try {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // Fetch recent analysis sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('keyword_analysis_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (sessionsError) {
        console.error('Error fetching analysis sessions:', sessionsError);
        return;
      }

      const typedSessions = (sessions || []) as unknown as AnalysisSession[];
      setRecentSessions(typedSessions);

      // Fetch top keyword recommendations by relevance score
      const { data: keywords, error: keywordsError } = await supabase
        .from('keyword_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .order('relevance_score', { ascending: false })
        .limit(5);

      if (keywordsError) {
        console.error('Error fetching keyword recommendations:', keywordsError);
        return;
      }

      const typedKeywords = (keywords || []) as unknown as KeywordRecommendation[];
      setTopKeywords(typedKeywords);

      // Calculate stats
      if (typedSessions && typedSessions.length > 0) {
        const totalSessions = typedSessions.length;
        const totalKeywords = typedSessions.reduce((sum, session) => sum + (session.total_keywords || 0), 0);
        
        let avgRelevanceScore = 0;
        let highVolumeKeywords = 0;
        
        if (typedKeywords && typedKeywords.length > 0) {
          avgRelevanceScore = typedKeywords.reduce((sum, kw) => sum + (kw.relevance_score || 0), 0) / typedKeywords.length;
          highVolumeKeywords = typedKeywords.filter(kw => (kw.search_volume || 0) > 1000).length;
        }

        setStats({
          totalSessions,
          totalKeywords,
          avgRelevanceScore: Math.round(avgRelevanceScore * 10) / 10,
          highVolumeKeywords,
          lastAnalysisDate: typedSessions[0]?.created_at || null
        });
      }
    } catch (error) {
      console.error('Error fetching keyword data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIntentColor = (intent: string) => {
    switch (intent?.toLowerCase()) {
      case 'commercial': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'informational': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'navigational': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'exploratory': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className="relative overflow-hidden border-2 border-blue-500/20 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
              <Bot className="w-6 h-6" />
            </div>
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
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <Card className="relative overflow-hidden h-full bg-background shadow-none border-[#e2e2e2]/70 dark:border-accent">
        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
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
          {recentSessions.length > 0 ? (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Total Keywords</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{stats.totalKeywords}</div>
                </div>
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Avg. Relevance</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{stats.avgRelevanceScore}/10</div>
                </div>
              </div>

              {/* Recent Analysis */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>Latest Analysis</span>
                  {stats.lastAnalysisDate && (
                    <span className="text-xs text-gray-500 ml-auto">
                      {formatDate(stats.lastAnalysisDate)}
                    </span>
                  )}
                </div>

                <ScrollArea className="h-24">
                  <div className="space-y-2">
                    {recentSessions[0] && (
                      <div className="bg-white/30 dark:bg-gray-800/30 rounded-lg p-3 border">
                        <div className="text-sm font-medium mb-1">
                          {recentSessions[0].business_brief || 
                           recentSessions[0].website || 
                           recentSessions[0].keyword_input || 
                           'Latest Analysis'}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Search className="w-3 h-3" />
                            {recentSessions[0].total_keywords} keywords found
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Top Keywords Preview */}
              {topKeywords.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Top Keywords</div>
                  <div className="flex flex-wrap gap-1">
                    {topKeywords.slice(0, 3).map((keyword, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getIntentColor(keyword.intent)}`}
                        >
                          {keyword.conversational_keyword}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {keyword.relevance_score}/10
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {stats.highVolumeKeywords} high-volume keywords
                </span>
              </div>
            </>
          ) : (
            <>
              {/* Empty State */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span>Discover <strong>50+ keyword opportunities</strong></span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span><strong>1 free analysis</strong> per day</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>Schedule keywords for <strong>monitoring</strong></span>
                </div>
              </div>
            </>
          )}
          
          <div className="pt-2">
            <Link href="/dashboard/keywords">
              <Button className="w-full group">
                {recentSessions.length > 0 ? 'View All Analyses' : 'Start Keyword Analysis'}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 