/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { TextLoop } from '@/components/ui/text-loop';
import ShinyText from './ui/shiny-text';

const aiTips = [
  "Did you know? AI models like GPT learn from patterns in vast amounts of text data.",
  "Tip: Be specific in your brand descriptions for more accurate analysis results.",
  "Fun fact: The first AI program was created in 1951 to play checkers!",
  "AI can analyze thousands of websites in seconds to evaluate your brand perception.",
  "The term 'Artificial Intelligence' was first coined in 1956 at Dartmouth College.",
  "Brand visibility is influenced by content quality, domain authority, and keyword relevance.",
  "AI models can identify patterns in consumer behavior that humans might miss.",
  "Regular brand analysis can help identify new market opportunities and competitor strategies.",
  "SEO tip: Focus on user intent rather than just keyword density for better rankings.",
  "Our analysis compares your brand against top competitors across multiple dimensions.",
];

export function LoadingState() {
  return (
        <div className="flex items-start gap-4 pl-14">
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-neutral-500">Processing with</p>
              <TextLoop interval={1.5}>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  🔍 Retrieving relevant information...
                </p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  📚 Processing search results...
                </p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  🤖 Generating response...
                </p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  ✨ Enhancing with context...
                </p>
              </TextLoop>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-neutral-500">Generating response</p>
              <ShinyText text='Combining insights from multiple sources for a comprehensive answer...' disabled={false} speed={3} className="font-medium text-sm" />
            </div>
          </div>
        </div>
  );
} 