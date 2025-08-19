/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Quote, BookOpen, Download } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Claude, DeepMind, Gemini, Google, OpenAI, Perplexity } from "@lobehub/icons";
import { safeGetHostname } from "@/lib/utils";

interface Citation {
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

// Google AI Overview citation structure
interface GoogleCitation {
  link: string;
  index: number;
  title: string;
  source: string;
  snippet?: string;
}

interface ModelCitation {
  model: string;
  citations: Citation[];
}

interface CitationsCardProps {
  results: any[];
  selectedDateRange: string;
  customDateRange: { from: Date | undefined; to: Date | undefined };
  selectedModel: Set<string>;
  googleSearchResults?: any;
}

const modelIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "GPT 4.1": OpenAI,
  "GPT 4o Web Search": OpenAI,
  "Claude 3.5 Sonnet": Claude,
  "Claude 4.0 Sonnet": Claude.Color,
  "Perplexity Sonar": Perplexity.Color,
  "Gemini 2.0 Flash": Gemini.Color,
  "Gemini 2.5 Flash": Gemini.Color,
  "Google AI Overview": Google.Color,
  "Google AI Mode": DeepMind.Color,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function CitationsCard({
  results,
  selectedDateRange,
  customDateRange,
  selectedModel,
  googleSearchResults,
}: CitationsCardProps) {
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  // Helper function to filter results by date range
  const getDateFilteredResults = () => {
    if (!results || !Array.isArray(results)) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (selectedDateRange) {
      case "today":
        return results.filter((result) => {
          const resultDate = new Date(result.analysis_date);
          const resultDateOnly = new Date(
            resultDate.getFullYear(),
            resultDate.getMonth(),
            resultDate.getDate()
          );
          return resultDateOnly.getTime() === today.getTime();
        });
      case "7days":
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        return results.filter((result) => {
          const resultDate = new Date(result.analysis_date);
          return resultDate >= sevenDaysAgo && resultDate <= now;
        });
      case "30days":
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        return results.filter((result) => {
          const resultDate = new Date(result.analysis_date);
          return resultDate >= thirtyDaysAgo && resultDate <= now;
        });
      case "custom":
        if (!customDateRange.from || !customDateRange.to) return results;
        return results.filter((result) => {
          const resultDate = new Date(result.analysis_date);
          return (
            resultDate >= customDateRange.from! &&
            resultDate <= customDateRange.to!
          );
        });
      case "all":
      default:
        return results;
    }
  };

  // Helper function to filter Google search results by date range
  const getDateFilteredGoogleResults = () => {
    if (
      !googleSearchResults?.search_results ||
      !Array.isArray(googleSearchResults.search_results)
    )
      return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (selectedDateRange) {
      case "today":
        return googleSearchResults.search_results.filter((result: any) => {
          if (!result.created_at) return false;
          const resultDate = new Date(result.created_at);
          const resultDateOnly = new Date(
            resultDate.getFullYear(),
            resultDate.getMonth(),
            resultDate.getDate()
          );
          return resultDateOnly.getTime() === today.getTime();
        });
      case "7days":
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        return googleSearchResults.search_results.filter((result: any) => {
          if (!result.created_at) return false;
          const resultDate = new Date(result.created_at);
          return resultDate >= sevenDaysAgo && resultDate <= now;
        });
      case "30days":
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        return googleSearchResults.search_results.filter((result: any) => {
          if (!result.created_at) return false;
          const resultDate = new Date(result.created_at);
          return resultDate >= thirtyDaysAgo && resultDate <= now;
        });
      case "custom":
        if (!customDateRange.from || !customDateRange.to)
          return googleSearchResults.search_results;
        return googleSearchResults.search_results.filter((result: any) => {
          if (!result.created_at) return false;
          const resultDate = new Date(result.created_at);
          return (
            resultDate >= customDateRange.from! &&
            resultDate <= customDateRange.to!
          );
        });
      case "all":
      default:
        return googleSearchResults.search_results;
    }
  };

  // Extract citations by model from filtered results
  const getCitationsByModel = (): ModelCitation[] => {
    const dateFilteredResults = getDateFilteredResults();
    const modelCitationsMap = new Map<string, Citation[]>();

    // Process regular model citations
    dateFilteredResults.forEach((result) => {
      if (result.model_summary && Array.isArray(result.model_summary)) {
        result.model_summary.forEach((summary: any) => {
          // Filter by selected models if any are selected
          if (selectedModel.size > 0 && !selectedModel.has(summary.model)) {
            return;
          }

          if (summary.reasoning && Array.isArray(summary.reasoning)) {
            // Handle regular citations (Perplexity format with url_citation wrapper)
            const regularCitations = summary.reasoning.filter(
              (item: any) => item.url_citation
            );

            // Handle Google AI Mode citations (direct url, title, text format)
            const googleAiModeCitations = summary.reasoning.filter(
              (item: any) => item.url && item.title && !item.url_citation
            );

            const allCitations = [
              ...regularCitations,
              ...googleAiModeCitations,
            ];

            if (allCitations.length > 0) {
              const existingCitations =
                modelCitationsMap.get(summary.model) || [];
              modelCitationsMap.set(summary.model, [
                ...existingCitations,
                ...allCitations,
              ]);
            }
          }
        });
      }
    });

    // Process Google AI Overview citations
    if (
      googleSearchResults &&
      (!selectedModel.size || selectedModel.has("Google AI Overview"))
    ) {
      const filteredGoogleResults = getDateFilteredGoogleResults();
      const googleCitations: Citation[] = [];

      filteredGoogleResults.forEach((searchResult: any) => {
        if (searchResult.results?.ai_overview?.references) {
          const references: GoogleCitation[] =
            searchResult.results.ai_overview.references;

          references.forEach((ref: GoogleCitation) => {
            // Convert Google citation format to our Citation format
            googleCitations.push({
              url_citation: {
                url: ref.link,
                title: ref.title,
                snippet: ref.snippet || `Source: ${ref.source}`,
              },
            });
          });
        }
      });

      if (googleCitations.length > 0) {
        modelCitationsMap.set("Google AI Overview", googleCitations);
      }
    }

    // Convert map to array and deduplicate citations
    return Array.from(modelCitationsMap.entries()).map(([model, citations]) => {
      // Deduplicate citations by URL
      const uniqueCitations = citations.filter(
        (citation, index, self) =>
          index ===
          self.findIndex(
            (c) =>
              c.url_citation?.url === citation.url_citation?.url &&
              c?.title === citation.title
          )
      );

      return { model, citations: uniqueCitations };
    });
  };

  const citationsByModel = getCitationsByModel();

  // Function to export citations to CSV
  const exportToCSV = () => {
    if (citationsByModel.length === 0) {
      return;
    }

    // Create CSV headers
    const headers = ['Model', 'Title', 'URL', 'Snippet', 'Domain', 'Date'];
    
    // Create CSV rows
    const rows: string[] = [];
    
    citationsByModel.forEach((modelData) => {
      modelData.citations.forEach((citation) => {
        const title = citation.url_citation?.title || citation.title || '';
        const url = citation.url_citation?.url || citation.url || '';
        const snippet = citation.url_citation?.snippet || citation.text || '';
        const domain = safeGetHostname(url);
        const date = new Date().toISOString().split('T')[0]; // Use current date as export date
        
        // Escape quotes and commas in CSV values
        const escapeCSVValue = (value: string) => {
          if (value.includes('"') || value.includes(',') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        };
        
        const row = [
          escapeCSVValue(modelData.model),
          escapeCSVValue(title),
          escapeCSVValue(url),
          escapeCSVValue(snippet),
          escapeCSVValue(domain),
          escapeCSVValue(date)
        ].join(',');
        
        rows.push(row);
      });
    });
    
    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `citations-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (citationsByModel.length === 0) {
    return (
      <Card className="bg-background shadow-none border-[#e2e2e2]/70 dark:border-accent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Quote className="w-5 h-5" />
            Citations by Model
          </CardTitle>
          <CardDescription>
            Source citations used by AI models in their analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No citations found for the selected filters.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-background shadow-none border-[#e2e2e2]/70 dark:border-accent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Quote className="w-5 h-5" />
              Citations by Model
            </CardTitle>
            <CardDescription>
              Source citations used by AI models in their analysis
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="min-h-[500px]">
          <motion.div
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {citationsByModel.map((modelData) => {
              const IconComponent = modelIcons[modelData.model] || Quote;
              const isExpanded = expandedModel === modelData.model;

              return (
                <motion.div
                  key={modelData.model}
                  variants={itemVariants}
                  className="border border-accent rounded-lg overflow-hidden"
                >
                  <Button
                    variant="ghost"
                    className="w-full p-4 h-auto justify-between text-left"
                    onClick={() =>
                      setExpandedModel(isExpanded ? null : modelData.model)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className="w-5 h-5" />
                      <div>
                        <h3 className="font-medium">{modelData.model}</h3>
                        <p className="text-sm text-muted-foreground">
                          {modelData.citations.length} citation
                          {modelData.citations.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {modelData.citations.length}
                    </Badge>
                  </Button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 space-y-3">
                          {modelData.citations.map((citation, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="border border-muted rounded-lg p-3 bg-muted/20 hover:bg-muted/40 transition-colors"
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <a
                                    href={
                                      citation.url_citation?.url || citation.url
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-400 hover:underline font-medium text-sm flex-1 line-clamp-2"
                                  >
                                    {citation.url_citation?.title ||
                                      citation.title}
                                  </a>
                                  <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                </div>

                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {citation.url_citation?.snippet ||
                                    citation.text}
                                </p>

                                <div className="flex items-center justify-between">
                                  <Badge variant="outline" className="text-xs">
                                    {safeGetHostname(
                                      citation?.url_citation?.url ||
                                        citation?.url
                                    )}
                                  </Badge>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
