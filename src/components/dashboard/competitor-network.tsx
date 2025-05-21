/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import * as d3 from "d3"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface Brand{
  name: string, 
  rank: number,
  score: number,
  reasoning: string,
}

interface CompetitorNetworkProps {
  brands: Brand[]
  detailed?: boolean
}

export function CompetitorNetwork({ brands, detailed = true }: CompetitorNetworkProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight
    const centerX = width / 2
    const centerY = height / 2

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove()

    const svg = d3.select(svgRef.current)

    // Create tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr(
        "class",
        "bg-popover text-popover-foreground p-2 rounded text-xs absolute pointer-events-none opacity-0 z-50 shadow-md border",
      )
      .style("transition", "opacity 0.2s ease")

    // Create nodes data
    const nodes = [
      { id: "Center", group: 0, radius: 40 },
      ...brands.map((comp, i) => ({
        id: comp.name,
        group: 1,
        radius: 30 + Math.abs(comp.rank) * 3,
        data: comp,
      })),
    ]

    // Create links data
    const links = brands.map((comp) => ({
      source: "Center",
      target: comp.name,
      value: Math.abs(comp.rank) + 1,
    }))

    // Create simulation
    const simulation = d3
      .forceSimulation(nodes as any)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(detailed ? 150 : 120),
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(centerX, centerY))
      .force(
        "collision",
        d3.forceCollide().radius((d: any) => d.radius + 10),
      )

    // Create gradient definitions
    const defs = svg.append("defs")

    // Add gradient for center node
    const mainGradient = defs
      .append("radialGradient")
      .attr("id", "mainGradient")
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%")
      .attr("fx", "50%")
      .attr("fy", "50%")

    mainGradient.append("stop").attr("offset", "0%").attr("stop-color", "hsl(var(--brand-primary))")

    mainGradient.append("stop").attr("offset", "100%").attr("stop-color", "hsl(var(--brand-secondary))")

    // Create links
    const link = svg
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("class", "competitor-link")
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", (d) => Math.sqrt(d.value))

    // Create node groups
    const node = svg
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "competitor-node")
      .call(d3.drag<SVGGElement, any>().on("start", dragstarted).on("drag", dragged).on("end", dragended) as any)
      .on("mouseover", function (event, d: any) {
        d3.select(this)
          .select("circle")
          .transition()
          .duration(200)
          .attr("r", (d: any) => d.radius * 1.1)

        if (d.group !== 0) {
          // Highlight connected link
          link
            .filter((l: any) => l.source.id === "Center" && l.target.id === d.id)
            .transition()
            .duration(200)
            .attr("stroke", "hsl(var(--brand-primary))")
            .attr("stroke-opacity", 0.8)
            .attr("stroke-width", (l) => Math.sqrt(l.value) + 1)

          // Show tooltip for brands
          tooltip.transition().duration(200).style("opacity", 1)

          tooltip
            .html(`
            <div>
              <div class="font-medium">${d.id}</div>
              <div>Ranking difference: ${d.data.rank > 0 ? "+" : ""}${d.data.rank}</div>
              <div class="text-xs mt-1 text-muted-foreground">Click for more details</div>
            </div>
          `)
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px")
        }
      })
      .on("mouseout", function (event, d: any) {
        d3.select(this)
          .select("circle")
          .transition()
          .duration(200)
          .attr("r", (d: any) => d.radius)

        link
          .transition()
          .duration(200)
          .attr("stroke", "hsl(var(--border))")
          .attr("stroke-opacity", 0.4)
          .attr("stroke-width", (d) => Math.sqrt(d.value))

        tooltip.transition().duration(200).style("opacity", 0)
      })

    // Add circles to nodes
    node
      .append("circle")
      .attr("r", (d: any) => d.radius)
      .attr("fill", (d: any) =>
        d.group === 0
          ? "url(#mainGradient)"
          : d.data?.rank > 0
            ? "hsl(var(--status-positive))"
            : "hsl(var(--status-negative))",
      )
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-width", 1.5)
      .attr("opacity", (d: any) => (d.group === 0 ? 1 : 0.7))

    // Add text labels to nodes
    node
      .append("text")
      .text((d: any) => d.id)
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("fill", "currentColor")
      .attr("font-size", (d: any) => (d.group === 0 ? "14px" : "12px"))
      .attr("font-weight", (d: any) => (d.group === 0 ? "bold" : "normal"))

    // Add ranking difference indicators for brands
    node
      .filter((d: any) => d.group === 1)
      .append("text")
      .text((d: any) => (d.data.rank > 0 ? `+${d.data.rank}` : d.data.rank))
      .attr("text-anchor", "middle")
      .attr("dy", "-1.5em")
      .attr("fill", (d: any) =>
        d.data.rank > 0 ? "hsl(var(--status-positive))" : "hsl(var(--status-negative))",
      )
      .attr("font-size", "12px")
      .attr("font-weight", "bold")

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y)

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`)
    })

    // Drag functions
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      event.subject.fx = event.subject.x
      event.subject.fy = event.subject.y
    }

    function dragged(event: any) {
      event.subject.fx = event.x
      event.subject.fy = event.y
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0)
      event.subject.fx = null
      event.subject.fy = null
    }

    return () => {
      simulation.stop()
      tooltip.remove()
    }
  }, [brands, detailed])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
      <Card className="pb-0 overflow-hidden bg-background h-full border-[#e2e2e2]/70 dark:border-accent shadow-none">
        <CardHeader className="pb-2">
          <CardTitle>Brand Network</CardTitle>
        </CardHeader>
        <CardContent className="h-full">
          <div className="h-[452px]">
            <svg ref={svgRef} width="100%" height="100%" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

