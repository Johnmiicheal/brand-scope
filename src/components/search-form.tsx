'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AnalysisMode, analysisModes } from '@/types/search';
import { toast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

export function SearchForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AnalysisMode>('DeepFocus');
  const [brandName, setBrandName] = useState('');
  const [queries, setQueries] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [industry, setIndustry] = useState('');
  
  // For generating brands
  const [generatingBrands, setGeneratingBrands] = useState(false);
  const [generatedBrands, setGeneratedBrands] = useState<Array<{ name: string; description: string }>>([]);
  
  // Mode descriptions
  const modeDescriptions = {
    DeepFocus: "Simple analysis using Gemma2 and Llama-3.3 to analyze and rank brands.",
    Voyager: "Comprehensive analysis using multiple models, including social media sentiment and trend analysis.",
    Explorer: "Competitive analysis to identify advantages and disadvantages against competitors."
  };
  
  // Handle brand generation
  const handleGenerateBrands = async () => {
    if (!industry.trim()) {
      toast({
        title: "Industry is required",
        description: "Please specify an industry to generate brands for.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setGeneratingBrands(true);
      const response = await fetch('/api/generate-brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ industry }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate brands');
      }
      
      const data = await response.json();
      setGeneratedBrands(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate brands. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGeneratingBrands(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!brandName.trim()) {
      toast({
        title: "Brand name is required",
        description: "Please provide a brand name for analysis.",
        variant: "destructive"
      });
      return;
    }
    
    if (!queries.trim()) {
      toast({
        title: "Queries are required",
        description: "Please provide at least one query for analysis.",
        variant: "destructive"
      });
      return;
    }
    
    if (mode === 'Explorer' && !competitors.trim()) {
      toast({
        title: "Competitors are required",
        description: "Explorer mode requires at least one competitor.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const queriesList = queries
        .split('\n')
        .map(q => q.trim())
        .filter(q => q.length > 0);
      
      const competitorsList = competitors
        .split('\n')
        .map(c => c.trim())
        .filter(c => c.length > 0);
      
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode,
          brand_id: brandName,
          user_id: userId,
          queries: queriesList,
          competitors: competitorsList,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start analysis');
      }
      
      // Generate a unique search ID for this analysis
      const searchId = uuidv4();
      
      toast({
        title: "Analysis started",
        description: `Your ${mode} analysis is processing. You'll be redirected to results when complete.`,
      });
      
      // Redirect to analysis results page
      router.push(`/dashboard/analysis?search_id=${searchId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Brand Analysis</CardTitle>
          <CardDescription>
            Analyze your brand's position and sentiment across the web.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={mode} 
            onValueChange={(value) => setMode(value as AnalysisMode)}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 mb-6">
              {analysisModes.map(m => (
                <TabsTrigger key={m} value={m} className="text-center">
                  {m}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {analysisModes.map(m => (
              <TabsContent key={m} value={m} className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Badge variant="outline">{m}</Badge>
                  <p className="text-sm text-muted-foreground">{modeDescriptions[m]}</p>
                </div>
                
                {m === 'DeepFocus' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="industry" className="text-sm font-medium">
                          Industry
                        </label>
                        <Input
                          id="industry"
                          placeholder="e.g., Technology, Fashion, Food"
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleGenerateBrands}
                          disabled={generatingBrands || !industry.trim()}
                        >
                          {generatingBrands ? 'Generating...' : 'Generate Top Brands'}
                        </Button>
                      </div>
                    </div>
                    
                    {generatedBrands.length > 0 && (
                      <div className="border rounded-md p-4 space-y-2 max-h-[300px] overflow-y-auto">
                        <h3 className="font-medium">Generated Brands:</h3>
                        <ul className="space-y-2">
                          {generatedBrands.map((brand, idx) => (
                            <li key={idx} className="border-b pb-2">
                              <div className="flex justify-between">
                                <span className="font-semibold">{brand.name}</span>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setBrandName(brand.name)}
                                >
                                  Select
                                </Button>
                              </div>
                              <p className="text-sm text-muted-foreground">{brand.description}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label htmlFor="brand-name" className="text-sm font-medium">
                    Brand Name
                  </label>
                  <Input
                    id="brand-name"
                    placeholder="Enter your brand name"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="queries" className="text-sm font-medium">
                    Queries (one per line)
                  </label>
                  <Textarea
                    id="queries"
                    placeholder={`Enter queries for analysis\ne.g., market share\ncustomer satisfaction\nbrand recognition`}
                    rows={5}
                    value={queries}
                    onChange={(e) => setQueries(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Each line will be treated as a separate query for analysis.
                  </p>
                </div>
                
                {m === 'Explorer' && (
                  <div className="space-y-2">
                    <label htmlFor="competitors" className="text-sm font-medium">
                      Competitors (one per line)
                    </label>
                    <Textarea
                      id="competitors"
                      placeholder={`Enter competitor names\ne.g., Competitor A\nCompetitor B\nCompetitor C`}
                      rows={3}
                      value={competitors}
                      onChange={(e) => setCompetitors(e.target.value)}
                      required={m === 'Explorer'}
                    />
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Start Analysis'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
} 