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
import { 
  BarChart3, 
  Bot, 
  Building2, 
  GitCompare, 
  LineChart, 
  MessageSquare, 
  Plus, 
  Search, 
  TrendingUp, 
  Twitter, 
  ChevronRight,
  Users,
  ArrowRight,
  Sparkles,
  AlertCircle,
  History
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

export default function DashboardPage() {
  // Mock data
  const brands = [
    { id: "1", name: "TechNova", industry: "Technology" },
    { id: "2", name: "EcoSolutions", industry: "Sustainability" }
  ]
  
  const recentQueries = [
    { query: "best tech companies", timestamp: "2023-12-15T10:30:00Z", models: ["DeepSeek", "Llama 3"] },
    { query: "sustainable companies", timestamp: "2023-12-13T09:45:00Z", models: ["DeepSeek", "Claude"] }
  ]
  
  const aiInsights = [
    { 
      title: "Visibility in Innovation Queries", 
      description: "Your brand 'TechNova' appears in the top 5 results for innovation-related queries",
      type: "positive"
    },
    {
      title: "Missed Customer Service Keywords",
      description: "None of your brands appear in searches for 'best customer support' or 'excellent service'",
      type: "negative"
    },
    {
      title: "Opportunity: Sustainability Mentions",
      description: "AI models associate 'EcoSolutions' strongly with sustainability, leverage this in content",
      type: "opportunity"
    }
  ]
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
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
                  <BreadcrumbPage>Overview</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Brand Scope Dashboard</h1>
              <p className="text-muted-foreground">Monitor your brand's visibility across AI models</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>Add Brand</span>
              </Button>
              <Button className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span>Run AI Query</span>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Brand Visibility Score</CardTitle>
                <CardDescription>Average across all AI models</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78/100</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
                <div className="mt-4 h-[80px] text-primary"><TrendingUp className="h-full w-full opacity-20" /></div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">AI Model Coverage</CardTitle>
                <CardDescription>Models where your brands appear</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4/5</div>
                <p className="text-xs text-muted-foreground">DeepSeek, Llama 3, Claude, Mixtral</p>
                <div className="mt-4 h-[80px] text-primary"><Bot className="h-full w-full opacity-20" /></div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Social Sentiment</CardTitle>
                <CardDescription>From X (Twitter)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">82% Positive</div>
                <p className="text-xs text-muted-foreground">1,286 mentions analyzed</p>
                <div className="mt-4 h-[80px] text-primary"><Twitter className="h-full w-full opacity-20" /></div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your Brands</CardTitle>
                    <CardDescription>Manage your brand portfolio</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <span>View All</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {brands.length > 0 ? (
                    brands.map(brand => (
                      <div key={brand.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{brand.name}</p>
                            <p className="text-sm text-muted-foreground">{brand.industry}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="gap-1">
                          <span>Details</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Building2 className="h-10 w-10 text-muted" />
                      <h3 className="mt-4 text-lg font-medium">No brands added</h3>
                      <p className="text-muted-foreground">
                        Add your first brand to begin analysis
                      </p>
                      <Button
                        className="mt-4"
                        size="sm"
                      >
                        Add Brand
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent AI Queries</CardTitle>
                    <CardDescription>Your recent brand searches</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <span>View All</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentQueries.length > 0 ? (
                    recentQueries.map((item, index) => (
                      <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                            <History className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">"{item.query}"</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{formatDate(item.timestamp)}</span>
                              <span>•</span>
                              <span>{item.models.length} models</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {item.models.slice(0, 2).map((model, idx) => (
                            <Badge key={idx} variant="outline" className="flex items-center gap-1">
                              <Bot className="h-3 w-3" />
                              {model}
                            </Badge>
                          ))}
                          {item.models.length > 2 && (
                            <Badge variant="outline">+{item.models.length - 2}</Badge>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Search className="h-10 w-10 text-muted" />
                      <h3 className="mt-4 text-lg font-medium">No queries run</h3>
                      <p className="text-muted-foreground">
                        Run your first AI query to see results
                      </p>
                      <Button
                        className="mt-4"
                        size="sm"
                      >
                        New Query
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Insights</CardTitle>
              <CardDescription>Smart recommendations based on AI analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiInsights.map((insight, index) => {
                  const Icon = insight.type === 'positive' 
                    ? TrendingUp 
                    : insight.type === 'negative' 
                      ? AlertCircle 
                      : Sparkles;
                  
                  return (
                    <div 
                      key={index} 
                      className={`flex items-start gap-3 rounded-lg border p-4 ${
                        insight.type === 'positive' 
                          ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30' 
                          : insight.type === 'negative'
                            ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
                            : 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30'
                      }`}
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        insight.type === 'positive' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' 
                          : insight.type === 'negative'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">{insight.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Brand vs. Competitors</CardTitle>
                <CardDescription>Performance comparison</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="rounded-md bg-muted/50 h-[200px] flex items-center justify-center">
                  <GitCompare className="h-12 w-12 text-muted" />
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button variant="outline" className="w-full">
                  View Comparison
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Keyword Opportunities</CardTitle>
                <CardDescription>Trending keywords for your brand</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="rounded-md bg-muted/50 h-[200px] flex items-center justify-center">
                  <Search className="h-12 w-12 text-muted" />
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button variant="outline" className="w-full">
                  Explore Keywords
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Social Mentions</CardTitle>
                <CardDescription>Recent social media activity</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="rounded-md bg-muted/50 h-[200px] flex items-center justify-center">
                  <MessageSquare className="h-12 w-12 text-muted" />
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button variant="outline" className="w-full">
                  View Mentions
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
