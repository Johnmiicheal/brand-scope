"use client";

import { useState, useEffect } from "react";
import { useBrandData } from "@/contexts/brand-data-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/loading-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ListChecks, SearchCode, ExternalLink, Quote, SquareArrowOutUpRight, RefreshCcw } from 'lucide-react'; // Import icons
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";

// Types for API response data
interface ExaResult {
  url?: string;
  title?: string;
  publishedDate?: string;
  author?: string;
  score?: number;
  id?: string;
}

interface CitationAnalysisData {
  generated_prompts: string[];
  exa_results: ExaResult[];
}

export default function CitationsPage() {
  const { brand, metrics, isLoading: isLoadingMetrics, error: metricsError } = useBrandData();
  const [analysisData, setAnalysisData] = useState<CitationAnalysisData | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const initialCitations = metrics?.brand_citations || [];

  // Extract dependencies before the effect for stability
  const brandName = brand?.name;
  const brandIndustry = brand?.industry;

  useEffect(() => {
    // Use the extracted variables in the condition
    if (brandName && brandIndustry) {
      const fetchAnalysis = async () => {
        setIsLoadingAnalysis(true);
        setAnalysisError(null);
        try {
          const response = await fetch('/api/brand-citations-analysis', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              // Pass extracted variables to the API
              brandName: brandName, 
              brandIndustry: brandIndustry 
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch citation analysis');
          }

          const data: CitationAnalysisData = await response.json();
          setAnalysisData(data);
        } catch (err) {
          setAnalysisError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
          setIsLoadingAnalysis(false);
        }
      };

      fetchAnalysis();
    }
    // Use the extracted, stable variables as dependencies
  }, [brandIndustry, brandName]);

  if (isLoadingMetrics) {
    return <LoadingState />;
  }

  if (metricsError || !metrics || !brand) {
    return <div className="text-center text-red-500">Error loading brand data: {metricsError || "Metrics or Brand not available"}</div>;
  }

  return (
    <div className="mx-auto p-4 md:p-6 space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Brand Citations Analysis</h1>
            <p className="text-muted-foreground">
                Review citations identified during initial analysis and discover new ones based on AI-generated search prompts.
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
            disabled={isLoadingAnalysis}
            className="cursor-pointer border rounded-full text-white/50 p-2 hover:border-gray-600 hover:text-white hover:rotate-90 disabled:opacity-50 transition-all duration-300 ease"
          >
            <RefreshCcw
              className={`w-4 h-4 ${isLoadingAnalysis ? "animate-spin" : ""}`}
            />
          </button>
          </div>
        )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Initial Citations */}
        <Card className="lg:col-span-1 bg-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Quote className="h-5 w-5 text-blue-500" /> Initial Citations
            </CardTitle>
            <CardDescription>Citations found during the last brand analysis run ({initialCitations.length} found).</CardDescription>
          </CardHeader>
          <CardContent>
            {initialCitations.length > 0 ? (
              <ul className="space-y-2 text-sm list-disc pl-5">
                {initialCitations.map((url, index) => (
                  <li key={`initial-${index}`}>
                    <Link href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate block">
                      {url}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No initial citations found.</p>
            )}
          </CardContent>
        </Card>

        {/* Column 2 & 3: AI Analysis & Exa Results */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SearchCode className="h-5 w-5 text-purple-500" /> AI-Generated Search Prompts
              </CardTitle>
              <CardDescription>Potential search queries used to find new citations.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAnalysis ? (
                <Skeleton className="h-20 w-full" />
              ) : analysisError ? (
                <p className="text-sm text-red-500">Error loading prompts: {analysisError}</p>
              ) : analysisData?.generated_prompts ? (
                <ul className="space-y-1 list-disc pl-5 text-sm">
                  {analysisData.generated_prompts.map((prompt, index) => (
                    <li key={`prompt-${index}`}>{prompt}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Could not generate prompts.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-teal-500" /> Discovered Citations
              </CardTitle>
              <CardDescription>Results from searching the web with the generated prompts ({analysisData?.exa_results?.length ?? 0} found).</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAnalysis ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-4/5" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : analysisError ? (
                <p className="text-sm text-red-500">Error loading results: {analysisError}</p>
              ) : analysisData?.exa_results && analysisData.exa_results.length > 0 ? (
                <ScrollArea className="h-[300px]">
                  <ul className="space-y-3 pr-4">
                    {analysisData.exa_results.map((result, index) => (
                      <li key={index} className="text-sm border-b border-border pb-2 last:border-b-0">
                        <Link href={result.url || '#'} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline flex items-center gap-1 mb-1">
                          {result.title || result.url} <ExternalLink className="h-3 w-3" />
                        </Link>
                        <p className="text-xs text-muted-foreground truncate">{result.url}</p>
                         {/* Add other details like date/author if needed */}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              ) : (
                 <p className="text-sm text-muted-foreground">No new citations discovered.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 