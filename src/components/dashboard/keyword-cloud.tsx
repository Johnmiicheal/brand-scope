/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import * as d3 from "d3"
import cloud from "d3-cloud"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Keyword } from "@/contexts/brand-data-context"

interface EnhancedKeyword {
  keyword: string;
  search_volume: number;
  opportunity_score: number;
  competition_index?: number;
  competition?: string;
  low_cpc_usd?: string;
  relevance_score?: number;
}

interface KeywordCloudProps {
  keywords: Array<Keyword | EnhancedKeyword>
}

export function KeywordCloud({ keywords }: KeywordCloudProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  // Define search volume ranges and their colors
  const volumeRanges = [
    { min: 0, max: 40, color: "hsl(142, 76%, 36%)", label: "0-40" },
    { min: 41, max: 100, color: "hsl(215, 70%, 60%)", label: "41-100" },
    { min: 101, max: 500, color: "hsl(260, 70%, 60%)", label: "101-500" },
    { min: 501, max: 1000, color: "hsl(336, 100%, 50%)", label: "501-1000" },
    { min: 1001, max: Number.POSITIVE_INFINITY, color: "hsl(48, 100%, 50%)", label: "1000+" },
  ]

  // Competition-based color variants
  const competitionColors = {
    HIGH: "hsl(0, 70%, 50%)",    // Red for high competition
    MEDIUM: "hsl(39, 70%, 50%)", // Orange for medium competition  
    LOW: "hsl(120, 70%, 40%)",   // Green for low competition
  }

  // Function to get color based on search volume and competition
  const getKeywordColor = (keyword: Keyword | EnhancedKeyword) => {
    // Enhanced keywords have competition data
    const enhancedKeyword = keyword as EnhancedKeyword;
    
    if (enhancedKeyword.competition && competitionColors[enhancedKeyword.competition as keyof typeof competitionColors]) {
      return competitionColors[enhancedKeyword.competition as keyof typeof competitionColors];
    }
    
    // Fall back to volume-based coloring
    const volume = keyword.search_volume;
    const range = volumeRanges.find((range) => volume >= range.min && volume <= range.max);
    return range ? range.color : "hsl(var(--muted-foreground))";
  }

  useEffect(() => {
    if (!svgRef.current || !keywords || keywords.length === 0) return

    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove()

    // Sort keywords by search volume
    const sortedKeywords = [...keywords].sort((a, b) => b.search_volume - a.search_volume)

    // Prepare data for word cloud
    const words = sortedKeywords.map((k) => {
      const enhancedKeyword = k as EnhancedKeyword;
      return {
        text: k.keyword,
        size: 12 + Math.log(k.search_volume) * 3, // Logarithmic scaling for better size distribution
        volume: k.search_volume,
        relevance: enhancedKeyword.relevance_score || k.opportunity_score,
        competition: enhancedKeyword.competition,
        competition_index: enhancedKeyword.competition_index,
        low_cpc_usd: enhancedKeyword.low_cpc_usd,
        color: getKeywordColor(k),
      };
    })

    // Create layout
    const layout = cloud()
      .size([width, height])
      .words(words)
      .padding(5)
      .rotate(() => 0)
      .font("Inter")
      .fontSize((d) => d.size)
      .on("end", draw)

    layout.start()

    function draw(words: any[]) {
      const svg = d3.select(svgRef.current)

      const tooltip = d3
        .select("body")
        .append("div")
        .attr(
          "class",
          "bg-popover text-popover-foreground p-2 rounded text-xs absolute pointer-events-none opacity-0 z-50 shadow-md border",
        )
        .style("transition", "opacity 0.2s ease")

      svg
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`)
        .selectAll("text")
        .data(words)
        .join("text")
        .style("font-size", (d) => `${d.size}px`)
        .style("font-family", "Inter")
        .style("fill", (d) => d.color)
        .style("cursor", "pointer")
        .attr("text-anchor", "middle")
        .attr("transform", (d) => `translate(${d.x},${d.y})`)
        .text((d) => d.text)
        .on("mouseover", function (event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .style("font-size", `${d.size * 1.2}px`)
            .style("font-weight", "bold")

          tooltip.transition().duration(200).style("opacity", 1)

          tooltip
            .html(`
            <div>
              <div class="font-medium">${d.text}</div>
              <div>Search Volume: ${d.volume.toLocaleString()}</div>
              <div>Relevance: ${d.relevance.toFixed(1)}/10</div>
              ${d.competition ? `<div>Competition: ${d.competition}</div>` : ''}
              ${d.competition_index ? `<div>Competition Index: ${d.competition_index}</div>` : ''}
              ${d.low_cpc_usd ? `<div>CPC (USD): ${d.low_cpc_usd}+</div>` : ''}
            </div>
          `)
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px")
        })
        .on("mouseout", function (event, d) {
          d3.select(this).transition().duration(200).style("font-size", `${d.size}px`).style("font-weight", "normal")

          tooltip.transition().duration(200).style("opacity", 0)
        })

      return () => {
        tooltip.remove()
      }
    }
  }, [keywords])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
      <Card className="bg-background border-[#e2e2e2]/70 dark:border-accent shadow-none h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Keyword Cloud</CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline">{keywords.length} Keywords</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-2 text-xs">
            <div className="flex flex-wrap gap-2">
              <span className="text-muted-foreground font-medium">Volume:</span>
              {volumeRanges.map((range, index) => (
                <div key={index} className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: range.color }}></span>
                  <span>{range.label}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-muted-foreground font-medium">Competition:</span>
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: competitionColors.LOW }}></span>
                <span>Low</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: competitionColors.MEDIUM }}></span>
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: competitionColors.HIGH }}></span>
                <span>High</span>
              </div>
            </div>
          </div>
          <div className="h-[400px] w-full flex items-center justify-center">
            <svg ref={svgRef} width="100%" height="100%" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

