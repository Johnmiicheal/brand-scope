"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Monitor, Eye, TrendingUp, Target, Calendar, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { countries } from "@/lib/countries";

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
  onScheduleKeyword?: (keyword: string, frequency: string, country: string) => void;
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

export function KeywordAnalysisResults({ keywords, metadata, onScheduleKeyword }: KeywordAnalysisResultsProps) {
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordData | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState("weekly");
  const [scheduleCountry, setScheduleCountry] = useState("global");
  const [isScheduling, setIsScheduling] = useState(false);

  const keywordEntries = Object.entries(keywords);

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
    if (!selectedKeyword || !onScheduleKeyword) return;

    setIsScheduling(true);
    try {
      await onScheduleKeyword(
        selectedKeyword.conversational_keyword,
        scheduleFrequency,
        scheduleCountry
      );
      
      toast({
        title: "Keyword Scheduled",
        description: `"${selectedKeyword.conversational_keyword}" has been scheduled for ${scheduleFrequency} monitoring.`,
      });
      
      setIsScheduleModalOpen(false);
      setSelectedKeyword(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule keyword monitoring. Please try again.",
        variant: "destructive"
      });
      console.error(error);
    } finally {
      setIsScheduling(false);
    }
  };

  const openScheduleModal = (keyword: KeywordData) => {
    setSelectedKeyword(keyword);
    setIsScheduleModalOpen(true);
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
          <CardTitle>Keyword Opportunities</CardTitle>
          <CardDescription>
            Click on any keyword row to schedule it for monitoring
          </CardDescription>
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
                {keywordEntries.map(([id, keyword]) => (
                  <motion.tr
                    key={id}
                    variants={fadeIn}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => openScheduleModal(keyword)}
                  >
                    <TableCell className="font-medium">
                      <div>
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