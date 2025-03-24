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
import { useState } from "react"
import { Building2, Plus, Pencil, Trash2, Globe, Briefcase, Image, ExternalLink, Bot, Search } from "lucide-react"

export default function BrandsPage() {
  const [showAddForm, setShowAddForm] = useState(false)
  
  // Mock data for brands
  const [brands, setBrands] = useState([
    {
      id: "1",
      name: "TechNova",
      industry: "Technology",
      logo_url: "",
      website: "https://technova.example.com",
      created_at: "2023-10-15"
    },
    {
      id: "2",
      name: "EcoSolutions",
      industry: "Sustainability",
      logo_url: "",
      website: "https://ecosolutions.example.com",
      created_at: "2023-11-20"
    }
  ])
  
  const [newBrand, setNewBrand] = useState({
    name: "",
    industry: "",
    website: ""
  })
  
  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault()
    const id = (Math.random() * 1000).toFixed(0)
    setBrands([...brands, {
      id,
      name: newBrand.name,
      industry: newBrand.industry,
      logo_url: "",
      website: newBrand.website,
      created_at: new Date().toISOString().split('T')[0]
    }])
    setNewBrand({ name: "", industry: "", website: "" })
    setShowAddForm(false)
  }
  
  const handleDeleteBrand = (id: string) => {
    setBrands(brands.filter(brand => brand.id !== id))
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
                  <BreadcrumbPage>Brands</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Manage Brands</h1>
              <p className="text-muted-foreground">Add and manage your brands for AI ranking analysis</p>
            </div>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Brand
            </Button>
          </div>
          
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Brand</CardTitle>
                <CardDescription>Enter your brand details to start tracking its AI presence</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddBrand} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="brand-name">Brand Name</Label>
                      <Input 
                        id="brand-name" 
                        placeholder="Enter brand name" 
                        value={newBrand.name}
                        onChange={(e) => setNewBrand({...newBrand, name: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Input 
                        id="industry" 
                        placeholder="e.g., Technology, Healthcare" 
                        value={newBrand.industry}
                        onChange={(e) => setNewBrand({...newBrand, industry: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="website">Website</Label>
                      <Input 
                        id="website" 
                        placeholder="https://yourbrand.com" 
                        value={newBrand.website}
                        onChange={(e) => setNewBrand({...newBrand, website: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="logo">Logo (Optional)</Label>
                      <div className="flex items-center gap-2">
                        <Input id="logo" type="file" className="flex-1" />
                        <p className="text-xs text-muted-foreground">Maximum size: 2MB</p>
                      </div>
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
                    <Button type="submit">Add Brand</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {brands.map(brand => (
              <Card key={brand.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {brand.logo_url ? (
                        <img 
                          src={brand.logo_url} 
                          alt={`${brand.name} logo`} 
                          className="h-10 w-10 rounded-md"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{brand.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {brand.industry}
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
                        onClick={() => handleDeleteBrand(brand.id)}
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
                      href={brand.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:underline"
                    >
                      {brand.website.replace(/(^\w+:|^)\/\//, '').replace(/\/$/, '')}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1"
                  >
                    <Bot className="h-3 w-3" />
                    View AI Rankings
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex items-center gap-1"
                  >
                    <Search className="h-3 w-3" />
                    Run AI Query
                  </Button>
                </CardFooter>
              </Card>
            ))}
            
            {brands.length === 0 && (
              <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Building2 className="h-12 w-12 text-muted" />
                  <h3 className="mt-4 text-lg font-medium">No brands added yet</h3>
                  <p className="text-center text-muted-foreground">
                    Add your first brand to start analyzing its presence in AI search results
                  </p>
                  <Button 
                    onClick={() => setShowAddForm(true)}
                    className="mt-4 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Your First Brand
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 