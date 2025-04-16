// components/CompetitorsDisplay.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Competitor {
  title: string;
  url: string;
  summary: string;
}

interface CompetitorDisplayProps {
  competitors: Competitor[];
}

// Function to extract the main part of the domain
const extractDomain = (url: string) => {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain;
  } catch {
    return url;
  }
};

export default function CompetitorsDisplay({ competitors }: CompetitorDisplayProps) {
  const [showAll, setShowAll] = useState(false);
  const INITIAL_DISPLAY_COUNT = 4;

  if (!competitors?.length) return null;

  const visibleCompetitors = showAll 
    ? competitors 
    : competitors.slice(0, INITIAL_DISPLAY_COUNT);

  const hasMore = competitors.length > INITIAL_DISPLAY_COUNT;

  return (
    <div>
      <h2 className="text-2xl font-normal ">
        Similar Companies
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
        {visibleCompetitors.map((competitor) => (
          <div
            key={competitor.url}
            className="bg-background p-6 border rounded-lg hover:ring-blue-500 hover:ring-1 transition-all duration-200"
          >
            <a
              href={competitor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <h3 className="text-lg font-medium text-blue-500 group-hover:text-blue-500/80 transition-colors mb-2">
                {competitor.title || extractDomain(competitor.url)}
              </h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                {competitor.summary}
              </p>
            </a>
          </div>
        ))}
      </div>
      
      {hasMore && (
        <div className="flex justify-start mt-6">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-2 py-2 text-sm text-gray-600 hover:text-blue-900 transition-colors duration-200"
          >
            <span>{showAll ? 'Show Less' : 'Show More'}</span>
            {showAll ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}