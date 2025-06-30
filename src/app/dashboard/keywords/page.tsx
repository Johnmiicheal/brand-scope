"use client";

import { useState } from "react";
import { Bot, Loader2, Search, AlertCircle, Calendar, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";
import { KeywordAnalysisResults } from "@/components/keywords/keyword-analysis-results";

type FormData = {
  businessBrief: string;
  keyword: string;
  website: string;
};

type KeywordAnalysisResponse = {
  success: boolean;
  data: {
    keywords: Record<string, {
      conversational_keyword: string;
      intent: string;
      google_seed_keyword: string;
      category: string;
      search_volume: number;
      competition_index: number;
      low_cpc: string;
      trend_6m: string;
      relevance_score: number;
    }>;
    metadata: Array<{ language: string; country: string }>;
  };
  remainingAnalyses: number;
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function KeywordAnalysisPage() {
  const [formData, setFormData] = useState<FormData>({
    businessBrief: "",
    keyword: "",
    website: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<KeywordAnalysisResponse['data'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const { user } = useAuth();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    
    // Clear error when user starts typing
    if (error) setError(null);
    if (dailyLimitReached) setDailyLimitReached(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResults(null);
    setDailyLimitReached(false);

    // Validate that at least one field is filled
    if (!formData.businessBrief.trim() && !formData.keyword.trim() && !formData.website.trim()) {
      setError("Please provide at least one of: business brief, keyword, or website.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/keywords-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessBrief: formData.businessBrief.trim(),
          keyword: formData.keyword.trim(),
          website: formData.website.trim(),
          user: user,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setDailyLimitReached(true);
          setError(data.error || 'Daily limit reached');
        } else {
          setError(data.error || `Request failed with status ${response.status}`);
        }
        return;
      }

      if (data.success && data.data) {
        setResults(data.data);
        toast({
          title: "Analysis Complete",
          description: `Found ${Object.keys(data.data.keywords).length} keyword opportunities.`,
        });
      } else {
        setError("Invalid response format from analysis service");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMessage);
      console.error("Keyword analysis error:", err);
    } finally {
      setIsLoading(false);
    }
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

  const hasAnyInput = formData.businessBrief.trim() || formData.keyword.trim() || formData.website.trim();

  return (
    <motion.div 
      className="flex flex-col gap-6 p-6"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <motion.div className="flex flex-col gap-2" variants={slideUp}>
        <div className="flex items-center gap-3">
          <Bot className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Keyword Analysis</h1>
            <p className="text-muted-foreground">
              Discover 50 keyword opportunities for your business with AI-powered analysis
            </p>
          </div>
        </div>
      </motion.div>

      {/* Daily Limit Info */}
      <motion.div variants={slideUp}>
        <Alert className="bg-blue-500/10 border-blue-500/20 border-dashed text-blue-500">
          <Calendar className="h-4 w-4" />
          <AlertDescription className="flex">
            You have <strong className="text-blue-500">1 keyword analysis</strong> available per day. Use it wisely to discover the best opportunities for your brand.
          </AlertDescription>
        </Alert>
      </motion.div>

      <motion.div variants={slideUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Business Information
            </CardTitle>
            <CardDescription>
              Provide information about your business to get personalized keyword recommendations. 
              At least one field is required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessBrief" className="text-base font-medium">
                      Business Brief Description
                    </Label>
                    <Textarea
                      id="businessBrief"
                      placeholder="e.g., My business is a dental clinic named DentiClinic that provides comprehensive dental care services..."
                      value={formData.businessBrief}
                      onChange={handleInputChange}
                      className="min-h-[100px] resize-none"
                      disabled={isLoading}
                    />
                    <p className="text-sm text-muted-foreground">
                      Describe your business, services, and target audience
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="keyword" className="text-base font-medium">
                      Main Keyword (optional)
                    </Label>
                    <Input
                      id="keyword"
                      placeholder="e.g., dental clinic, marketing tools, etc."
                      value={formData.keyword}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                    <p className="text-sm text-muted-foreground">
                      Primary keyword related to your business or industry
                    </p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-base font-medium">
                      Website URL
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="e.g., https://otterly.ai"
                      value={formData.website}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                    <p className="text-sm text-muted-foreground">
                      Your business website (optional if other fields are provided)
                    </p>
                  </div>

                  <div className="pt-8">
                    <Button
                      type="submit"
                      disabled={isLoading || !hasAnyInput}
                      className="w-full bg-blue-500 hover:bg-blue-600"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing Keywords...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Analyze Keywords
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Alert variant={dailyLimitReached ? "default" : "destructive"}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {error}
                        {dailyLimitReached && (
                          <div className="mt-2 text-sm">
                            Come back tomorrow for another analysis, or upgrade your plan for more daily analyses.
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <KeywordAnalysisResults
              keywords={results.keywords}
              metadata={results.metadata}
              onScheduleKeyword={handleScheduleKeyword}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 