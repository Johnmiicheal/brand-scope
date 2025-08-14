"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Monitor, Eye, TrendingUp, Target, Calendar, MapPin, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { countries } from "@/lib/countries";
import { AnalysisMode } from "@/types/search";
import { Brand } from "@/contexts/brand-data-context";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

type KeywordData = {
  conversational_keyword: string;
  intent: string;
  google_seed_keyword: string;
  category: string;
  search_volume: number;
  competition_index: number;
  low_cpc: string;
  trend_6m: string;
  relevance_score: number;
};

type KeywordAnalysisResultsProps = {
  keywords: Record<string, KeywordData>;
  metadata: Array<{ language: string; country: string }>;
  limit?: number;
};

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

export function KeywordAnalysisResults({ keywords, metadata, limit=50 }: KeywordAnalysisResultsProps) {
  const { user } = useAuth();
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordData | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState("weekly");
  const [scheduleCountry, setScheduleCountry] = useState("global");
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<AnalysisMode>("Explorer");
  const [scheduleBrand, setScheduleBrand] = useState<Brand | null>(null);
  const [availableBrands, setAvailableBrands] = useState<Brand[]>([]);

  const keywordEntries = Object.entries(keywords);

  // Fetch available brands for selection
  useEffect(() => {
    const fetchBrands = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from("brand_project")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        
        if (error) {
          console.error("Error fetching brands:", error);
          return;
        }
        
        setAvailableBrands((data as unknown as Brand[]) || []);
        // Set default to first brand if available
        if (data && data.length > 0) {
          setScheduleBrand(data[0] as unknown as Brand);
        }
      } catch (error) {
        console.error("Error fetching brands:", error);
      }
    };
    
    fetchBrands();
  }, [user?.id]);

  const getIntentColor = (intent: string) => {
    switch (intent.toLowerCase()) {
      case 'transactional':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'commercial':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'informational':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'navigational':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'generic':
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      case 'specific':
        return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      case 'brand':
        return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend.startsWith('+')) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (trend.startsWith('-')) {
      return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
    }
    return <div className="w-4 h-4" />;
  };

  const handleScheduleKeyword = async () => {
    if (!selectedKeyword || !user?.id) return;

    setIsScheduling(true);
    toast({
      title: "Monitoring Started",
      description: `Monitoring "${selectedKeyword.conversational_keyword}" has started. You can now close this modal and continue with your work.`,
    });

    try {
      const response = await fetch("/api/schedule-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: selectedKeyword.conversational_keyword,
          frequency: scheduleFrequency,
          location: scheduleCountry,
          user_id: user.id,
          attached_brand_id: scheduleBrand ? [scheduleBrand.id] : [""],
          attached_brand_name: scheduleBrand ? scheduleBrand.name : "",
          attached_brand_industry: scheduleBrand ? scheduleBrand.industry : "",
          attached_brand_logo_url: scheduleBrand ? scheduleBrand.logo_url || "" : "",
          attached_brand_website: scheduleBrand ? scheduleBrand.website : "",
          attached_brand_language: scheduleBrand ? scheduleBrand.language : "",
          attached_brand_location: scheduleBrand ? scheduleBrand.location : "",
          mode: scheduleMode,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to schedule keyword");
      }

      toast({
        title: "Keyword Monitoring Completed",
        description: `"${selectedKeyword.conversational_keyword}" has been scheduled for ${scheduleFrequency} monitoring.`,
      });

      setIsScheduleModalOpen(false);
      setSelectedKeyword(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule keyword monitoring. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsScheduling(false);
    }
  };

  const openScheduleModal = (keyword: KeywordData) => {
    setSelectedKeyword(keyword);
    // Reset to defaults when opening modal
    setScheduleMode("Explorer");
    setScheduleBrand(availableBrands.length > 0 ? availableBrands[0] : null);
    setIsScheduleModalOpen(true);
  };

  const exportToCSV = () => {
    const headers = [
      'Conversational Keyword',
      'Google Seed Keyword',
      'Intent',
      'Category',
      'Search Volume',
      'Competition Index',
      'Low CPC',
      'Trend (6M)',
      'Relevance Score'
    ];

    const csvData = keywordEntries.slice(0, limit).map(([, keyword]) => [
      keyword.conversational_keyword,
      keyword.google_seed_keyword,
      keyword.intent,
      keyword.category,
      keyword.search_volume,
      keyword.competition_index,
      keyword.low_cpc,
      keyword.trend_6m,
      keyword.relevance_score
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        row.map(cell => {
          // Escape cells that contain commas, quotes, or newlines
          const cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `keyword-analysis-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: `Exported ${keywordEntries.length} keywords to CSV`,
    });
  };

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      {/* Metadata Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Analysis Overview
          </CardTitle>
          <CardDescription>
            Found {keywordEntries.length} keyword opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-sm text-muted-foreground">
            {metadata && metadata.map((meta, index) => (
              <div key={index} className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {meta.language.toUpperCase()} • {meta.country}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Keywords Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="text-start">
              <CardTitle>Keyword Opportunities</CardTitle>
              <CardDescription>
                Click on any keyword row to schedule it for monitoring
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <motion.div variants={staggerContainer}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword</TableHead>
                  <TableHead>Intent</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Search Volume</TableHead>
                  <TableHead>Competition</TableHead>
                  <TableHead>CPC</TableHead>
                  <TableHead>Trend (6M)</TableHead>
                  <TableHead>Relevance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {keywordEntries.slice(0, limit).map(([id, keyword]) => (
                  <motion.tr
                    key={id}
                    variants={fadeIn}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => openScheduleModal(keyword)}
                  >
                    <TableCell className="font-medium">
                      <div className="text-start">
                        <div className="font-semibold text-sm">
                          {keyword.conversational_keyword}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Seed: {keyword.google_seed_keyword}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getIntentColor(keyword.intent)}>
                        {keyword.intent}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getCategoryColor(keyword.category)}>
                        {keyword.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        {keyword.search_volume.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        {keyword.competition_index.toFixed(1)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{keyword.low_cpc}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(keyword.trend_6m)}
                        <span className={`text-sm ${
                          keyword.trend_6m.startsWith('+') ? 'text-green-600' : 
                          keyword.trend_6m.startsWith('-') ? 'text-red-600' : 
                          'text-muted-foreground'
                        }`}>
                          {keyword.trend_6m}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          keyword.relevance_score >= 8 ? 'bg-green-500' :
                          keyword.relevance_score >= 6 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}></div>
                        {keyword.relevance_score}/10
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          openScheduleModal(keyword);
                        }}
                        className="flex items-center gap-1"
                      >
                        <Monitor className="w-4 h-4" />
                        Monitor
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        </CardContent>
      </Card>

      {/* Schedule Modal */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Keyword Monitoring</DialogTitle>
            <DialogDescription>
              Configure monitoring settings for &quot;{selectedKeyword?.conversational_keyword}&quot;
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedKeyword && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">Keyword Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Search Volume: {selectedKeyword.search_volume.toLocaleString()}</div>
                  <div>Competition: {selectedKeyword.competition_index.toFixed(1)}</div>
                  <div>Intent: {selectedKeyword.intent}</div>
                  <div>Relevance: {selectedKeyword.relevance_score}/10</div>
                </div>
              </div>
            )}
            <div className="space-y-4">
              {/* Analysis Mode Selection */}
              <div className="space-y-2 w-full">
                <label className="text-sm font-medium">Analysis Mode</label>
                <Select
                  value={scheduleMode}
                  onValueChange={(value: AnalysisMode) => setScheduleMode(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Explorer">Explorer - Comprehensive Analysis</SelectItem>
                    <SelectItem value="Voyager">Voyager - Focused Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Brand Selection */}
              <div className="space-y-2 w-full">
                <label className="text-sm font-medium">Brand</label>
                <Select
                  value={scheduleBrand?.id || ""}
                  onValueChange={(value: string) => {
                    const selected = availableBrands.find(b => b.id === value);
                    setScheduleBrand(selected || null);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBrands.length === 0 ? (
                      <SelectItem value="" disabled>
                        No brands available
                      </SelectItem>
                    ) : (
                      availableBrands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-5 w-full items-center justify-between">
                <div className="space-y-2 w-full">
                  <label className="text-sm font-medium">Monitoring Frequency</label>
                  <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 w-full">
                  <label className="text-sm font-medium">Location</label>
                  <Select value={scheduleCountry} onValueChange={setScheduleCountry}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global" disabled>Select Location</SelectItem>
                      {countries.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>


            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleScheduleKeyword}
                disabled={isScheduling}
                className="flex-1"
              >
                <Calendar className="w-4 h-4" />
                {isScheduling ? "Scheduling..." : "Schedule Monitoring"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsScheduleModalOpen(false)}
                disabled={isScheduling}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
} 