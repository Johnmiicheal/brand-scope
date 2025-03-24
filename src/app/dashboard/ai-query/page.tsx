"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { Bot, Search, TrendingUp, Target, Sparkles, AlertCircle, ThumbsUp, ThumbsDown, Brain } from "lucide-react"

export default function AIQueryPage() {
  const [query, setQuery] = useState("")
  const [brand, setBrand] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [hasResults, setHasResults] = useState(false)
  
  // Mock data for testing UI
  const models = [
    { id: "deepseek", name: "DeepSeek" },
    { id: "llama3", name: "Llama 3" },
    { id: "mixtral", name: "Mixtral" },
    { id: "claude", name: "Claude" },
    { id: "gpt4", name: "GPT-4" }
  ]
  
  const [selectedModels, setSelectedModels] = useState<string[]>(["deepseek", "llama3"])
  
  const sampleKeywords = [
    "AI marketing", "digital brand", "customer service", "innovation", "technology", 
    "sustainable", "user-friendly", "reliable", "trusted", "fast"
  ]
  
  const sampleResults = {
    "deepseek": {
      rank: 3,
      score: 0.87,
      keywords: ["AI marketing", "digital brand", "innovation", "technology"],
      summary: "Your brand appears positively in AI marketing and innovation contexts. Could improve visibility in customer service discussions.",
      recommendedQueries: ["How does Brand X innovate?", "Brand X technology applications", "Brand X digital transformation"]
    },
    "llama3": {
      rank: 5,
      score: 0.75,
      keywords: ["technology", "reliable", "trusted"],
      summary: "Brand appears in technology discussions but with limited presence. Not frequently mentioned in innovation contexts.",
      recommendedQueries: ["Is Brand X reliable?", "Brand X new products", "Brand X comparison"]
    },
    "mixtral": {
      rank: 2,
      score: 0.92,
      keywords: ["innovation", "technology", "sustainable", "user-friendly"],
      summary: "Strong association with innovation and sustainability. Well represented in future-focused discussions.",
      recommendedQueries: ["Brand X sustainability efforts", "Brand X innovative features", "Brand X future plans"]
    }
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || !brand.trim()) return
    
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setHasResults(true)
    }, 2500)
  }
  
  const toggleModelSelection = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(id => id !== modelId) 
        : [...prev, modelId]
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>AI Query</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">AI Search Query</h1>
              <p className="text-muted-foreground">Test how your brand appears in AI search results</p>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Query Configuration</CardTitle>
              <CardDescription>Select AI models and define your search query</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="brand">Your Brand Name</Label>
                    <Input
                      id="brand"
                      placeholder="Enter your brand name (e.g., Nike, Tesla)"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label>Select AI Models</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-1">
                      {models.map(model => (
                        <Button
                          key={model.id}
                          type="button"
                          variant={selectedModels.includes(model.id) ? "default" : "outline"}
                          onClick={() => toggleModelSelection(model.id)}
                          className="flex items-center gap-2"
                        >
                          <Bot className="h-4 w-4" />
                          <span>{model.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="query">Search Query</Label>
                    <Textarea
                      id="query"
                      placeholder="Enter a query to see how your brand appears in AI responses (e.g., best companies for sustainable products)"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="mt-1"
                      required
                    />
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground mb-1">Popular queries:</p>
                      <div className="flex flex-wrap gap-1">
                        {["best tech companies", "innovative brands", "sustainable companies", "trusted brands"].map(q => (
                          <Badge 
                            key={q} 
                            variant="outline" 
                            className="cursor-pointer"
                            onClick={() => setQuery(q)}
                          >
                            {q}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full flex items-center gap-2"
                  disabled={isLoading || !query.trim() || !brand.trim()}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Run AI Query
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          {hasResults && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Results for "{brand}"</h2>
                <Button variant="outline" size="sm">Save Results</Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(sampleResults).map(([modelId, result]) => {
                  const model = models.find(m => m.id === modelId)
                  return (
                    <Card key={modelId} className={`border-l-4 ${result.score > 0.85 ? 'border-l-green-500' : result.score > 0.7 ? 'border-l-yellow-500' : 'border-l-red-500'}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Bot className="h-4 w-4" /> 
                            {model?.name || modelId}
                          </CardTitle>
                          <Badge variant={result.score > 0.85 ? 'success' : result.score > 0.7 ? 'warning' : 'destructive'}>
                            Score: {result.score.toFixed(2)}
                          </Badge>
                        </div>
                        <CardDescription>Rank: #{result.rank} for query</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="mb-3">
                          <p className="text-sm font-medium mb-1">Keywords:</p>
                          <div className="flex flex-wrap gap-1">
                            {result.keywords.map(keyword => (
                              <Badge key={keyword} variant="secondary">{keyword}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Analysis:</p>
                          <p className="text-sm text-muted-foreground">{result.summary}</p>
                        </div>
                      </CardContent>
                      <CardFooter className="flex flex-col items-start pt-0">
                        <p className="text-sm font-medium mb-1">Suggested Queries:</p>
                        <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                          {result.recommendedQueries.map((q, i) => (
                            <li key={i}>{q}</li>
                          ))}
                        </ul>
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Keyword Analysis</CardTitle>
                  <CardDescription>Common keywords associated with your brand across AI models</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {sampleKeywords.map(keyword => {
                      const count = Object.values(sampleResults).filter(r => 
                        r.keywords.includes(keyword)
                      ).length;
                      
                      return (
                        <div key={keyword} className="flex flex-col items-center">
                          <Badge 
                            variant={count > 2 ? "success" : count > 1 ? "secondary" : "outline"}
                            className="text-sm px-3 py-1"
                          >
                            {keyword}
                          </Badge>
                          <span className="text-xs text-muted-foreground mt-1">
                            {count}/{Object.keys(sampleResults).length} models
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Improvement Recommendations</CardTitle>
                  <CardDescription>Ways to enhance your brand's visibility in AI responses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Improve Innovation Association</h3>
                        <p className="text-sm text-muted-foreground">
                          Your brand could benefit from stronger association with innovation keywords. 
                          Consider creating content that highlights your innovative products and services.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Target Customer Service Mentions</h3>
                        <p className="text-sm text-muted-foreground">
                          Customer service isn't strongly associated with your brand in AI responses.
                          Develop content highlighting your support experiences and customer satisfaction.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Leverage Strength in Sustainability</h3>
                        <p className="text-sm text-muted-foreground">
                          Your brand shows good associations with sustainability. Expand this advantage 
                          by creating more detailed content about your environmental initiatives.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 