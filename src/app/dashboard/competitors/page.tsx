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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useState } from "react"
import { 
  Building2, 
  Plus, 
  Pencil, 
  Trash2, 
  Globe, 
  Briefcase, 
  ExternalLink, 
  Users, 
  GitCompare,
  ChartBarHorizontal,
  TrendingUp,
  BarChart,
  PieChart
} from "lucide-react"

export default function CompetitorsPage() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState("")
  
  // Mock data for brands and competitors
  const brands = [
    { id: "1", name: "TechNova" },
    { id: "2", name: "EcoSolutions" }
  ]
  
  const [competitors, setCompetitors] = useState([
    {
      id: "1",
      brand_id: "1",
      name: "InnovateTech",
      industry: "Technology",
      website: "https://innovatetech.example.com",
      created_at: "2023-10-20"
    },
    {
      id: "2",
      brand_id: "1",
      name: "FutureSystems",
      industry: "Technology",
      website: "https://futuresystems.example.com",
      created_at: "2023-11-05"
    },
    {
      id: "3",
      brand_id: "2",
      name: "GreenPlanet",
      industry: "Sustainability",
      website: "https://greenplanet.example.com",
      created_at: "2023-11-15"
    }
  ])
  
  const [newCompetitor, setNewCompetitor] = useState({
    brand_id: "",
    name: "",
    industry: "",
    website: ""
  })
  
  const handleAddCompetitor = (e: React.FormEvent) => {
    e.preventDefault()
    const id = (Math.random() * 1000).toFixed(0)
    setCompetitors([...competitors, {
      id,
      brand_id: newCompetitor.brand_id,
      name: newCompetitor.name,
      industry: newCompetitor.industry,
      website: newCompetitor.website,
      created_at: new Date().toISOString().split('T')[0]
    }])
    setNewCompetitor({ brand_id: "", name: "", industry: "", website: "" })
    setShowAddForm(false)
  }
  
  const handleDeleteCompetitor = (id: string) => {
    setCompetitors(competitors.filter(competitor => competitor.id !== id))
  }
  
  const filteredCompetitors = selectedBrand 
    ? competitors.filter(competitor => competitor.brand_id === selectedBrand)
    : competitors

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
                  <BreadcrumbPage>Competitors</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Competitor Analysis</h1>
              <p className="text-muted-foreground">Track and compare competitors against your brands</p>
            </div>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Competitor
            </Button>
          </div>
          
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Competitor</CardTitle>
                <CardDescription>Enter competitor details to track against your brand</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCompetitor} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="brand">For Your Brand</Label>
                      <Select 
                        value={newCompetitor.brand_id} 
                        onValueChange={(value) => setNewCompetitor({...newCompetitor, brand_id: value})}
                        required
                      >
                        <SelectTrigger id="brand">
                          <SelectValue placeholder="Select your brand" />
                        </SelectTrigger>
                        <SelectContent>
                          {brands.map(brand => (
                            <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="competitor-name">Competitor Name</Label>
                      <Input 
                        id="competitor-name" 
                        placeholder="Enter competitor name" 
                        value={newCompetitor.name}
                        onChange={(e) => setNewCompetitor({...newCompetitor, name: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Input 
                        id="industry" 
                        placeholder="e.g., Technology, Healthcare" 
                        value={newCompetitor.industry}
                        onChange={(e) => setNewCompetitor({...newCompetitor, industry: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input 
                        id="website" 
                        placeholder="https://competitor.com" 
                        value={newCompetitor.website}
                        onChange={(e) => setNewCompetitor({...newCompetitor, website: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Add Competitor</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Competitors</CardTitle>
                  <CardDescription>Manage competitors for your brands</CardDescription>
                </div>
                <Select 
                  value={selectedBrand} 
                  onValueChange={setSelectedBrand}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Brands</SelectItem>
                    {brands.map(brand => (
                      <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCompetitors.map(competitor => {
                  const brand = brands.find(b => b.id === competitor.brand_id)
                  
                  return (
                    <Card key={competitor.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{competitor.name}</CardTitle>
                              <CardDescription className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                {competitor.industry}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteCompetitor(competitor.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2 pt-0">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Globe className="h-4 w-4" />
                          <a 
                            href={competitor.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:underline"
                          >
                            {competitor.website.replace(/(^\w+:|^)\/\//, '').replace(/\/$/, '')}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        
                        {brand && (
                          <div className="mt-2 flex items-center gap-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              vs {brand.name}
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="border-t bg-muted/30 p-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                        >
                          <GitCompare className="mr-2 h-3.5 w-3.5" />
                          Compare AI Rankings
                        </Button>
                      </CardFooter>
                    </Card>
                  )
                })}
                
                {filteredCompetitors.length === 0 && (
                  <Card className="md:col-span-2 lg:col-span-3">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <GitCompare className="h-12 w-12 text-muted" />
                      <h3 className="mt-4 text-lg font-medium">No competitors found</h3>
                      <p className="text-center text-muted-foreground">
                        {selectedBrand 
                          ? "No competitors added for this brand yet" 
                          : "Add your first competitor to start comparing"}
                      </p>
                      <Button 
                        onClick={() => setShowAddForm(true)}
                        className="mt-4 flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Competitor
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Competitive Ranking Analysis</CardTitle>
                <CardDescription>Compare your brand against competitors in AI rankings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-muted/50 p-6 h-[300px] flex flex-col items-center justify-center">
                  <ChartBarHorizontal className="h-16 w-16 text-muted mb-4" />
                  <p className="text-center text-muted-foreground">
                    Compare your brand's ranking position against competitors
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Visibility Scores</CardTitle>
                <CardDescription>AI model visibility scores comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-muted/50 p-6 h-[300px] flex flex-col items-center justify-center">
                  <PieChart className="h-16 w-16 text-muted mb-4" />
                  <p className="text-center text-muted-foreground">
                    Compare visibility scores across different AI models
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Keyword Overlap</CardTitle>
              <CardDescription>Compare keywords associated with your brand and competitors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md bg-muted/50 p-6 h-[300px] flex flex-col items-center justify-center">
                <BarChart className="h-16 w-16 text-muted mb-4" />
                <p className="text-center text-muted-foreground">
                  Analyze shared and unique keywords between your brand and competitors
                </p>
              </CardContent>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 