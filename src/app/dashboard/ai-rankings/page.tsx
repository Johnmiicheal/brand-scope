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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { 
  BarChart3, 
  Bot, 
  Building2, 
  Calendar, 
  ChevronDown, 
  FileDown, 
  Filter, 
  LineChart, 
  Plus, 
  RefreshCw, 
  TrendingUp,
  Search,
  History,
  AlertCircle
} from "lucide-react"

export default function AIRankingsPage() {
  const [selectedBrand, setSelectedBrand] = useState("all")
  const [selectedTimeframe, setSelectedTimeframe] = useState("30days")
  
  // Mock data
  const brands = [
    { id: "1", name: "TechNova" },
    { id: "2", name: "EcoSolutions" }
  ]
  
  const rankingData = [
    {
      id: "1",
      entity_id: "1",
      entity_type: "brand",
      entity_name: "TechNova",
      llm_name: "DeepSeek",
      query: "best tech companies",
      rank: 4,
      score: 0.89,
      analyzed_at: "2023-12-15T10:30:00Z"
    },
    {
      id: "2",
      entity_id: "1",
      entity_type: "brand",
      entity_name: "TechNova",
      llm_name: "Llama 3",
      query: "best tech companies",
      rank: 7,
      score: 0.76,
      analyzed_at: "2023-12-15T10:32:00Z"
    },
    {
      id: "3",
      entity_id: "1",
      entity_type: "brand",
      entity_name: "TechNova",
      llm_name: "Mixtral",
      query: "most innovative tech firms",
      rank: 3,
      score: 0.92,
      analyzed_at: "2023-12-14T14:15:00Z"
    },
    {
      id: "4",
      entity_id: "2",
      entity_type: "brand",
      entity_name: "EcoSolutions",
      llm_name: "DeepSeek",
      query: "sustainable companies",
      rank: 2,
      score: 0.95,
      analyzed_at: "2023-12-13T09:45:00Z"
    },
    {
      id: "5",
      entity_id: "2",
      entity_type: "brand",
      entity_name: "EcoSolutions",
      llm_name: "Claude",
      query: "eco-friendly businesses",
      rank: 5,
      score: 0.84,
      analyzed_at: "2023-12-12T16:20:00Z"
    }
  ]
  
  const filteredRankings = selectedBrand === "all" 
    ? rankingData 
    : rankingData.filter(item => item.entity_id === selectedBrand)
  
  const getScoreColor = (score: number) => {
    if (score >= 0.9) return "success"
    if (score >= 0.7) return "warning"
    return "destructive"
  }
  
  const getRankColor = (rank: number) => {
    if (rank <= 3) return "success"
    if (rank <= 7) return "warning"
    return "destructive"
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
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
                  <BreadcrumbPage>AI Rankings</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">AI Rankings</h1>
              <p className="text-muted-foreground">Track how your brands rank in AI search results</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                New Query
              </Button>
            </div>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Brand Rankings Overview</CardTitle>
              <CardDescription>View your brand rankings across different AI models</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2">
                <div className="flex-1">
                  <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                    <SelectTrigger className="w-full" id="brand">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <SelectValue placeholder="Select brand" />
                      </div>
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="all">All Brands</SelectItem>
                      {brands.map(brand => (
                        <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                    <SelectTrigger className="w-[150px]" id="timeframe">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <SelectValue placeholder="Select timeframe" />
                      </div>
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="7days">Last 7 Days</SelectItem>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                      <SelectItem value="90days">Last 90 Days</SelectItem>
                      <SelectItem value="year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Filter className="h-4 w-4" />
                </Button>
                
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <FileDown className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="rounded-md border">
                <div className="grid grid-cols-12 border-b bg-muted/50 px-4 py-2 text-sm font-medium">
                  <div className="col-span-4">Brand</div>
                  <div className="col-span-2">AI Model</div>
                  <div className="col-span-3">Query</div>
                  <div className="col-span-1 text-center">Rank</div>
                  <div className="col-span-1 text-center">Score</div>
                  <div className="col-span-1 text-right">Date</div>
                </div>
                
                <div className="divide-y">
                  {filteredRankings.length > 0 ? (
                    filteredRankings.map(item => (
                      <div key={item.id} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                        <div className="col-span-4 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">{item.entity_name}</span>
                        </div>
                        <div className="col-span-2 flex items-center gap-1">
                          <Bot className="h-4 w-4 text-muted-foreground" />
                          <span>{item.llm_name}</span>
                        </div>
                        <div className="col-span-3 truncate">
                          "{item.query}"
                        </div>
                        <div className="col-span-1 text-center">
                          <Badge variant={getRankColor(item.rank)}>#{item.rank}</Badge>
                        </div>
                        <div className="col-span-1 text-center">
                          <Badge variant={getScoreColor(item.score)}>{item.score.toFixed(2)}</Badge>
                        </div>
                        <div className="col-span-1 text-right text-muted-foreground">
                          {formatDate(item.analyzed_at)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <AlertCircle className="h-8 w-8 text-muted" />
                      <p className="mt-2 text-center font-medium">No ranking data found</p>
                      <p className="text-center text-muted-foreground">
                        Run an AI query to analyze brand rankings
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Rankings by AI Model</CardTitle>
                <CardDescription>Compare rankings across different AI models</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] rounded-md bg-muted/50 flex items-center justify-center">
                  <BarChart3 className="h-16 w-16 text-muted" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Score Trends</CardTitle>
                <CardDescription>Track your brand's AI visibility score over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] rounded-md bg-muted/50 flex items-center justify-center">
                  <LineChart className="h-16 w-16 text-muted" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Queries</CardTitle>
              <CardDescription>Your most recent AI search queries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['best tech companies', 'most innovative tech firms', 'sustainable companies', 'eco-friendly businesses'].map((query, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                        <History className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">"{query}"</p>
                        <p className="text-sm text-muted-foreground">Run across {index + 1} AI models</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Run Again
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 