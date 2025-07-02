"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  TbSparkles, 
  TbSearch, 
  TbTrendingUp, 
  TbTarget, 
  TbRefresh,
  TbLoader2
} from "react-icons/tb";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

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
    keywords: Record<string, {
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
    }>;
  };
}

interface Citation {
  url: string;
  title: string;
  snippet: string;
}

interface StepsTabContentProps {
  citations: Citation[] | null;
  monitoringId: string;
  prompt: string;
  country: string;
}

export function StepsTabContent({ 
  citations, 
  monitoringId, 
  prompt, 
  country 
}: StepsTabContentProps) {
  const [stepsData, setStepsData] = useState<StepsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Safely get user with error handling
  let user = null;
  try {
    const authResult = useAuth();
    user = authResult?.user;
  } catch (authError) {
    console.error("Auth error in StepsTabContent:", authError);
    setError("Authentication error. Please refresh the page.");
  }

  // Check for existing steps on component mount
  useEffect(() => {
    if (monitoringId) {
      fetchExistingSteps();
    }
  }, [monitoringId]);

  const fetchExistingSteps = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/generate-steps?monitoringId=${monitoringId}`);
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

  const generateSteps = async () => {
    console.log('Generate steps called with:', { citations, monitoringId, prompt, country, user: user?.id });

    if (!citations || citations.length === 0) {
      setError("No citations available for steps generation");
      return;
    }

    if (!user?.id) {
      setError("User authentication required");
      return;
    }

    if (!monitoringId || monitoringId.trim() === '') {
      setError("Invalid monitoring ID");
      return;
    }

    if (!prompt || prompt.trim() === '') {
      setError("Query prompt is required");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Ensure citations have the correct structure
      const validCitations = citations
        .filter(c => c && typeof c === 'object' && c.url)
        .map(c => ({
          url: c.url.trim(),
          title: c.title || 'No title',
          snippet: c.snippet || 'No snippet'
        }))
        .filter(c => c.url !== '');

      if (validCitations.length === 0) {
        setError("No valid citations found");
        return;
      }

      const payload = {
        prompt: prompt.trim(),
        country: country || 'United States',
        citations: validCitations,
        monitoringId: monitoringId.trim(),
        userId: user.id,
      };

      console.log('Sending payload to generate-steps:', payload);

      const response = await fetch('/api/generate-steps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
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
        <h3 className="text-lg font-medium text-muted-foreground mb-2">No Citations Available</h3>
        <p className="text-sm text-muted-foreground">
          Steps generation requires citations from the AI analysis. Please wait for the analysis to complete.
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
          Create detailed search steps and keyword analysis based on the citations from your monitoring query.
        </p>
        <Button onClick={generateSteps} disabled={isGenerating} className="mb-4">
          <TbSparkles className="w-4 h-4 mr-2" />
          Generate Steps
        </Button>
        {error && (
          <p className="text-sm text-red-500 mt-2">{error}</p>
        )}
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="text-center py-8">
        <TbLoader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
        <h3 className="text-lg font-medium mb-2">Generating Steps...</h3>
        <p className="text-sm text-muted-foreground">
          This may take up to 30 seconds. You can navigate away and come back later.
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
      className="space-y-6"
    >
      {/* Header with topic and search config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TbTarget className="w-5 h-5 text-primary" />
            {stepsData.output.topic}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Location</p>
              <p className="font-medium">{stepsData.output.search_config.location}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Language</p>
              <p className="font-medium">{stepsData.output.search_config.language_code}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Domain</p>
              <p className="font-medium">{stepsData.output.search_config.google_domain}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Brand Focus</p>
              <p className="font-medium">{stepsData.output.search_config.brand || "General"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TbSearch className="w-5 h-5 text-primary" />
            Search Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {stepsData.output.categories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border rounded-lg p-4 bg-muted/30"
              >
                <h4 className="font-semibold mb-3 text-primary">{category.header}</h4>
                <div className="flex flex-wrap gap-2">
                  {category.subsearches.map((search, searchIndex) => (
                    <Badge key={searchIndex} variant="secondary" className="text-xs">
                      {search}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Keywords Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TbTrendingUp className="w-5 h-5 text-primary" />
            Keyword Analysis
            <Badge variant="outline" className="ml-auto">
              {Object.keys(stepsData.output.keywords).length} keywords
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {Object.entries(stepsData.output.keywords).map(([key, keyword]) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: parseInt(key) * 0.05 }}
                  className="border rounded-lg p-4 bg-background hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-sm">{keyword.conversational_keyword}</h5>
                    <Badge 
                      variant={keyword.relevance_score >= 8 ? "default" : keyword.relevance_score >= 6 ? "secondary" : "outline"}
                      className="ml-2"
                    >
                      {keyword.relevance_score}/10
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-3">{keyword.intent}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Search Volume</p>
                      <p className="font-medium">{keyword.search_volume.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Difficulty</p>
                      <p className="font-medium">{keyword.competition_index}/10</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CPC</p>
                      <p className="font-medium">{keyword.low_cpc}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Trend</p>
                      <p className={cn(
                        "font-medium",
                        keyword.trend_6m.includes('+') ? "text-green-500" : 
                        keyword.trend_6m.includes('-') ? "text-red-500" : "text-muted-foreground"
                      )}>
                        {keyword.trend_6m}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {keyword.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {keyword.search_intent}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Seed: {keyword.google_seed_keyword}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Regenerate Button */}
      <div className="flex justify-center">
        <Button onClick={generateSteps} variant="outline" disabled={isGenerating}>
          <TbRefresh className="w-4 h-4 mr-2" />
          Regenerate Steps
        </Button>
      </div>
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
            {Array(4).fill(0).map((_, i) => (
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
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <Skeleton className="h-5 w-[200px] mb-3" />
                <div className="flex flex-wrap gap-2">
                  {Array(3).fill(0).map((_, j) => (
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
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-[200px] mb-3" />
                <div className="grid grid-cols-4 gap-3">
                  {Array(4).fill(0).map((_, j) => (
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