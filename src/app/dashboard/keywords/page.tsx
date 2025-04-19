"use client";

import { useState } from "react";
import { Bot, Loader2, Search, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";

type FormData = {
  keywords: string;
  brandName: string;
  domain: string;
  intent: string;
};

// Result types
type KeywordResult = {
  keyword: string;
  prompts: string[];
  search_volume?: number;
  difficulty?: number;
  opportunity_score?: number;
  relevance?: number;
};

type ModelResults = {
  [modelName: string]: KeywordResult[];
};

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function KeywordResearchPage() {
  const [formData, setFormData] = useState<FormData>({
    keywords: "",
    brandName: "",
    domain: "",
    intent: "no_intent",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ModelResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("Llama 4 Scout");
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const {user} = useAuth()

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleIntentChange = (value: string) => {
    setFormData((prev) => ({ ...prev, intent: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResults(null);

    // Basic validation
    if (!formData.keywords.trim() || !formData.brandName.trim()) {
      setError("Keywords and Brand Name are required.");
      setIsLoading(false);
      return;
    }

    // Split keywords by newline, trim whitespace, and filter empty lines
    const keywordsList = formData.keywords
      .split('\n')
      .map(kw => kw.trim())
      .filter(kw => kw !== '');

    if (keywordsList.length === 0 || keywordsList.length > 5) {
      setError("Please enter between 1 and 5 keywords, each on a new line.");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Submitting request with data:", {
        keywords: keywordsList,
        brandName: formData.brandName,
        domain: formData.domain,
        intent: formData.intent,
      });

      const response = await fetch('/api/keywords/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: keywordsList,
          brandName: formData.brandName,
          domain: formData.domain,
          intent: formData.intent,
          user: user
        }),
      });

      // Log the response for debugging
      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries([...response.headers.entries()]));
      
      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // If not JSON, try to get the text for better error info
        const responseText = await response.text();
        console.error("Non-JSON response:", responseText);
        throw new Error(`API returned non-JSON response (${response.status} ${response.statusText})`);
      }

      // Parse the JSON response
      const data = await response.json();
      console.log("API response data:", data);

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      if (data.success && data.results) {
        setResults(data.results);
        // Set active tab to first model
        if (Object.keys(data.results).length > 0) {
          setActiveTab(Object.keys(data.results)[0]);
        }
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMessage);
      console.error("API Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setSelectedPrompt(prompt);
    setIsDialogOpen(true);
  };

  const getIntentBadge = (intent: string) => {
    switch (intent) {
      case 'high':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">High Intent</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Medium Intent</Badge>;
      case 'low':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Low Intent</Badge>;
      default:
        return <Badge variant="outline">No Intent</Badge>;
    }
  };

  return (
    <motion.div 
      className="flex flex-col gap-6 p-6"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <motion.div className="flex flex-col gap-2" variants={slideUp}>
        <h1 className="text-3xl font-bold tracking-tight">Keyword Research</h1>
        <p className="text-muted-foreground">
          Transform your SEO keywords into AI search prompts for modern search engines.
        </p>
      </motion.div>

      <motion.div variants={slideUp}>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="space-y-1.5">
                <Label htmlFor="keywords" className="text-base">Keywords</Label>
                <Textarea
                  id="keywords"
                  placeholder="Enter up to 5 keywords, one per line"
                  value={formData.keywords}
                  onChange={handleInputChange}
                  rows={5}
                  required
                  disabled={isLoading}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Each keyword will generate multiple search prompts
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="intent" className="text-base">Search Intent</Label>
                <Select
                  value={formData.intent}
                  onValueChange={handleIntentChange}
                  disabled={isLoading}
                >
                  <SelectTrigger id="intent">
                    <SelectValue placeholder="Select Intent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_intent">No Intent</SelectItem>
                    <SelectItem value="low">Low Intent</SelectItem>
                    <SelectItem value="medium">Medium Intent</SelectItem>
                    <SelectItem value="high">High Intent</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Controls the buying/conversion intent of generated prompts
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="space-y-1.5">
                <Label htmlFor="brandName" className="text-base">Brand Name</Label>
                <Input
                  id="brandName"
                  placeholder="e.g., Nike"
                  value={formData.brandName}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="domain" className="text-base">Domain (optional)</Label>
                <Input
                  id="domain"
                  placeholder="e.g., nike.com (without https://)"
                  value={formData.domain}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-destructive/10 text-destructive rounded-md px-4 py-3"
              >
                <p className="text-sm">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.div 
            className="flex justify-end"
            variants={slideUp}
          >
            <Button 
              type="submit" 
              disabled={isLoading} 
              size="lg"
              className="w-full md:w-auto min-w-40"
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
              ) : (
                <><Bot className="h-4 w-4" /> Generate Search Prompts</>
              )}
            </Button>
          </motion.div>
        </form>
      </motion.div>

      {/* Loading Indicator */}
      <AnimatePresence>
        {isLoading && !results && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Generating search prompts...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Section */}
      <AnimatePresence>
        {results && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6 space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold">Search Prompts</h2>
                {getIntentBadge(formData.intent)}
              </div>
              <p className="text-muted-foreground">
                Click any prompt to search or copy. Switch between AI models to see different prompt styles.
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6 justify-start rounded-md bg-transparent p-1">
                {results && Object.keys(results).map((modelName) => (
                  <TabsTrigger 
                    key={modelName} 
                    value={modelName} 
                    className="rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    {modelName}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {results && Object.keys(results).map((modelName) => (
                <TabsContent key={modelName} value={modelName} className="mt-0">
                  <motion.div 
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="overflow-hidden rounded-md border"
                  >
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-[200px]">Keyword</TableHead>
                          <TableHead>Generated Search Prompts</TableHead>
                          <TableHead className="text-right">Metrics</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results[modelName]?.map((result, idx) => (
                          <TableRow key={`${result.keyword}-${idx}`} className="hover:bg-transparent">
                            <TableCell className="font-medium align-top py-4">
                              {result.keyword}
                            </TableCell>
                            <TableCell className="py-3">
                              <motion.div 
                                className="flex flex-col gap-2"
                                variants={staggerContainer}
                                initial="hidden"
                                animate="visible"
                              >
                                {result.prompts.map((prompt, i) => (
                                  <motion.div
                                    key={`prompt-${i}`}
                                    variants={slideUp}
                                    className="rounded-md bg-muted/30 hover:bg-muted/70 px-4 py-3 cursor-pointer flex items-center justify-between group transition-colors"
                                    onClick={() => handlePromptClick(prompt)}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <span>{prompt}</span>
                                    <Search className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                                  </motion.div>
                                ))}
                              </motion.div>
                            </TableCell>
                            <TableCell className="text-right align-top py-4">
                              <div className="space-y-3 text-sm">
                                <div>
                                  <div className="font-medium text-muted-foreground">Search Volume</div>
                                  <div className="font-mono">{result.search_volume || 'N/A'}</div>
                                </div>
                                <div>
                                  <div className="font-medium text-muted-foreground">Difficulty</div>
                                  <div className="font-mono">{result.difficulty?.toFixed(1) || 'N/A'}</div>
                                </div>
                                <div>
                                  <div className="font-medium text-muted-foreground">Opportunity</div>
                                  <div className="font-mono">{result.opportunity_score?.toFixed(1) || 'N/A'}</div>
                                </div>
                                <div>
                                  <div className="font-medium text-muted-foreground">Relevance</div>
                                  <div className="font-mono">{result.relevance?.toFixed(1) || 'N/A'}</div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </motion.div>
                </TabsContent>
              ))}
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Prompt Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Search with this prompt</DialogTitle>
            <DialogDescription>
              Use this prompt to search or copy it to your clipboard.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="rounded-md bg-muted/30 p-4 font-mono text-sm">
              {selectedPrompt}
            </div>
            <div className="flex gap-2 ">
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedPrompt) {
                    navigator.clipboard.writeText(selectedPrompt);
                    toast({
                      title: "Prompt Copied",
                      description: "The prompt has been copied to your clipboard.",
                      duration: 5000,
                    });
                  }
                }}
              >
                Copy
              </Button>
              <Button
                onClick={() => {
                  if (selectedPrompt) {
                    window.open(`https://www.google.com/search?q=${encodeURIComponent(selectedPrompt)}`, '_blank');
                  }
                }}
              >
                <Search className="mr-2 h-4 w-4" /> Search Google
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  if (selectedPrompt) {
                    window.open(`https://claude.ai/chat?prompt=${encodeURIComponent(selectedPrompt)}`, '_blank');
                  }
                }}
              >
                <ExternalLink className="mr-2 h-4 w-4" /> Claude
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
} 