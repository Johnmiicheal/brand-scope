"use client";

import { useState, useEffect } from "react";
import { useBrandData } from "@/contexts/brand-data-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BicepsFlexed, Lightbulb, RefreshCcw, SquareArrowOutUpRight, TrendingDown, Zap } from "lucide-react";
import { LoadingState } from "@/components/loading-state";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";

// Define the structure for a single AI suggestion
interface AISuggestion {
  title: string;
  description: string;
  action_items: string[];
  focus_area: "Strengths" | "Weaknesses" | "Opportunities";
}

export default function BrandImprovementPage() {
  const { brand, metrics, isLoading: isLoadingMetrics, error: metricsError } = useBrandData();
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);

  useEffect(() => {
    if (metrics && metrics.strengths && metrics.weaknesses && metrics.opportunities) {
      const fetchSuggestions = async () => {
        setIsLoadingSuggestions(true);
        setSuggestionsError(null);
        try {
          const response = await fetch('/api/brand-improvement', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              strengths: metrics.strengths,
              weaknesses: metrics.weaknesses,
              opportunities: metrics.opportunities,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch suggestions');
          }

          const data = await response.json();
          setSuggestions(data.suggestions || []); // Assuming the API returns { suggestions: [...] }
        } catch (err) {
          setSuggestionsError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
          setIsLoadingSuggestions(false);
        }
      };

      fetchSuggestions();
    }
  }, [metrics]); // Depend on metrics object

  // Handle loading state for metrics
  if (isLoadingMetrics) {
    return <LoadingState />;
  }

  // Handle error state for metrics
  if (metricsError || !metrics) {
    return <div className="text-center text-red-500">Error loading brand data: {metricsError || "Metrics not available"}</div>;
  }

  const { strengths, weaknesses, opportunities } = metrics;

  // Helper function to get focus area badge style
  const getFocusAreaBadgeVariant = (area: AISuggestion['focus_area']) => {
    switch (area) {
      case 'Strengths': return 'outline'; // Keep outline, use color in text/border if needed
      case 'Weaknesses': return 'destructive';
      case 'Opportunities': return 'default'; // Use default blue-ish badge
      default: return 'secondary';
    }
  };

  return (
      <div className="mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brand Improvement Plan</h1>
          <p className="text-muted-foreground">
            Leverage your strengths, address weaknesses, and seize opportunities to enhance your brand presence.
          </p>
        </div>
        {brand && (
          <div className="flex justify-between items-center mt-10">
          <div className="flex items-end gap-2">
            <div className="flex items-center gap-2">
              <Image
                src={brand.logo_url || ''}
                alt={brand.name}
                width={24}
                height={24}
                className="rounded-md"
              />
              <h2 className="text-2xl">{brand.name}</h2>
            </div>
            <Link
              href={brand.website || ''}
              target="_blank"
              className="text-sm text-white/40 hover:text-white/80 flex items-center gap-1"
            >
              {brand.website} <SquareArrowOutUpRight className="w-3 h-3 mt-1" />
            </Link>
          </div>
          <button
            onClick={() => window.location.reload()}
            disabled={isLoadingSuggestions}
            className="cursor-pointer border rounded-full text-white/50 p-2 hover:border-gray-600 hover:text-white disabled:opacity-50 transition ease"
          >
            <RefreshCcw
              className={`w-4 h-4 ${isLoadingSuggestions ? "animate-spin" : ""}`}
            />
          </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Strengths Card */}
          <Card className="bg-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BicepsFlexed className="h-5 w-5 text-green-600" /> Strengths
              </CardTitle>
              <CardDescription>Areas where your brand excels.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {strengths?.length > 0 ? (
                strengths.map((strength, index) => (
                  <Badge key={index} variant="outline" className="mr-1 mb-1 border-green-200 text-green-800 dark:border-green-700 dark:text-green-300">{strength}</Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No specific strengths identified.</p>
              )}
            </CardContent>
          </Card>

          {/* Weaknesses Card */}
          <Card className="bg-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" /> Weaknesses
              </CardTitle>
              <CardDescription>Areas needing improvement.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {weaknesses?.length > 0 ? (
                weaknesses.map((weakness, index) => (
                  <Badge key={index} variant="outline" className="mr-1 mb-1 border-red-200 text-red-800 dark:border-red-700 dark:text-red-300">{weakness}</Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No specific weaknesses identified.</p>
              )}
            </CardContent>
          </Card>

          {/* Opportunities Card */}
          <Card className="bg-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" /> Opportunities
              </CardTitle>
              <CardDescription>Potential areas for growth.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {opportunities?.length > 0 ? (
                opportunities.map((opportunity, index) => (
                  <Badge key={index} variant="outline" className="mr-1 mb-1 border-blue-200 text-blue-800 dark:border-blue-700 dark:text-blue-300">{opportunity}</Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No specific opportunities identified.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Improvement Suggestions Card */}
        <Card className="bg-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" /> AI-Powered Suggestions
            </CardTitle>
            <CardDescription>Actionable steps generated based on your brand analysis.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSuggestions ? (
              // Skeleton loader for suggestions
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : suggestionsError ? (
              <p className="text-sm text-red-500">Error loading suggestions: {suggestionsError}</p>
            ) : suggestions.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {suggestions.map((suggestion, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      <div className="flex justify-between items-center w-full pr-4">
                        <span>{suggestion.title}</span>
                        <Badge variant={getFocusAreaBadgeVariant(suggestion.focus_area)}>{suggestion.focus_area}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-3 text-muted-foreground">{suggestion.description}</p>
                      <h4 className="font-semibold mb-1">Action Items:</h4>
                      <ul className="list-disc space-y-1 pl-5 text-sm">
                        {suggestion.action_items.map((item, itemIndex) => (
                          <li key={itemIndex}>{item}</li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="text-sm text-muted-foreground">No specific suggestions generated based on current data.</p>
            )}
          </CardContent>
        </Card>
    </div>
  );
} 