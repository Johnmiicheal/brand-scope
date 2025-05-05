/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Clock, ExternalLink, Info, Search, Youtube, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GoogleSearchResult } from "@/types/search";
import { Gemini, Google } from "@lobehub/icons";

interface GoogleResultsProps {
  googleResults: GoogleSearchResult;
}

export function GoogleResults({ googleResults }: GoogleResultsProps) {
  const [showCitations, setShowCitations] = useState<boolean>(false);
  const [isAIOverviewExpanded, setIsAIOverviewExpanded] = useState<boolean>(false);
  
  // Helper function to truncate URLs for display
  const truncateUrl = (url: string) => {
    if (!url) return '';
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e: unknown) {
      return url.substring(0, 40) + '...';
    }
  };
  
  // Function to render citations for a specific section of content
  const renderCitations = (contentType: string, contentIndex: number, references: any[]) => {
    if (!references || references.length === 0) return null;
    
    const refsPerItem = Math.max(1, Math.ceil(references.length / (contentType === 'paragraph' ? 3 : 6)));
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
            title={ref.title || truncateUrl(ref.link || '')}
          >
            [{ref.index + 1}]
          </a>
          </Badge>
        ))}
      </span>
    );
  };
  
  // Function to automatically assign references to content
  const getReferencesForContentType = (index: number, totalItems: number, contentType: string, refs: any[]) => {
    if (!refs || refs.length === 0) return [];
    
    try {
      const refsPerItem = Math.max(1, Math.ceil(refs.length / totalItems));
      const startIdx = (index % Math.max(1, Math.floor(refs.length / refsPerItem))) * refsPerItem;
      const endIdx = Math.min(startIdx + refsPerItem, refs.length);
      
      return refs.slice(startIdx, endIdx);
    } catch (error) {
      console.error('Error assigning references:', error);
      return [];
    }
  };

  if (!googleResults) return null;

  // Check if images and videos are available
  const hasImages = googleResults.inline_images && googleResults.inline_images.length > 0;
  const hasVideos = googleResults.inline_videos && googleResults.inline_videos.length > 0 || 
                     (googleResults.organic_results?.some(result => 
                       result.link?.includes('youtube.com') || result.link?.includes('vimeo.com')));

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
          {googleResults.search_metadata?.google_url && (
            <a 
              href={googleResults.search_metadata.google_url} 
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
                  className={`p-2 rounded-full ${showCitations ? 'bg-blue-500/20 text-blue-500' : 'text-white/70 hover:bg-white/10'}`}
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
      <Tabs 
        defaultValue="all" 
        className="w-full"
      >
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
            {/* {hasImages && (
              <TabsTrigger 
                value="images" 
                className="!bg-transparent hover:!bg-transparent data-[state=active]:!bg-transparent 
                        data-[state=active]:!text-blue-500 data-[state=active]:!border-b-2 data-[state=active]:!border-b-blue-500
                        !text-gray-600 !rounded-none !border-transparent !px-3 hover:!text-blue-600 transition-all duration-200"
              >
                <Image className="h-4 w-4 mr-2" />
                Images
              </TabsTrigger>
            )}
            {hasVideos && (
              <TabsTrigger 
                value="videos" 
                className="!bg-transparent hover:!bg-transparent data-[state=active]:!bg-transparent 
                        data-[state=active]:!text-blue-500 data-[state=active]:!border-b-2 data-[state=active]:!border-b-blue-500
                        !text-gray-600 !rounded-none !border-transparent !px-3 hover:!text-blue-600 transition-all duration-200"
              >
                <Youtube className="h-4 w-4 mr-2" />
                Videos
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="more" 
              className="!bg-transparent hover:!bg-transparent data-[state=active]:!bg-transparent 
                        data-[state=active]:!text-blue-500 data-[state=active]:!border-b-2 data-[state=active]:!border-b-blue-500
                        !text-gray-600 !rounded-none !border-transparent !px-3 hover:!text-blue-600 transition-all duration-200"
            >
              <MoreHorizontal className="h-4 w-4 mr-2" />
              More
            </TabsTrigger> */}
          </TabsList>
        </div>

        {/* All Results Tab - Main Google-like search results */}
        <TabsContent value="all" className="m-0">
          <div className="mx-auto px-4 py-4 space-y-6">
            {/* About X results */}
            <div className="text-sm text-white/50 pb-2">
              {googleResults.search_information?.total_results && (
                <p>About {(googleResults.search_information.total_results).toLocaleString()} results ({googleResults.search_information.time_taken_displayed || ""})</p>
              )}
            </div>

            {/* AI / Featured Snippet Answer Box */}
            {(googleResults.ai_overview || googleResults.answer_box) && (
              <div className="mb-6 border rounded-lg p-4 bg-background">
                <div className="flex items-center mb-8 justify-between">
                    <div className="flex items-center gap-2">
                      <Gemini.Color size={24} />
                  <p className="text-lg text-white font-bold">AI Overview</p>
                  </div>
                  <button 
                    onClick={() => setIsAIOverviewExpanded(!isAIOverviewExpanded)}
                    className="text-sm flex items-center gap-1 text-blue-500 hover:bg-blue-500/10 rounded-full px-2 py-1 cursor-pointer"
                  >
                    {isAIOverviewExpanded ? (
                      <>Show less <ChevronUp size={14} /></>
                    ) : (
                      <>Show more <ChevronDown size={14} /></>
                    )}
                  </button>
                </div>
                
                {/* AI Overview Blocks */}
                {googleResults.ai_overview?.text_blocks && (
                  <div className="space-y-3">
                    {googleResults.ai_overview.text_blocks
                      .slice(0, isAIOverviewExpanded ? googleResults.ai_overview.text_blocks.length : 1)
                      .map((block: any, blockIndex: number) => {
                        const refs = googleResults.ai_overview.references || [];
                        const totalBlocks = googleResults.ai_overview.text_blocks.length;
                        
                        if (block.type === "paragraph") {
                          return (
                            <div key={blockIndex} className="text-white/90">
                              <p>
                                {block.snippet}
                                {showCitations && renderCitations('paragraph', blockIndex, 
                                  getReferencesForContentType(blockIndex, totalBlocks, 'paragraph', refs))}
                              </p>
                            </div>
                          );
                        }
                        
                        if (block.type === "heading") {
                          return (
                            <h3 key={blockIndex} className="text-lg font-bold text-white/90 mt-3 mb-1">{block.snippet}</h3>
                          );
                        }
                        
                        if (block.type === "list" && block.list) {
                          return (
                            <div key={blockIndex}>
                              <ul className="list-disc pl-8 space-y-1 text-white/90">
                                {block.list.map((item: any, itemIndex: number) => {
                                  const itemRefs = getReferencesForContentType(
                                    itemIndex, 
                                    block.list.length, 
                                    'list_item', 
                                    refs
                                  );
                                  
                                  return (
                                    <li key={itemIndex}>
                                      {item.title && <span className="font-medium">{item.title}: </span>}
                                      {item.snippet}
                                      {showCitations && renderCitations('list_item', itemIndex, itemRefs)}
                                    </li>
                                  );
                                })}
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
                    <p className={`text-lg ${!isAIOverviewExpanded ? "line-clamp-2" : ""}`}>
                      {googleResults.answer_box.snippet || googleResults.answer_box.snippet}
                    </p>
                    {(isAIOverviewExpanded || !googleResults.answer_box.snippet || googleResults.answer_box.snippet.length < 150) && googleResults.answer_box.link && (
                      <div className="mt-2 text-sm">
                        <a 
                          href={googleResults.answer_box.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {googleResults.answer_box.title || googleResults.answer_box.source}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Organic Results - Classic Google Style */}
            <div className="space-y-6 mt-10 border-t pt-5">
              {googleResults.organic_results?.map((result, index) => (
                <div key={index} className="group">
                  <div className="text-sm text-white/50 mb-1 flex items-center">
                    {result.source && (
                      <span>{result.source}</span>
                    )}
                    {result.source && result.date && <span className="mx-2">•</span>}
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
                    <h3 className="text-xl text-blue-500 group-hover:underline">{result.title}</h3>
                    <div className="text-sm text-green-500/50 mb-1">
                      {truncateUrl(result.link)}
                    </div>
                    <p className="text-white/80">{result.snippet}</p>
                  </a>
                  
                  {/* Sitelinks */}
                  {result.sitelinks && Array.isArray(result.sitelinks) && result.sitelinks.length > 0 && (
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
              
              {(!googleResults.organic_results || googleResults.organic_results.length === 0) && (
                <div className="text-center py-10">
                  <p className="text-white">No results available for this search.</p>
                </div>
              )}
            </div>
            
            {/* Related Searches */}
            {googleResults.related_searches && googleResults.related_searches.length > 0 && (
              <div className="mt-8 pt-4 border-t">
                <h3 className="text-xl text-white mb-3">Related searches</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {googleResults.related_searches.slice(1,9).map((related, index) => (
                    <div key={index} className="flex items-center justify-between bg-neutral-800 hover:bg-neutral-700 transition-all duration-200 p-3 rounded-lg">
                      <a href={related.link} target="_blank" rel="noopener noreferrer" className="text-white hover:underline">
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

        {/* Images Tab */}
        {hasImages && (
          <TabsContent value="images" className="m-0">
            <div className="px-6 py-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {googleResults.inline_images?.map((image, index) => (
                  <a 
                    key={index}
                    href={(image as any).source?.link || "#"} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <div className="aspect-square overflow-hidden rounded-lg border border bg-gray-100 hover:shadow-md transition-shadow">
                      <img 
                        src={image.thumbnail} 
                        alt={(image as any).source?.title || "Image result"} 
                        className="h-full w-full object-cover object-center transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    {(image as any).source?.title && (
                      <div className="mt-2 text-xs text-gray-600 line-clamp-1">
                        {(image as any).source.title}
                      </div>
                    )}
                  </a>
                ))}
              </div>
              
              {(!googleResults.inline_images || googleResults.inline_images.length === 0) && (
                <div className="text-center py-10">
                  <p className="text-white">No image results available for this search.</p>
                </div>
              )}
            </div>
          </TabsContent>
        )}

        {/* Videos Tab */}
        {hasVideos && (
          <TabsContent value="videos" className="m-0">
            <div className="px-6 py-4">
              <div className="space-y-4">
                {/* First try inline_videos */}
                {googleResults.inline_videos?.map((video, index) => (
                  <div 
                    key={index} 
                    className="flex flex-col sm:flex-row gap-4 p-4 border border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="sm:w-48 flex-shrink-0">
                      <a 
                        href={video.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="block relative aspect-video rounded-md overflow-hidden"
                      >
                        <img 
                          src={video.thumbnail} 
                          alt={video.title} 
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/10 transition-colors">
                          <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
                            <Youtube className="h-6 w-6 text-red-600" />
                          </div>
                        </div>
                      </a>
                    </div>
                    <div className="flex-1">
                      <a 
                        href={video.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="block group"
                      >
                        <h4 className="text-[#1a0dab] group-hover:underline font-medium">{video.title}</h4>
                        <div className="text-xs text-white mb-1">
                          {video.duration && <span className="ml-2">{video.duration}</span>}
                        </div>
                        <p className="text-gray-700">{video.title || "Video result"}</p>
                      </a>
                    </div>
                  </div>
                ))}
                
                {/* Then try video-related organic results */}
                {(!googleResults.inline_videos || googleResults.inline_videos.length === 0) && 
                  googleResults.organic_results?.filter(result => 
                    result.link?.includes('youtube.com') || 
                    result.link?.includes('vimeo.com')
                  ).map((video, index) => (
                    <div 
                      key={`organic-video-${index}`} 
                      className="flex flex-col sm:flex-row gap-4 p-4 border border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <a 
                          href={video.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="block group"
                        >
                          <div className="flex items-center gap-2">
                            <Youtube className="h-5 w-5 text-red-600" />
                            <h4 className="text-[#1a0dab] group-hover:underline">{video.title}</h4>
                          </div>
                          <div className="text-xs text-green-400/40 mb-1">
                            {truncateUrl(video.link)}
                          </div>
                          <p className="text-gray-700">{video.snippet}</p>
                        </a>
                      </div>
                    </div>
                  ))
                }
                
                {(!googleResults.inline_videos || googleResults.inline_videos.length === 0) && 
                 (!googleResults.organic_results || 
                  !googleResults.organic_results.some(result => 
                    result.link?.includes('youtube.com') || 
                    result.link?.includes('vimeo.com')
                  )) && (
                  <div className="text-center py-10">
                    <p className="text-white">No video results available for this search.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        )}

        {/* More Tab */}
        <TabsContent value="more" className="m-0">
          <div className="px-6 py-4">
            <div className="space-y-8">
              {/* Related Questions */}
              {googleResults.related_questions && googleResults.related_questions.length > 0 && (
                <div>
                  <h3 className="text-xl text-gray-800 mb-3">People also ask</h3>
                  <div className="space-y-2">
                    {googleResults.related_questions.map((question: any, index: number) => (
                      <div key={index} className="border border rounded">
                        <div className="p-3 font-medium text-[#1a0dab] hover:underline cursor-pointer">
                          {question.question}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Discussions and Forums */}
              {googleResults.discussions_and_forums && googleResults.discussions_and_forums.length > 0 && (
                <div>
                  <h3 className="text-xl text-gray-800 mb-3">Discussions</h3>
                  <div className="space-y-4">
                    {googleResults.discussions_and_forums.map((discussion: any, index: number) => (
                      <a 
                        key={index}
                        href={discussion.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="block p-3 border border rounded-lg hover:shadow-md"
                      >
                        <h4 className="text-[#1a0dab] hover:underline font-medium">{discussion.title}</h4>
                        <div className="text-xs text-white mb-1">
                          {discussion.source}
                        </div>
                        <p className="text-gray-700">{discussion.snippet}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
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
