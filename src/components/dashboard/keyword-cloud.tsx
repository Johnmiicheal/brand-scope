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

interface KeywordCloudProps {
  keywords: Array<Keyword>
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

  // Function to get color based on search volume
  const getColorByVolume = (volume: number) => {
    const range = volumeRanges.find((range) => volume >= range.min && volume <= range.max)
    return range ? range.color : "hsl(var(--muted-foreground))"
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
    const words = sortedKeywords.map((k) => ({
      text: k.keyword,
      size: 12 + Math.log(k.search_volume) * 3, // Logarithmic scaling for better size distribution
      volume: k.search_volume,
      relevance: k.opportunity_score,
      color: getColorByVolume(k.search_volume),
    }))

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
              <div>Search Volume: ${d.volume}</div>
              <div>Relevance: ${d.relevance}/10</div>
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
      <Card className="bg-transparent">
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
            {volumeRanges.map((range, index) => (
              <div key={index} className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: range.color }}></span>
                <span>{range.label} searches</span>
              </div>
            ))}
          </div>
          <div className="h-[400px] w-full flex items-center justify-center">
            <svg ref={svgRef} width="100%" height="100%" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

