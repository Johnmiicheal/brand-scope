"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScheduledQuery } from "@/components/library/scheduled-queries-list";

interface Brand {
  name: string;
  rank: number;
  score: number;
  reasoning: string;
  sentiment?: string;
}

interface ModelResult {
  llm_name: string;
  status: 'fulfilled' | 'rejected';
  data?: {
    brands: Brand[];
  };
  error?: string;
}

interface ModelSummary {
  model: string;
  summary: string;
  query: string;
  reasoning?: unknown;
}

interface AnalysisRun {
  analysis_date: string;
  model_results?: ModelResult[];
  model_summary?: ModelSummary[];
  keyword_analysis?: unknown;
}

interface MonitoredSummaryProps {
  queries: ScheduledQuery[];
  brandName?: string;
}

interface SummaryMetrics {
  totalRankings: number;
  averageRank: number;
  averageScore: number;
  queryCount: number;
  modelCount: number;
  activeQueries: number;
  loading: boolean;
}

export function 
MonitoredSummary({ queries, brandName }: MonitoredSummaryProps) {
  const [metrics, setMetrics] = useState<SummaryMetrics>({
    totalRankings: 0,
    averageRank: 0,
    averageScore: 0,
    queryCount: 0,
    modelCount: 0,
    activeQueries: 0,
    loading: true,
  });

  useEffect(() => {
    const calculateMetrics = () => {
      if (!queries || queries.length === 0) {
        setMetrics({
          totalRankings: 0,
          averageRank: 0,
          averageScore: 0,
          queryCount: 0,
          modelCount: 0,
          activeQueries: 0,
          loading: false,
        });
        return;
      }

      try {
        let totalRankings = 0;
        let totalScore = 0;
        let scoreCount = 0;
        let totalRank = 0;
        let rankCount = 0;
        const modelsSet = new Set<string>();

        // Process each scheduled query's results
        queries.forEach((query) => {
          if (query.results && Array.isArray(query.results)) {
            // Each query.results is an array of analysis runs
            (query.results as AnalysisRun[]).forEach((analysisRun) => {
              if (analysisRun.model_results && Array.isArray(analysisRun.model_results)) {
                // Process each model result in this analysis run
                analysisRun.model_results.forEach((modelResult) => {
                  // Add model to the set
                  if (modelResult.llm_name) {
                    modelsSet.add(modelResult.llm_name);
                  }

                  // Process brand rankings if the model result was successful
                  if (modelResult.status === 'fulfilled' && modelResult.data?.brands) {
                    modelResult.data.brands.forEach((brand) => {
                      if (typeof brand.score === 'number') {
                        totalScore += brand.score;
                        scoreCount += 1;
                        totalRankings += 1;
                      }
                      
                      // Calculate average rank for the specific brand
                      if (brandName && brand.name && typeof brand.rank === 'number') {
                        const modelBrandName = brand.name.toLowerCase();
                        const targetBrandName = brandName.toLowerCase();
                        
                        // Check if this brand matches our target brand
                        if (modelBrandName.includes(targetBrandName) || 
                            targetBrandName.includes(modelBrandName) ||
                            modelBrandName.split(/\s+/).some(word => 
                              targetBrandName.split(/\s+/).some(targetWord => 
                                word.includes(targetWord) || targetWord.includes(word)
                              )
                            )) {
                          totalRank += brand.rank;
                          rankCount += 1;
                        }
                      }
                    });
                  }
                });
              }
              
              // Also count models from model_summary
              if (analysisRun.model_summary && Array.isArray(analysisRun.model_summary)) {
                analysisRun.model_summary.forEach((summary) => {
                  if (summary.model) {
                    modelsSet.add(summary.model);
                  }
                });
              }
            });
          }
        });

        const activeQueries = queries.filter(q => q.status === 'active').length;
        const averageScore = scoreCount > 0 ? Math.round((totalScore / scoreCount) * 10) / 10 : 0;
        const averageRank = rankCount > 0 ? Math.round((totalRank / rankCount) * 10) / 10 : 0;

        setMetrics({
          totalRankings,
          averageRank,
          averageScore,
          queryCount: queries.length,
          modelCount: modelsSet.size,
          activeQueries,
          loading: false,
        });

      } catch (error) {
        console.error('Error calculating metrics:', error);
        setMetrics({
          totalRankings: 0,
          averageRank: 0,
          averageScore: 0,
          queryCount: queries.length,
          modelCount: 0,
          activeQueries: queries.filter(q => q.status === 'active').length,
          loading: false,
        });
      }
    };

    calculateMetrics();
  }, [queries]);

  if (metrics.loading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Monitoring Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">Loading metrics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const MetricCard = ({ 
    label, 
    value, 
    suffix = "", 
    description 
  }: { 
    label: string, 
    value: number | string, 
    suffix?: string, 
    description: string 
  }) => (
    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="text-2xl font-bold text-blue-500">
          {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </div>
        <div className="text-sm font-medium text-foreground/80">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </div>
  );

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Monitoring Summary
          </CardTitle>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className={`h-2 w-2 rounded-full ${metrics.activeQueries > 0 ? 'bg-green-500' : 'bg-gray-400'}`} />
            {metrics.activeQueries} of {metrics.queryCount} active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Average Rank Position"
            value={metrics.averageRank}
            description={brandName ? `Average rank of ${brandName} across all analyses` : "Average rank position across all analyses"}
          />
          
          <MetricCard
            label="Average Score"
            value={metrics.averageScore}
            suffix="%"
            description="Overall performance score"
          />
          
          <MetricCard
            label="Monitored Queries"
            value={metrics.queryCount}
            description="Total scheduled searches"
          />
          
          <MetricCard
            label="AI Models"
            value={metrics.modelCount}
            description="Unique models analyzing"
          />
        </div>

        {metrics.queryCount === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No monitored queries found for this brand</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 