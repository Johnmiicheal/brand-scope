"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  TbSparkles, 
  TbSearch, 
  TbRefresh,
  TbLoader2
} from "react-icons/tb";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Search } from "lucide-react";

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
      // Extract URLs from the new citation schema
      const extractedUrls: string[] = [];
      
             citations.forEach((citation: CitationData) => {
        if (citation && typeof citation === 'object') {
          // Extract from direct url field
          if (citation.url && typeof citation.url === 'string') {
            const trimmedUrl = citation.url.trim();
            if (trimmedUrl !== '' && !extractedUrls.includes(trimmedUrl)) {
              extractedUrls.push(trimmedUrl);
            }
          }
          
          // Extract from url_citation.url field
          if (citation.url_citation?.url && typeof citation.url_citation.url === 'string') {
            const trimmedUrl = citation.url_citation.url.trim();
            if (trimmedUrl !== '' && !extractedUrls.includes(trimmedUrl)) {
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
        country: country || 'United States',
        citations: extractedUrls,
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
      className="space-y-6 border-t border-accent"
    >
              {/* Search Categories with Stepper */}
        <Card className="border-none"> 
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TbSearch className="w-5 h-5 text-primary" />
              Search Analysis Steps
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
                      transition={{ delay: index * 0.1 + 0.2, type: "spring", stiffness: 300 }}
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
                          repeatDelay: 2
                        }}
                      />
                    </motion.div>
                    
                    {/* Connecting Line - continuous */}
                    <motion.div 
                      className="w-0.5 bg-muted/80 "
                      style={{ height: index === stepsData.output.categories.length - 1 ? '80px' : '80px' }}
                      initial={{ height: 0 }}
                      animate={{ 
                        height: index === stepsData.output.categories.length - 1 ? '80px' : '80px' 
                      }}
                      transition={{ delay: index * 0.1 + 0.4, duration: 0.5 }}
                    />
                  </div>

                  {/* Step Content */}
                  <div className="flex-1">
                    <h4 className="font-semibold mb-3 text-foreground">{category.header}</h4>
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
                transition={{ delay: stepsData?.output?.categories?.length * 0.1 + 0.2 }}
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
                      stiffness: 300 
                    }}
                  >
                  
                  </motion.div>

              
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: stepsData?.output?.categories?.length * 0.1 + 0.6 }}
                    className="text-sm text-muted-foreground italic"
                  >
                    Search analysis steps completed
                  </motion.div>
              </motion.div>
            </div>
          </CardContent>
        </Card>

              {/* Keywords Analysis */}
        <Card className="border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Keyword Analysis
                              <Badge variant="outline" className="ml-auto">
                 {Object.keys(stepsData?.output?.keywords || {}).length} keywords
                </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="">
            <ScrollArea className="h-[480px] rounded-lg bg-muted/20">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-muted">
                    <TableHead className="font-semibold text-foreground">Keyword</TableHead>
                    <TableHead className="font-semibold text-foreground">Intent</TableHead>
                    <TableHead className="font-semibold text-foreground text-right">Volume</TableHead>
                    <TableHead className="font-semibold text-foreground text-center">Difficulty</TableHead>
                    <TableHead className="font-semibold text-foreground text-center">CPC</TableHead>
                    <TableHead className="font-semibold text-foreground text-center">Trend</TableHead>
                    <TableHead className="font-semibold text-foreground text-center">Score</TableHead>
                    <TableHead className="font-semibold text-foreground">Category</TableHead>
                  </TableRow>
                </TableHeader>
                                  <TableBody>
                   {Object.entries(stepsData?.output?.keywords || {}).map(([key, keyword], index) => (
                    <motion.tr
                      key={key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-muted/30 hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="py-4">
                        <div>
                          <p className="font-medium text-sm text-foreground mb-1">
                            {keyword.conversational_keyword}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Seed: {keyword.google_seed_keyword}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div>
                          <Badge variant="outline" className="text-xs py-1 bg-gradient-to-t from-zinc-500/30 to-muted/20">
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
                            keyword.competition_index >= 7 ? "text-red-600" : 
                            keyword.competition_index >= 4 ? "text-orange-500" : 
                            "text-green-600"
                          )}
                        >
                          {keyword.competition_index}/10
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <p className="font-medium text-sm">{keyword.low_cpc}</p>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <p className={cn(
                          "font-medium text-sm",
                          keyword.trend_6m.includes('+') ? "text-green-600" : 
                          keyword.trend_6m.includes('-') ? "text-red-600" : "text-muted-foreground"
                        )}>
                          {keyword.trend_6m}
                        </p>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <span 
                          className={cn(
                            "inline-block px-3 py-1 rounded-full text-xs font-medium text-white",
                            keyword.relevance_score >= 8 ? "bg-gradient-to-b from-green-300/40 to-green-800/20 border border-green-800" :
                            keyword.relevance_score >= 5 ? "bg-gradient-to-b from-orange-500/40 to-orange-800/20 border border-orange-600" :
                            "bg-gradient-to-b from-red-400/20 to-red-600/50 border border-red-600"
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
                  ))}
                </TableBody>
              </Table>
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