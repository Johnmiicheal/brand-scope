"use client";

import { motion } from "framer-motion";
import { Bot, Sparkles, TrendingUp, ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export function KeywordAnalysisCard() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <Card className="relative overflow-hidden border-2 border-blue-500/20 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5" />
        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            <Sparkles className="w-3 h-3 mr-1" />
            New Feature
          </Badge>
        </div>
        
        <CardHeader className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Keyword Analysis</CardTitle>
              <CardDescription>
                AI-powered keyword discovery for your brand
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="relative space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>Discover <strong>50 keyword opportunities</strong></span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span><strong>1 free analysis</strong> per day</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Schedule keywords for <strong>monitoring</strong></span>
            </div>
          </div>
          
          <div className="pt-2">
            <Link href="/dashboard/keywords">
              <Button className="w-full group">
                Start Keyword Analysis
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 