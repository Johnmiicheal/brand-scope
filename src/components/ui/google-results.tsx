/* eslint-disable @typescript-eslint/no-explicit-any */

import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { useEffect } from "react";

interface GoogleResultsProps {
  googleResults: any;
}

export function GoogleResults({ googleResults }: GoogleResultsProps) {
  
  // Helper function to truncate URLs for display
  const truncateUrl = (url: string) => {
    if (!url) return '';
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '');
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      return url.substring(0, 30) + `...${errorMessage}`;
    }
  };
  
  // Function to render citations for a specific section of content
  const renderCitations = (contentType: string, contentIndex: number, references: any[]) => {
    // Assign references to each content item strategically
    // For simplicity, we'll distribute references evenly across content items
    const refsPerItem = Math.max(1, Math.ceil(references.length / (contentType === 'paragraph' ? 3 : 6)));
    
    const startIndex = contentIndex * refsPerItem;
    const endIndex = Math.min(startIndex + refsPerItem, references.length);
    
    const relevantRefs = references.slice(startIndex, endIndex);
    
    if (!relevantRefs || relevantRefs.length === 0) return null;
    
    return (
      <span className="inline-flex ml-1 flex-wrap gap-1">
        {relevantRefs.map((ref, i) => (
          <a 
            key={`citation-${contentType}-${contentIndex}-${i}`}
            href={ref.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs text-blue-600 hover:underline ml-1 bg-blue-50 px-1 rounded"
            title={ref.title || truncateUrl(ref.link || '')}
          >
            [{ref.index + 1}]
          </a>
        ))}
      </span>
    );
  };
  
  // Function to automatically assign references to list items
  const getReferencesForContentType = (index: number, totalItems: number, contentType: string, refs: any[]) => {
    if (!refs || refs.length === 0) return [];
    
    try {
      // Calculate which references should be assigned to this content item
      // based on its position in the sequence
      const refsPerItem = Math.max(1, Math.ceil(refs.length / totalItems));
      const startIdx = (index % Math.max(1, Math.floor(refs.length / refsPerItem))) * refsPerItem;
      const endIdx = Math.min(startIdx + refsPerItem, refs.length);
      
      return refs.slice(startIdx, endIdx);
    } catch (error) {
      console.error('Error assigning references:', error);
      return [];
    }
  };
  
  useEffect(() => {
    console.log("DEBUG - GoogleResults received:", googleResults);
    
    if (googleResults?.ai_overview?.references) {
      console.log(`AI Overview has ${googleResults.ai_overview.references.length} references`);
    }
  }, [googleResults]);

  if (!googleResults) return null;

  return (
    <Card className="p-6 bg-white">
      <div className="space-y-6 text-gray-900">
        {(googleResults.ai_overview || googleResults.answer_box || googleResults.knowledge_graph) && (
          <div className="space-y-4 border-b pb-4">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold">AI Overview</h3>
              <div className="flex items-center gap-2">
                {googleResults.searchMetadata?.raw_html_file && (
                  <a 
                    href={googleResults.searchMetadata.raw_html_file} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-full flex items-center gap-1"
                  >
                    <ExternalLink size={14} />
                    See Result in Google
                  </a>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-4">
                {/* Handle AI Overview text blocks */}
                {googleResults.ai_overview?.text_blocks ? googleResults.ai_overview.text_blocks.map((block: any, blockIndex: number) => {
                  const refs = googleResults.ai_overview.references || [];
                  const totalBlocks = googleResults.ai_overview.text_blocks.length;
                  
                  return (
                    <div key={blockIndex} className="relative group">
                      {block.type === "paragraph" && (
                        <div className="relative bg-white rounded p-3 shadow-sm border border-gray-100 mb-4">
                          <p className="text-sm text-gray-700">
                            {block.snippet}
                            {/* Direct citation links at the end of each paragraph */}
                            {renderCitations('paragraph', blockIndex, 
                              getReferencesForContentType(blockIndex, totalBlocks, 'paragraph', refs))}
                          </p>
                          {/* Citation details directly below the paragraph for better visibility */}
                          {getReferencesForContentType(blockIndex, totalBlocks, 'paragraph', refs).length > 0 && (
                            <div className="mt-2 text-xs text-gray-500 border-t pt-2">
                              <p className="font-medium">Sources:</p>
                              <ul className="list-disc pl-4 space-y-1 mt-1">
                                {getReferencesForContentType(blockIndex, totalBlocks, 'paragraph', refs).map((ref, i) => (
                                  <li key={`source-${blockIndex}-${i}`}>
                                    <a 
                                      href={ref.link} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                    >
                                      {ref.title || truncateUrl(ref.link || '')}
                                    </a>
                                    {ref.source && <span className="text-gray-400 ml-1">({ref.source})</span>}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                      {block.type === "heading" && (
                        <h3 className="text-base font-medium mb-2">{block.snippet}</h3>
                      )}
                      {block.type === "list" && block.list && (
                        <div className="bg-white rounded p-3 shadow-sm border border-gray-100 mb-4">
                          <div className="space-y-1">
                            {block.list.map((item: any, itemIndex: number) => {
                              const itemRefs = getReferencesForContentType(
                                itemIndex, 
                                block.list.length, 
                                'list_item', 
                                refs
                              );
                              
                              return (
                                <div key={itemIndex} className="ml-4 border-l-2 border-blue-100 pl-3 py-1">
                                  {item.title && <h4 className="font-medium text-sm">{item.title}</h4>}
                                  <p className="text-sm text-gray-600">
                                    {item.snippet}
                                    {renderCitations('list_item', itemIndex, itemRefs)}
                                  </p>
                                  
                                  {/* Show sources directly under each list item when available */}
                                  {itemRefs.length > 0 && (
                                    <div className="mt-1 text-xs text-gray-500">
                                      <p className="italic">Source: 
                                        <a 
                                          href={itemRefs[0]?.link || '#'} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline ml-1"
                                        >
                                          {itemRefs[0]?.source || truncateUrl(itemRefs[0]?.link || '')}
                                        </a>
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }) : <p className="text-sm text-gray-500 italic">No AI overview text blocks available</p>}
                
                {/* Handle Answer Box if AI Overview is not available */}
                {!googleResults.ai_overview && googleResults.answer_box && (
                  <div className="relative group">
                    <div className="relative">
                      <p className="text-sm text-gray-700">
                        {googleResults.answer_box.snippet || googleResults.answer_box.answer}
                      </p>
                      {googleResults.answer_box.source && (
                        <div className="mt-2 text-xs text-gray-500">
                          Source: <a 
                            href={googleResults.answer_box.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {googleResults.answer_box.source}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Handle Knowledge Graph if neither AI Overview nor Answer Box is available */}
                {!googleResults.ai_overview && !googleResults.answer_box && googleResults.knowledge_graph && (
                  <div className="relative group">
                    <div className="relative">
                      <p className="text-sm text-gray-700">
                        {googleResults.knowledge_graph.description}
                      </p>
                      {googleResults.knowledge_graph.source && (
                        <div className="mt-2 text-xs text-gray-500">
                          Source: <a 
                            href={googleResults.knowledge_graph.source?.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {googleResults.knowledge_graph.source?.name}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Citations column removed */}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Google Classical Results</h3>
          <div className="space-y-6">
            {googleResults.organic_results?.map((result: any, index: number) => (
              <div key={index} className="space-y-2 flex gap-3">
                <div className="text-gray-500 font-mono text-sm flex-shrink-0">
                  {(index + 1).toString().padStart(2, '0')}
                </div>
                <div className="min-w-0 flex-1">
                  <a 
                    href={result.link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:underline block"
                  >
                    <h4 className="text-lg font-medium">{result.title}</h4>
                    <div className="text-sm text-gray-600 truncate">
                      {truncateUrl(result.link)}
                    </div>
                  </a>
                  <p className="text-sm text-gray-600 mt-1">{result.snippet}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
