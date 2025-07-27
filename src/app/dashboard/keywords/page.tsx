"use client";

import { useState, useEffect } from "react";
import { Bot, Loader2, Search, AlertCircle, Zap, Sparkles, History } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";

type FormData = {
  businessBrief: string;
  keyword: string;
  website: string;
  language: string;
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
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    businessBrief: "",
    keyword: "",
    website: "",
    language: "en",
  });
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [analysisTime, setAnalysisTime] = useState(0);
  const { user } = useAuth();

  // Timer for analysis duration
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined = undefined;

    if (isLoading) {
      interval = setInterval(() => {
        setAnalysisTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      setAnalysisTime(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLoading]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    
    // Clear error when user starts typing
    if (error) setError(null);
    if (dailyLimitReached) setDailyLimitReached(false);
  };

  const formatTime = (totalSeconds: number): string => {
    if (totalSeconds < 0) return "0s";
    if (totalSeconds === 0) return "0s";

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
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
          language: formData.language,
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
        toast.success(`Keyword analysis completed. Redirecting to results...`);

        // Redirect to history page with keyword_id immediately
        setTimeout(() => {
        if (data.keyword_id) {
          router.push(`/dashboard/keywords/history/${data.keyword_id}`);
          } else {
            router.push(`/dashboard/keywords/history`);
          }
        }, 1500);
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



  const hasAnyInput = formData.businessBrief.trim() || formData.keyword.trim() || formData.website.trim();

  return (
    <motion.div 
      className="flex flex-col gap-6 p-6"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <motion.div className="flex flex-col gap-2" variants={slideUp}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Keyword Analysis</h1>
              <p className="text-muted-foreground">
                Discover 50 keyword opportunities for your business with AI-powered analysis
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/keywords/history')}
            className="flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            View History
          </Button>
        </div>
      </motion.div>

      {/* Credit Cost Info */}
      <motion.div variants={slideUp}>
        <Alert className="bg-blue-500/10 border-blue-500/20 border-dashed text-blue-500">
          <Zap className="h-4 w-4" />
          <AlertDescription className="flex items-center gap-2">
            Each keyword analysis costs <Badge variant="secondary" className="bg-blue-500/20 text-blue-600">3 Credits</Badge> and provides 
            <strong className="text-blue-500">50 keyword opportunities</strong> with detailed metrics.
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
                <div className="space-y-4 flex gap-4">
                  <div className="space-y-2 w-full">
                    <Label htmlFor="website" className="text-base font-medium">
                      Website URL
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="e.g., https://denticlinic.ai"
                      value={formData.website}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                    <p className="text-sm text-muted-foreground">
                      Your business website (optional if other fields are provided)
                    </p>
                  </div>
                  <div className="space-y-2 md:w-[300px]">
                    <Label htmlFor="language" className="text-base font-medium">
                      Language
                    </Label>
                    <Select value={formData.language} onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="it">Italian</SelectItem>
                        <SelectItem value="pt">Portuguese</SelectItem>
                        <SelectItem value="ru">Russian</SelectItem>
                      </SelectContent>
                    </Select> 
                  </div>

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
                          Analyzing Keywords... {formatTime(analysisTime)}
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Analyze Keywords (3 Credits)
                        </>
                      )}
                    </Button>
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


    </motion.div>
  );
} 