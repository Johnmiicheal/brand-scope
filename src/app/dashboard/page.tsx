/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Brand,
  BrandDataProvider,
  useBrandData,
} from "@/contexts/brand-data-context";
import { LoadingState } from "@/components/loading-state";
import ShinyText from "@/components/ui/shiny-text";
import { motion, AnimatePresence } from "framer-motion";
import { MetricsHeader } from "@/components/dashboard/metrics-card";
import { KeywordCloud } from "@/components/dashboard/keyword-cloud";
import { CompetitorNetwork } from "@/components/dashboard/competitor-network";
import { BrandInsights } from "@/components/dashboard/insights-card";
import Image from "next/image";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { CloudUpload, RefreshCcw, SquareArrowOutUpRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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
  "Telecommunications",
];

function DashboardContent() {
  const router = useRouter();
  const { brand, metrics, competitors, keywords, isLoading, error, refetch } =
    useBrandData();
  const [sessionKey, setSessionKey] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      }
      setSessionKey(session?.access_token)
    };
    checkAuth();
  }, [router]);

  // Form states for brand creation
  const [brandName, setBrandName] = useState("");
  const [brandWebsite, setBrandWebsite] = useState("");
  const [brandIndustry, setBrandIndustry] = useState("");
  const [brandLogo, setBrandLogo] = useState<File | null>(null);
  const [brandLogoPreview, setBrandLogoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("No authenticated user found");
        setLoading(false);
        return;
      }

      // Fetch brands where user_id matches and website and logo are not empty
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .eq("user_id", user.id)
        .not("website", "is", null)
        .not("logo_url", "is", null);

      if (error) {
        console.error("Error fetching brands:", error);
        setLoading(false);
        return;
      }

      setBrands(data || []);

      // Set the first brand as selected if available
      if (data && data.length > 0) {
        setSelectedBrand(data[0]);
      } else {
        // Show brand creation modal if no valid brands exist
        setShowBrandModal(true);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  const handleCreateBrand = async () => {
    if (!brandName || !brandWebsite || !brandIndustry) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in to create a brand");
        setSubmitting(false);
        return;
      }

      let logoData = null;

      // Convert file to base64 if provided
      if (brandLogo) {
        logoData = brandLogoPreview;
      }

      // Create brand record
      const brandId = uuidv4();
      const { data, error } = await supabase
        .from("brands")
        .insert([
          {
            id: brandId,
            name: brandName,
            logo_url: logoData,
            website: brandWebsite,
            industry: brandIndustry,
            user_id: user.id,
          },
        ])
        .select();

      if (error) {
        console.error("Error creating brand:", error);
        setSubmitting(false);
        return;
      }

      console.log("Brand created:", data);

      // Clear form
      setBrandName("");
      setBrandWebsite("");
      setBrandIndustry("");
      setBrandLogo(null);
      setBrandLogoPreview(null);

      // Close modal and refresh brands
      setShowBrandModal(false);
      fetchBrands();

      // Trigger brand analysis
      await analyzeBrand(brandId);

      setSubmitting(false);
    } catch (error) {
      console.error("Error:", error);
      setSubmitting(false);
    }
  };

  const analyzeBrand = async (brandId: string) => {
    try {
      setIsAnalyzing(true);
      // Call the analysis API
      const response = await fetch(process.env.NEXT_PUBLIC_ANALYZE_BRAND as string, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionKey}`,

        },
        body: JSON.stringify({
          brandId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Brand analysis failed:", errorData);
        setIsAnalyzing(false);
        return;
      }

      const data = await response.json();
      console.log("Brand analysis completed:", data);
      setIsAnalyzing(false);
    } catch (error) {
      console.error("Error analyzing brand:", error);
      setIsAnalyzing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!brand) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_ANALYZE_BRAND as string, {
        method: "POST",
            Authorization: `Bearer ${sessionKey}`,
            headers: { "Content-Type": "application/json",  },
        body: JSON.stringify({ brandId: brand.id }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      // Refetch brand data to get updated metrics
      await refetch();
    } catch (error) {
      console.error("Error analyzing brand:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBrandLogo(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setBrandLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setBrandLogo(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setBrandLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };


  if (!brand) {
    return (
      isAnalyzing ? (
        <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-full max-w-3xl">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Creating Brand Analysis
          </h1>
          <p className="text-muted-foreground mb-8 text-center">
            Analyzing...
          </p>
          <LoadingState />
        </div>
      </div>
      ): isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-3xl">
          <div className="flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <ShinyText
              text="Fetching your latest brand data..."
              disabled={false}
              speed={3}
              className="font-medium text-sm"
            />
          </div>
        </div>
      </div>
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center gap-2">
            <h2 className="text-2xl font-bold text-red-500/60 mb-4">
              Empty Brand :/
            </h2>
            <p className="text-white/50 mb-8">
              Create your Brand to unlock your dashboard, or try out the search
              feature
            </p>
            <Button onClick={() => setShowBrandModal(true)}>Create Brand</Button>
          </div>
          <Dialog open={showBrandModal} onOpenChange={setShowBrandModal}>
            <DialogContent className="sm:max-w-[500px] bg-gradient-to-b from-background to-zinc-900 overflow-hidden border-accent">
              <DialogHeader>
                <DialogTitle className="text-2xl text-white">
                  Create Brand
                </DialogTitle>
                <DialogDescription className="text-white/50">
                  Add your brand details to start tracking analytics
                </DialogDescription>
              </DialogHeader>
  
              <div className="p-6">
                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
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
                    <Label htmlFor="website">Website</Label>
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
                    <Label htmlFor="industry">Industry</Label>
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
                    <Label htmlFor="logo">Logo</Label>
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
                          ${
                            isDragging
                              ? "border-blue-500 bg-blue-500/10"
                              : "border-zinc-700 bg-zinc-800 hover:border-zinc-500"
                          }
                        `}
                        >
                          <div className="flex flex-col items-center text-center">
                            <CloudUpload className="w-5 h-5 text-zinc-400 mb-2" />
                            <div className="font-medium text-sm mb-1">
                              Click to upload
                            </div>
                            <div className="text-xs text-zinc-400">
                              or drag and drop your logo here
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-3">
                              PNG, JPG or SVG (max 5MB)
                            </div>
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
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-3xl">
          <div className="flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <ShinyText
              text="Fetching your latest brand data..."
              disabled={false}
              speed={3}
              className="font-medium text-sm"
            />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }



  return (
    <div className="container mx-auto px-4 py-4">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-end gap-2">
          <div className="flex items-center gap-2">
            <Image
              src={brand.logo_url}
              alt={brand.name}
              width={24}
              height={24}
              className="rounded-md"
            />
            <h2 className="text-2xl">{brand.name}</h2>
          </div>
          <Link
            href={brand?.website}
            target="_blank"
            className="text-sm text-white/40 hover:text-white/80 flex items-center gap-1"
          >
            {brand.website} <SquareArrowOutUpRight className="w-3 h-3 mt-1" />
          </Link>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="cursor-pointer border rounded-full text-white/50 p-2 hover:border-gray-600 hover:text-white disabled:opacity-50 transition ease"
        >
          <RefreshCcw
            className={`w-4 h-4 ${isAnalyzing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {isAnalyzing ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-full max-w-3xl">
            <h1 className="text-2xl font-bold mb-6 text-center">
              Analyzing Your Brand
            </h1>
            <p className="text-muted-foreground mb-8 text-center">
              Analyzing {brand.name}...
            </p>
            <LoadingState />
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="min-h-screen flex-1 bg-background">
              <div className="space-y-6">
                {/* Key metrics */}
                <MetricsHeader metrics={metrics} competitors={competitors} />

                {/* Main content grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left column - Make keyword cloud take full width */}
                  <div className="space-y-6 lg:col-span-2">
                    <KeywordCloud keywords={keywords} />
                  </div>

                  {/* Two columns for other components */}
                  <div className="space-y-6">
                    <CompetitorNetwork competitors={competitors} />
                  </div>

                  <div className="space-y-6">
                    {/* <KeywordMetrics keywords={brandData.data.keywords} /> */}
                    <BrandInsights insights={metrics} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <BrandDataProvider>
      <DashboardContent />
      {/* Brand creation dialog */}
    </BrandDataProvider>
  );
}
