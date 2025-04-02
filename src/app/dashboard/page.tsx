/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BrandDataProvider, useBrandData } from "@/contexts/brand-data-context";
import { LoadingState } from "@/components/loading-state";
import ShinyText from "@/components/ui/shiny-text";
import { motion, AnimatePresence } from "framer-motion";
import { MetricsHeader } from "@/components/dashboard/metrics-card";
import { KeywordCloud } from "@/components/dashboard/keyword-cloud";
import { CompetitorNetwork } from "@/components/dashboard/competitor-network";
import { BrandInsights } from "@/components/dashboard/insights-card";
import Image from "next/image";
import Link from "next/link";
import { RefreshCcw, SquareArrowOutUpRight } from "lucide-react";

function DashboardContent() {
  const router = useRouter();
  const { brand, metrics, competitors, keywords, isLoading, error, refetch } =
    useBrandData();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  const handleAnalyze = async () => {
    if (!brand) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze-brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  if (!brand) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Brand Found</h2>
          <p className="text-gray-600">Please create a brand first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-end gap-2">
        <div className="flex items-center gap-2">
          <Image src={brand.logo_url} alt={brand.name} width={24} height={24} className="rounded-md" />
        <h2 className="text-2xl">{brand.name}</h2>
        </div>
          <Link href={brand?.website} target="_blank" className="text-sm text-white/40 hover:text-white/80 flex items-center gap-1">{brand.website} <SquareArrowOutUpRight className="w-3 h-3 mt-1" /></Link>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="cursor-pointer border rounded-full text-white/50 p-2 hover:border-gray-600 hover:text-white disabled:opacity-50 transition ease"
        >
          <RefreshCcw className={`w-4 h-4 ${isAnalyzing ? "animate-spin" : ""}`} />
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
    </BrandDataProvider>
  );
}
