"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { ArrowDown, ArrowUp, CloudUpload } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from 'uuid'
import Image from "next/image"
import { LoadingState } from "@/components/loading-state"

// Type definitions
interface Brand {
  id: string
  name: string
  logo?: string
  website?: string
  industry?: string
  user_id: string
  created_at: string
}

interface Competitor {
  id: string
  user_id: string
  brand_id: string
  name: string
  industry: string
  website?: string
  created_at: string
}

interface Keyword {
  id: string
  entity_id: string
  entity_name: string
  entity_type: string
  user_id: string
  keyword: string
  search_volume: number
  difficulty: number
  opportunity_score: number
  created_at: string
}

interface BrandMetric {
  id: string
  brand_id: string
  visibility_score: number
  rank: number
  date: string
}

interface IndustryRanking {
  id: number
  name: string
  logo?: string
  score: number
  change: number
}

const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Retail",
  "Food & Beverage",
  "Travel",
  "Entertainment",
  "Education",
  "Real Estate",
  "Manufacturing",
  "Automotive",
  "Energy",
  "Telecommunications"
]

export default function DashboardPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBrandModal, setShowBrandModal] = useState(false)
  const [trendData, setTrendData] = useState<any[]>([])
  const [industryRankings, setIndustryRankings] = useState<IndustryRanking[]>([])
  const [timeRange, setTimeRange] = useState("last7days")
  const [brandMetrics, setBrandMetrics] = useState<BrandMetric | null>(null)

  // Form states for brand creation
  const [brandName, setBrandName] = useState("")
  const [brandWebsite, setBrandWebsite] = useState("")
  const [brandIndustry, setBrandIndustry] = useState("")
  const [brandLogo, setBrandLogo] = useState<File | null>(null)
  const [brandLogoPreview, setBrandLogoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchBrands()
  }, [])

  useEffect(() => {
    if (selectedBrand) {
      generateDummyData()
      fetchBrandMetrics()
      fetchIndustryRankings()
    }
  }, [selectedBrand, timeRange])

  const fetchBrands = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error("No authenticated user found")
        setLoading(false)
        return
      }

      // Fetch brands where user_id matches and website and logo are not empty
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('user_id', user.id)
        .not('website', 'is', null)
        .not('logo_url', 'is', null)

      if (error) {
        console.error("Error fetching brands:", error)
        setLoading(false)
        return
      }

      setBrands(data || [])
      
      // Set the first brand as selected if available
      if (data && data.length > 0) {
        setSelectedBrand(data[0])
      } else {
        // Show brand creation modal if no valid brands exist
        setShowBrandModal(true)
      }

      setLoading(false)
    } catch (error) {
      console.error("Error:", error)
      setLoading(false)
    }
  }

  const handleCreateBrand = async () => {
    if (!brandName || !brandWebsite || !brandIndustry) {
      alert("Please fill all required fields")
      return
    }

    try {
      setSubmitting(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert("You must be logged in to create a brand")
        setSubmitting(false)
        return
      }

      let logoData = null

      // Convert file to base64 if provided
      if (brandLogo) {
        logoData = brandLogoPreview
      }

      // Create brand record
      const brandId = uuidv4()
      const { data, error } = await supabase
        .from('brands')
        .insert([
          {
            id: brandId,
            name: brandName,
            logo_url: logoData,
            website: brandWebsite,
            industry: brandIndustry,
            user_id: user.id
          }
        ])
        .select()

      if (error) {
        console.error("Error creating brand:", error)
        setSubmitting(false)
        return
      }

      console.log("Brand created:", data)

      // Clear form
      setBrandName("")
      setBrandWebsite("")
      setBrandIndustry("")
      setBrandLogo(null)
      setBrandLogoPreview(null)

      // Close modal and refresh brands
      setShowBrandModal(false)
      fetchBrands()

      // Trigger brand analysis
      await analyzeBrand(brandId)

      setSubmitting(false)
    } catch (error) {
      console.error("Error:", error)
      setSubmitting(false)
    }
  }

  const analyzeBrand = async (brandId: string) => {
    try {
      setIsAnalyzing(true)
      // Call the analysis API
      const response = await fetch('/api/analyze-brand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          brandId 
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Brand analysis failed:', errorData)
        setIsAnalyzing(false)
        return
      }

      const data = await response.json()
      console.log('Brand analysis completed:', data)
      setIsAnalyzing(false)
    } catch (error) {
      console.error('Error analyzing brand:', error)
      setIsAnalyzing(false)
    }
  }

  const fetchBrandMetrics = async () => {
    if (!selectedBrand) return

    try {
      // In a real implementation, fetch from the database
      // For now, generate random data
      const score = Math.floor(Math.random() * 30) + 70 // 70-100
      const rank = Math.floor(Math.random() * 5) + 1 // 1-5

      setBrandMetrics({
        id: uuidv4(),
        brand_id: selectedBrand.id,
        visibility_score: score,
        rank: rank,
        date: new Date().toISOString()
      })
    } catch (error) {
      console.error("Error fetching brand metrics:", error)
    }
  }

  const fetchIndustryRankings = async () => {
    if (!selectedBrand) return

    // In a real implementation, fetch from the database
    // For now, generate sample data
    const sampleRankings = [
      { id: 1, name: 'Chase', logo: '', score: 92, change: 5 },
      { id: 2, name: 'Rho', logo: '', score: 89.8, change: 1 },
      { id: 3, name: 'American Express', logo: '', score: 85.2, change: -1 },
      { id: 4, name: 'Capital on Tap', logo: '', score: 78, change: 5 },
      { id: 5, name: 'US bank', logo: '', score: 76.9, change: -2 },
      { id: 6, name: 'Bill', logo: '', score: 72.3, change: 1.8 },
    ]

    setIndustryRankings(sampleRankings)
  }

  const generateDummyData = () => {
    const data = []
    
    // Generate sample data for the chart
    const now = new Date()
    let days
    
    switch (timeRange) {
      case 'last24hours':
        days = 1
        break
      case 'last7days':
        days = 7
        break
      case 'last30days':
        days = 30
        break
      default:
        days = 7
    }
    
    for (let i = 0; i < days; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      
      // Format date based on range
      let formattedDate
      if (days <= 1) {
        formattedDate = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      } else {
        formattedDate = date.toLocaleDateString([], { month: 'short', day: 'numeric' })
      }
      
      const value = 75 + Math.random() * 25
      
      data.unshift({
        date: formattedDate,
        value: Number(value.toFixed(1))
      })
    }
    
    setTrendData(data)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setBrandLogo(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setBrandLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      setBrandLogo(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setBrandLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-3xl">
          <h1 className="text-2xl font-bold mb-6 text-center">Analyzing Your Brand</h1>
          <p className="text-muted-foreground mb-8 text-center">
            We're gathering data and insights about {selectedBrand?.name || "your brand"}. This may take a few moments.
          </p>
          <LoadingState />
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-background text-foreground">
      {/* Breadcrumb and title */}
      <div className="flex flex-col space-y-2">
        <div className="text-sm text-muted-foreground">
          {selectedBrand?.name} &gt; Home
            </div>
        <h1 className="text-3xl font-bold">Home</h1>
          </div>
          
      {/* Time range selector */}
      <div className="flex gap-2">
        <Button 
          variant={timeRange === 'last24hours' ? "default" : "outline"} 
          onClick={() => setTimeRange('last24hours')}
        >
          Last 24 hours
        </Button>
        <Button 
          variant={timeRange === 'last7days' ? "default" : "outline"} 
          onClick={() => setTimeRange('last7days')}
        >
          Last 7 days
        </Button>
        <Button 
          variant={timeRange === 'last30days' ? "default" : "outline"} 
          onClick={() => setTimeRange('last30days')}
        >
          Last 30 days
        </Button>
        <Button 
          variant="outline"
        >
          Custom range ▼
        </Button>
        <div className="flex-1" />
        <Button variant="outline">
          All models
        </Button>
        <Button variant="outline">
          Region
        </Button>
        <Button variant="outline">
          Filter
        </Button>
          </div>
          
      {/* Brand visibility section */}
                <div className="space-y-4">
                          <div>
          <h2 className="text-2xl font-semibold">Brand visibility</h2>
                      <p className="text-muted-foreground">
            Percentage of AI answers about {selectedBrand?.industry} that mention {selectedBrand?.name}
          </p>
                </div>
            
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Visibility score card */}
            <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="text-2xl font-semibold">Visibility score</div>
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-bold">{brandMetrics?.visibility_score.toFixed(1)}%</div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/10 text-green-500">
                    <ArrowUp className="h-4 w-4" />
                    <span>1%</span>
                    <span className="text-sm text-muted-foreground ml-1">vs last week</span>
                  </div>
                </div>
                          </div>

              <div className="h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#333" />
                    <XAxis dataKey="date" stroke="#888" />
                    <YAxis domain={[0, 100]} stroke="#888" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#333', 
                        border: 'none', 
                        borderRadius: '0.375rem',
                        color: '#fff'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#10B981" 
                      strokeWidth={2} 
                      dot={false}
                      activeDot={{ r: 6, fill: "#10B981" }}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                    />
                  </LineChart>
                </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          
          {/* Industry rankings */}
          <Card>
            <CardHeader>
              <CardTitle>Brand Industry Ranking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {industryRankings.map((competitor) => (
                  <div key={competitor.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="text-xl font-semibold text-muted-foreground">
                        {competitor.id}
                      </div>
                      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                        {competitor.logo ? (
                          <Image 
                            src={competitor.logo} 
                            alt={competitor.name} 
                            className="w-6 h-6 object-contain"
                          />
                        ) : (
                          <span className="text-xs">{competitor.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="font-medium">{competitor.name}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1 text-sm ${
                        competitor.change > 0 
                          ? 'text-green-500' 
                          : competitor.change < 0 
                            ? 'text-red-500' 
                            : 'text-muted-foreground'
                      }`}>
                        {competitor.change > 0 ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : competitor.change < 0 ? (
                          <ArrowDown className="h-4 w-4" />
                        ) : null}
                        <span>{Math.abs(competitor.change)}%</span>
                      </div>
                      <div className="font-semibold w-16 text-right">
                        {competitor.score.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Topic visibility section */}
      <div>
        <h2 className="text-2xl font-semibold mt-10">Topic visibility</h2>
      </div>

      {/* Brand creation dialog */}
      <Dialog open={showBrandModal} onOpenChange={setShowBrandModal}>
        <DialogContent className="sm:max-w-[500px] bg-gradient-to-b from-background to-zinc-900 overflow-hidden border-accent">
            <DialogHeader>
              <DialogTitle className="text-2xl text-white">Create Brand</DialogTitle>
              <DialogDescription className="text-white/50">
                Add your brand details to start tracking analytics
              </DialogDescription>
            </DialogHeader>
          
          <div className="p-6">
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Name
                </Label>
                <Input
                  id="name"
                  value={brandName}
                  placeholder="Acme Corporation"
                  onChange={(e) => setBrandName(e.target.value)}
                  className="bg-zinc-800"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="website">
                  Website
                </Label>
                <Input
                  id="website"
                  value={brandWebsite}
                  onChange={(e) => setBrandWebsite(e.target.value)}
                  className="bg-zinc-800"
                  placeholder="https://example.com"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="industry">
                  Industry
                </Label>
                <Select
                  value={brandIndustry}
                  onValueChange={setBrandIndustry}
                >
                  <SelectTrigger className="bg-zinc-800 w-full">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                </div>
              
              <div className="grid gap-2">
                <Label htmlFor="logo">
                  Logo
                </Label>
                <div className="flex items-center gap-4">
                  <input
                    ref={fileInputRef}
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  {!brandLogoPreview ? (
                    <div 
                      onClick={openFileDialog}
                      onDragEnter={handleDragEnter}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleFileDrop}
                      className={`
                        h-32 w-full rounded-md border-2 border-dashed 
                        flex flex-col items-center justify-center p-4 
                        cursor-pointer transition-all duration-200
                        ${isDragging 
                          ? 'border-blue-500 bg-blue-500/10' 
                          : 'border-zinc-700 bg-zinc-800 hover:border-zinc-500'
                        }
                      `}
                    >
                      <div className="flex flex-col items-center text-center">
                        <CloudUpload className="w-5 h-5 text-zinc-400 mb-2" />
                        <div className="font-medium text-sm mb-1">Click to upload</div>
                        <div className="text-xs text-zinc-400">or drag and drop your logo here</div>
                        <div className="text-[10px] text-zinc-500 mt-3">PNG, JPG or SVG (max 5MB)</div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col items-center">
                      <div className="w-28 h-28 p-3 rounded-md overflow-hidden bg-zinc-700 flex items-center justify-center mb-3">
                        <Image 
                          src={brandLogoPreview} 
                          alt="Preview" 
                          width={50}
                          height={50}
                          className="w-full h-full object-contain"
                        />
                </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={openFileDialog} 
                        className="mt-2"
                      >
                        <CloudUpload className="w-4 h-4 mr-2" />
                        Change Logo
                </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="px-6 py-4">
            <Button 
              onClick={handleCreateBrand} 
              disabled={submitting}
              className="w-full"
            >
              {submitting ? "Creating..." : "Create Brand"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
  )
}
