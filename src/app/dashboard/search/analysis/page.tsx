'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchResults, AIRanking, SocialInsight } from '@/types/search';
import { motion } from 'framer-motion';
import { ChartData } from '@/types/search';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalysisPageProps {}

export default function AnalysisPage({}: AnalysisPageProps) {
  const searchParams = useSearchParams();
  const searchId = searchParams.get('search_id');
  const modeId = searchParams.get('mode_id');
  
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        let url = '/api/search';
        
        if (searchId) {
          url += `?search_id=${searchId}`;
        } else if (modeId) {
          url += `?mode_id=${modeId}`;
        } else {
          throw new Error('No search_id or mode_id provided');
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }
        
        const data = await response.json();
        setResults(data);
        
        // Set initial model selection
        if (data.ai_rankings && data.ai_rankings.length > 0) {
          const models = [...new Set(data.ai_rankings.map((r: AIRanking) => r.llm_name))];
          setSelectedModel(models[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [searchId, modeId]);
  
  // Filter rankings by selected model
  const filteredRankings = results?.ai_rankings.filter(r => !selectedModel || r.llm_name === selectedModel) || [];
  
  if (loading) {
    return <AnalysisLoadingState />;
  }
  
  if (error) {
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
  }
  
  if (!results) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>No Results</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No analysis results found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Analysis Results</h1>
            <p className="text-muted-foreground">
              Mode: <Badge variant="outline">{results.mode}</Badge>
            </p>
          </div>
          
          {results.ai_rankings.length > 0 && (
            <div className="w-[200px]">
              <Select
                value={selectedModel || ''}
                onValueChange={setSelectedModel}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Model" />
                </SelectTrigger>
                <SelectContent>
                  {[...new Set(results.ai_rankings.map(r => r.llm_name))].map(model => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <Tabs defaultValue="rankings" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="rankings">AI Rankings</TabsTrigger>
            {results.social_insights && results.social_insights.length > 0 && (
              <TabsTrigger value="social">Social Insights</TabsTrigger>
            )}
            {results.charts && results.charts.length > 0 && (
              <TabsTrigger value="trends">Trends</TabsTrigger>
            )}
            {results.comparisons && results.comparisons.length > 0 && (
              <TabsTrigger value="competitors">Competitor Analysis</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="rankings" className="space-y-4">
            <RankingsTabContent rankings={filteredRankings} />
          </TabsContent>
          
          {results.social_insights && results.social_insights.length > 0 && (
            <TabsContent value="social" className="space-y-4">
              <SocialInsightsTabContent insights={results.social_insights} />
            </TabsContent>
          )}
          
          {results.charts && results.charts.length > 0 && (
            <TabsContent value="trends" className="space-y-4">
              <TrendsTabContent charts={results.charts} />
            </TabsContent>
          )}
          
          {results.comparisons && results.comparisons.length > 0 && (
            <TabsContent value="competitors" className="space-y-4">
              <CompetitorsTabContent comparisons={results.comparisons} />
            </TabsContent>
          )}
        </Tabs>
      </motion.div>
    </div>
  );
}

// Loading state component
function AnalysisLoadingState() {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Skeleton className="h-10 w-[250px] mb-2" />
        <Skeleton className="h-5 w-[150px]" />
      </div>
      
      <div className="space-y-4">
        {Array(3).fill(0).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-7 w-[200px] mb-2" />
              <Skeleton className="h-4 w-full max-w-[300px]" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// AI Rankings tab content
function RankingsTabContent({ rankings }: { rankings: AIRanking[] }) {
  if (rankings.length === 0) {
    return <p>No ranking data available.</p>;
  }
  
  // Group by query
  const queriesMap: Record<string, AIRanking[]> = {};
  rankings.forEach(ranking => {
    if (!queriesMap[ranking.query]) {
      queriesMap[ranking.query] = [];
    }
    queriesMap[ranking.query].push(ranking);
  });
  
  return (
    <div className="space-y-6">
      {Object.entries(queriesMap).map(([query, queryRankings]) => (
        <motion.div
          key={query}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Query: {query}</CardTitle>
              <CardDescription>
                Analysis performed on {new Date(queryRankings[0].analyzed_at).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {queryRankings.map((ranking, idx) => (
                  <div key={idx} className="border p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{ranking.entity_type === 'brand' ? 'Brand' : 'Competitor'}: {ranking.entity_id}</h3>
                        <div className="flex space-x-2 mt-1">
                          <Badge variant="outline">Rank: {ranking.rank ?? 'N/A'}</Badge>
                          <Badge variant="outline">Score: {ranking.score}</Badge>
                        </div>
                      </div>
                      <Badge>{ranking.llm_name}</Badge>
                    </div>
                    {ranking.reasoning && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <strong>Reasoning:</strong> {ranking.reasoning}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// Social Insights tab content
function SocialInsightsTabContent({ insights }: { insights: SocialInsight[] }) {
  if (insights.length === 0) {
    return <p>No social insights available.</p>;
  }
  
  return (
    <div className="space-y-4">
      {insights.map((insight, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>
                Social Media Analysis: {insight.keyword || 'General'}
              </CardTitle>
              <CardDescription>
                Platform: {insight.platform} • Mentions: {insight.mention_count}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-4">
                <div className="text-2xl font-semibold">Sentiment:</div>
                <Badge 
                  variant={insight.sentiment === 'positive' ? 'default' : 
                    insight.sentiment === 'negative' ? 'destructive' : 'outline'}
                  className="text-lg py-1 px-3"
                >
                  {insight.sentiment || 'Neutral'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Data collected on {new Date(insight.data_fetched_at).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// Trends tab content
function TrendsTabContent({ charts }: { charts: ChartData[] }) {
  if (charts.length === 0) {
    return <p>No trend data available.</p>;
  }
  
  return (
    <div className="space-y-6">
      {charts.map((chart, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Trend Analysis: {chart.keyword}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart.trend_points}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// Competitors tab content
function CompetitorsTabContent({ comparisons }: { comparisons: any[] }) {
  if (comparisons.length === 0) {
    return <p>No competitor analysis available.</p>;
  }
  
  return (
    <div className="space-y-4">
      {comparisons.map((comparison, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Competitor: {comparison.competitor_id}</CardTitle>
              <CardDescription>
                Ranking Difference: {comparison.ranking_diff > 0 ? 
                  `+${comparison.ranking_diff} (better)` : 
                  comparison.ranking_diff < 0 ? 
                  `${comparison.ranking_diff} (worse)` : 
                  '0 (equal)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {comparison.analysis && (
                <div className="prose prose-sm max-w-none">
                  <h3>Analysis</h3>
                  <div dangerouslySetInnerHTML={{ __html: comparison.analysis.replace(/\n/g, '<br/>') }} />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
} 