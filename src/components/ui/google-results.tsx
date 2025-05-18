/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  Clock,
  ExternalLink,
  Info,
  Search,
  ChevronDown,
  ChevronUp,
  BarChart,
} from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GoogleSearchResult } from "@/types/search";
import { Gemini, Google } from "@lobehub/icons";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";

interface GoogleResultsProps {
  googleResults: GoogleSearchResult;
  rankings: any;
}

export function GoogleResults({ googleResults, rankings }: GoogleResultsProps) {
  const [showCitations, setShowCitations] = useState<boolean>(true);
  const [isAIOverviewExpanded, setIsAIOverviewExpanded] =
    useState<boolean>(false);

  // Helper function to truncate URLs for display
  const truncateUrl = (url: string) => {
    if (!url) return "";
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + (urlObj.pathname !== "/" ? urlObj.pathname : "");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e: unknown) {
      return url.substring(0, 40) + "...";
    }
  };

  // Function to render citations for a specific section of content
  const renderCitations = (
    contentType: string,
    contentIndex: number,
    references: any[]
  ) => {
    if (!references || references.length === 0) return null;

    const refsPerItem = Math.max(
      1,
      Math.ceil(references.length / (contentType === "paragraph" ? 3 : 6))
    );
    const startIndex = contentIndex * refsPerItem;
    const endIndex = Math.min(startIndex + refsPerItem, references.length);
    const relevantRefs = references.slice(startIndex, endIndex);

    if (!relevantRefs || relevantRefs.length === 0) return null;

    return (
      <span className="inline-flex ml-1 flex-wrap gap-1">
        {relevantRefs.map((ref, i) => (
          <Badge
            key={`citation-${contentType}-${contentIndex}-${i}`}
            variant="outline"
            className="text-xs text-blue-500/60 bg-blue-500/10 hover:bg-blue-500/20 cursor-pointer"
          >
            <a
              href={ref.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1"
              title={ref.title || truncateUrl(ref.link || "")}
            >
              [{ref.index + 1}]
            </a>
          </Badge>
        ))}
      </span>
    );
  };

  // Function to automatically assign references to content
  const getReferencesForContentType = (
    index: number,
    totalItems: number,
    contentType: string,
    refs: any[]
  ) => {
    if (!refs || refs.length === 0) return [];

    try {
      const refsPerItem = Math.max(1, Math.ceil(refs.length / totalItems));
      const startIdx =
        (index % Math.max(1, Math.floor(refs.length / refsPerItem))) *
        refsPerItem;
      const endIdx = Math.min(startIdx + refsPerItem, refs.length);

      return refs.slice(startIdx, endIdx);
    } catch (error) {
      console.error("Error assigning references:", error);
      return [];
    }
  };

  if (!googleResults) return null;

  return (
    <Card className="p-0 overflow-hidden bg-transparent border-none">
      {/* Header with Google-like search bar */}
      <div className="px-0 gap-4 py-4 flex w-full justify-between items-center">
        <Google.BrandColor size={32} />
        <div className="flex items-center gap-2 border w-full py-3 px-4 rounded-full">
          <Search className="h-5 w-5 text-blue-500/50" />
          <h2 className="text-lg font-normal text-white/70">
            {googleResults.search_parameters?.q || "Search Results"}
          </h2>
        </div>
        <div className="flex items-center gap-2 w-full justify-end">
          {googleResults.search_metadata?.raw_html_file && (
            <a
              href={googleResults.search_metadata.raw_html_file}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 font-semibold hover:underline flex items-center gap-1"
            >
              <ExternalLink size={14} />
              <span>View on Google</span>
            </a>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowCitations(!showCitations)}
                  className={`p-2 rounded-full ${
                    showCitations
                      ? "bg-blue-500/20 text-blue-500"
                      : "text-white/70 hover:bg-white/10"
                  }`}
                >
                  <Info size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Toggle citations</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Tabs Navigation - Google-style */}
      <Tabs defaultValue="all" className="w-full">
        <div className="border-b">
          <TabsList className="h-12 bg-transparent w-fit flex justify-start space-x-6">
            <TabsTrigger
              value="all"
              className="!bg-transparent hover:!bg-transparent data-[state=active]:!bg-transparent 
                        data-[state=active]:!text-blue-500 data-[state=active]:!border-b-2 data-[state=active]:!border-b-blue-500
                        !text-gray-600 !rounded-none !border-transparent !px-3 hover:!text-blue-600 transition-all duration-200"
            >
              <Search className="h-4 w-4 mr-2" />
              All
            </TabsTrigger>
            <TabsTrigger
              value="rankings"
              className="!bg-transparent hover:!bg-transparent data-[state=active]:!bg-transparent 
                        data-[state=active]:!text-blue-500 data-[state=active]:!border-b-2 data-[state=active]:!border-b-blue-500
                        !text-gray-600 !rounded-none !border-transparent !px-3 hover:!text-blue-600 transition-all duration-200"
            >
              <BarChart className="h-4 w-4 mr-2" />
              Rankings
            </TabsTrigger>
          </TabsList>
        </div>

        {/* All Results Tab - Main Google-like search results */}
        <TabsContent value="all" className="m-0">
          <div className="mx-auto px-4 py-4 space-y-6">
            {/* About X results */}
            <div className="text-sm text-white/50 pb-2">
              {googleResults.search_information?.total_results && (
                <p>
                  About{" "}
                  {googleResults.search_information.total_results.toLocaleString()}{" "}
                  results (
                  {googleResults.search_information.time_taken_displayed || ""})
                </p>
              )}
            </div>

            {/* AI / Featured Snippet Answer Box */}
            {googleResults.ai_overview?.text_blocks?.length > 0 ||
            googleResults.answer_box ? (
              <div className="mb-6 border rounded-lg p-4 bg-background">
                <div className="flex items-center mb-8 justify-between">
                  <div className="flex items-center gap-2">
                    <Gemini.Color size={24} />
                    <p className="text-lg text-white font-bold">AI Overview</p>
                  </div>
                  <button
                    onClick={() =>
                      setIsAIOverviewExpanded(!isAIOverviewExpanded)
                    }
                    className="text-sm flex items-center gap-1 text-blue-500 hover:bg-blue-500/10 rounded-full px-2 py-1 cursor-pointer"
                  >
                    {isAIOverviewExpanded ? (
                      <>
                        Show less <ChevronUp size={14} />
                      </>
                    ) : (
                      <>
                        Show more <ChevronDown size={14} />
                      </>
                    )}
                  </button>
                </div>

                {/* AI Overview Blocks */}
                {googleResults.ai_overview?.text_blocks && (
                  <div className="space-y-3">
                    {googleResults.ai_overview.text_blocks
                      .slice(
                        0,
                        isAIOverviewExpanded
                          ? googleResults.ai_overview.text_blocks.length
                          : 1
                      )
                      .map((block: any, blockIndex: number) => {
                        const refs = googleResults.ai_overview.references || [];
                        const totalBlocks =
                          googleResults.ai_overview.text_blocks.length;

                        if (block.type === "paragraph") {
                          return (
                            <div key={blockIndex} className="text-white/90">
                              <p>
                                {block.snippet}
                                {showCitations &&
                                  renderCitations(
                                    "paragraph",
                                    blockIndex,
                                    getReferencesForContentType(
                                      blockIndex,
                                      totalBlocks,
                                      "paragraph",
                                      refs
                                    )
                                  )}
                              </p>
                            </div>
                          );
                        }

                        if (block.type === "heading") {
                          return (
                            <h3
                              key={blockIndex}
                              className="text-lg font-bold text-white/90 mt-3 mb-1"
                            >
                              {block.snippet}
                            </h3>
                          );
                        }

                        if (block.type === "list" && block.list) {
                          return (
                            <div key={blockIndex}>
                              <ul className="list-disc pl-8 space-y-1 text-white/90">
                                {block.list.map(
                                  (item: any, itemIndex: number) => {
                                    const itemRefs =
                                      getReferencesForContentType(
                                        itemIndex,
                                        block.list.length,
                                        "list_item",
                                        refs
                                      );

                                    return (
                                      <li key={itemIndex}>
                                        {item.title && (
                                          <span className="font-medium">
                                            {item.title}:{" "}
                                          </span>
                                        )}
                                        {item.snippet}
                                        {showCitations &&
                                          renderCitations(
                                            "list_item",
                                            itemIndex,
                                            itemRefs
                                          )}
                                      </li>
                                    );
                                  }
                                )}
                              </ul>
                            </div>
                          );
                        }

                        return null;
                      })}
                  </div>
                )}

                {/* Regular Answer Box */}
                {!googleResults.ai_overview && googleResults.answer_box && (
                  <div>
                    <p
                      className={`text-lg ${
                        !isAIOverviewExpanded ? "line-clamp-2" : ""
                      }`}
                    >
                      {googleResults.answer_box.snippet ||
                        googleResults.answer_box.snippet}
                    </p>
                    {(isAIOverviewExpanded ||
                      !googleResults.answer_box.snippet ||
                      googleResults.answer_box.snippet.length < 150) &&
                      googleResults.answer_box.link && (
                        <div className="mt-2 text-sm">
                          <a
                            href={googleResults.answer_box.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            {googleResults.answer_box.title ||
                              googleResults.answer_box.source}
                          </a>
                        </div>
                      )}
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-6 border rounded-lg p-4 bg-background">
                <p className="text-lg text-white font-bold">No AI Overview</p>
              </div>
            )}

            {/* Organic Results - Classic Google Style */}
            <div className="space-y-6 mt-10 border-t pt-5">
              {googleResults.organic_results?.map((result, index) => (
                <div key={index} className="group">
                  <div className="text-sm text-white/50 mb-1 flex items-center">
                    {result.source && <span>{result.source}</span>}
                    {result.source && result.date && (
                      <span className="mx-2">•</span>
                    )}
                    {result.date && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {result.date}
                      </span>
                    )}
                  </div>
                  <a
                    href={result.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <h3 className="text-xl text-blue-500 group-hover:underline">
                      {result.title}
                    </h3>
                    <div className="text-sm text-green-500/50 mb-1">
                      {truncateUrl(result.link)}
                    </div>
                    <p className="text-white/80">{result.snippet}</p>
                  </a>

                  {/* Sitelinks */}
                  {result.sitelinks &&
                    Array.isArray(result.sitelinks) &&
                    result.sitelinks.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        {result.sitelinks.map((sitelink, slIndex) => (
                          <a
                            key={slIndex}
                            href={sitelink.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline truncate flex items-center"
                          >
                            <ChevronRight className="h-3 w-3 mr-1 flex-shrink-0" />
                            {sitelink.title}
                          </a>
                        ))}
                      </div>
                    )}
                </div>
              ))}

              {(!googleResults.organic_results ||
                googleResults.organic_results.length === 0) && (
                <div className="text-center py-10">
                  <p className="text-white">
                    No results available for this search.
                  </p>
                </div>
              )}
            </div>

            {/* Related Searches */}
            {googleResults.related_searches &&
              googleResults.related_searches.length > 0 && (
                <div className="mt-8 pt-4 border-t">
                  <h3 className="text-xl text-white mb-3">Related searches</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {googleResults.related_searches
                      .slice(1, 9)
                      .map((related, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-neutral-800 hover:bg-neutral-700 transition-all duration-200 p-3 rounded-lg"
                        >
                          <a
                            href={related.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white hover:underline"
                          >
                            {related.query}
                          </a>
                          <Search className="h-4 w-4 text-white/50 ml-5 flex-end" />
                        </div>
                      ))}
                  </div>
                </div>
              )}
          </div>
        </TabsContent>

        {/* Rankings Tab */}
        <TabsContent value="rankings" className="m-0">
          <RankingsTabContent rankings={rankings} />
        </TabsContent>
      </Tabs>

      {/* Footer - Google style pagination */}
      {googleResults.pagination && googleResults.pagination.next && (
        <div className="px-6 py-4 border-t flex justify-end">
          <div className="flex items-start gap-4">
            <a
              href={googleResults.pagination.next}
              className="text-blue-500 hover:underline flex items-center"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </a>
          </div>
        </div>
      )}
    </Card>
  );
}

function RankingsTabContent({ rankings }: { rankings: any }) {
  if (!rankings) return null;
  const rankingsData = JSON.parse(rankings)
  // console.log(JSON.parse(rankings))
  return (
    <div>
      <div className="gap-6">
        <motion.div
          className="space-y-4 sm:space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
            <motion.div variants={itemVariants}>
              <div className="relative overflow-x-auto rounded-md border border-accent w-full">
                <table className="w-full text-xs sm:text-sm text-left">
                  <thead className="text-xs uppercase bg-zinc-900/50">
                    <tr>
                      <th scope="col" className="px-2 sm:px-6 py-2 sm:py-3">
                        Name
                      </th>
                      <th scope="col" className="px-2 sm:px-6 py-2 sm:py-3">
                        Rank
                      </th>
                      <th scope="col" className="px-2 sm:px-6 py-2 sm:py-3">
                        Score
                      </th>
                      <th scope="col" className="px-2 sm:px-6 py-2 sm:py-3">
                        Model
                      </th>
                      <th scope="col" className="px-2 sm:px-6 py-2 sm:py-3">
                        Reasoning
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {rankingsData?.brands
                        .sort((a: any, b: any) => (a.rank || 99) - (b.rank || 99))
                        .map((ranking: any, idx: number) => (
                          <motion.tr
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="border-b border-accent hover:bg-zinc-800/20"
                          >
                            <td className="px-2 sm:px-6 py-3 sm:py-4 font-medium text-white">
                              {ranking.name}
                            </td>

                            <td className="px-2 sm:px-6 py-3 sm:py-4">
                              {ranking.rank ?? "N/A"}
                            </td>
                            <td className="px-2 sm:px-6 py-3 sm:py-4">
                              {ranking.score}
                            </td>
                            <td className="px-2 sm:px-6 py-3 sm:py-4">
                              <Badge className="bg-blue-500/20 text-blue-200 border-blue-500/30 text-xs whitespace-nowrap">
                                Google
                              </Badge>
                            </td>
                            <td className="px-2 sm:px-6 py-3 sm:py-4 max-w-[200px] sm:max-w-md">
                              <div className="line-clamp-3 sm:line-clamp-none text-xs sm:text-sm">
                                {ranking.reasoning || "N/A"}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 15,
    },
  },
};
