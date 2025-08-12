/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
// @ts-nocheck
// 
"use client";

import React, { ReactElement } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { z } from "zod";
import {
  OpenAI,
  Claude,
  Perplexity,
  Gemini,
  DeepMind,
  DeepSeek,
  Kimi,
  Qwen,
  Grok,
  Meta,
  Baidu,
  Mistral,
} from "@lobehub/icons";

// Schema type definition
type AnalysisModelSummaryType = {
  model: string;
  summary: string;
  query: string;
  reasoning: Array<{
    url_citation: {
      url: string;
      title: string;
      snippet: string;
    };
    domain: string;
    source: string;
    text: string;
    url: string;
    title: string;
  }>;
};

// Model icons mapping
const modelIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "gpt-4o-search": OpenAI,
  "gpt-5": OpenAI,
  "claude-search": Claude.Color,
  "perplexity-sonar": Perplexity,
  "gemini-search": Gemini.Color,
  "google-ai-mode": DeepMind.Color,
  "google-ai-overview": Gemini.Color,
  "deepseek-v3": DeepSeek.Color,
  "gpt-4.1-nano": OpenAI,
  "grok-3-mini": Grok,
  "grok-4": Grok,
  "llama-4-maverick": Meta.Color,
  "claude-sonnet-4": Claude.Color,
  "gemini-2.5-flash": Gemini.Color,
  "gemini-pro-2.5": Gemini.Color,
  "deepseek-r1": DeepSeek.Color,
  "kimi-k2": Kimi.Color,
  "gpt-4.1": OpenAI,
  "gpt-4o": OpenAI,
  "ernie-4.5": Baidu.Color,
  "qwen-3-235b": Qwen.Color,
  "mistral-medium": Mistral.Color,
};

function normalizeModelToKey(model?: string | null): string | null {
  if (!model) return null;
  
  const lowerModel = model.toLowerCase();
  
  // Direct mapping for exact matches
  if (modelIcons[model]) return model;
  
  // Fuzzy matching logic
  if (lowerModel.includes("gpt") && lowerModel.includes("4o")) return "gpt-4o";
  if (lowerModel.includes("gpt") && lowerModel.includes("5")) return "gpt-5";
  if (lowerModel.includes("claude")) return "claude-search";
  if (lowerModel.includes("perplexity")) return "perplexity-sonar";
  if (lowerModel.includes("gemini")) return "gemini-search";
  if (lowerModel.includes("google")) return "google-ai-mode";
  if (lowerModel.includes("deepseek")) return "deepseek-v3";
  if (lowerModel.includes("grok")) return "grok-4";
  if (lowerModel.includes("llama")) return "llama-4-maverick";
  if (lowerModel.includes("kimi")) return "kimi-k2";
  if (lowerModel.includes("qwen")) return "qwen-3-235b";
  if (lowerModel.includes("mistral")) return "mistral-medium";
  if (lowerModel.includes("ernie")) return "ernie-4.5";
  
  return null;
}

function getModelIconFor(model?: string | null) {
  const key = normalizeModelToKey(model);
  return key ? modelIcons[key] : null;
}

export function SummaryTabContent({
  item,
}: {
  item: AnalysisModelSummaryType;
}): ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full space-y-6 pb-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          damping: 12,
          stiffness: 100,
          delay: 0.15,
        }}
      >
        <div className="group relative overflow-auto rounded-xl transition-all hover:shadow-lg dark:border-gray-800">
          <div className="p-4">
            <div className="flex md:flex-row flex-col md:items-center mb-14 gap-3">
              <p className="text-xl font-semibold">&quot;{item.query}&quot;</p>
                <div className="flex">
                  {(() => {
                    const Icon = getModelIconFor(item.model);
                    return Icon ? <Icon className="h-5 w-5" /> : null;
                  })()}
                </div>
            </div>

            <div
              className="prose whitespace-pre-wrap dark:prose-invert max-w-none 
              prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
              prose-a:text-blue-500 prose-a:no-underline hover:prose-a:text-blue-400
              prose-p:text-base prose-p:leading-7 prose-p:my-4
              prose-ul:list-disc prose-ul:ml-6 prose-li:my-1
              prose-ol:list-decimal prose-ol:ml-6
              prose-strong:text-white prose-strong:font-semibold
              prose-code:bg-neutral-800 prose-code:p-1 prose-code:rounded-md prose-code:text-sm
              prose-blockquote:border-l-4 prose-blockquote:border-neutral-500 prose-blockquote:pl-4 prose-blockquote:italic
              prose-table:table-auto prose-td:border prose-td:border-neutral-800 prose-td:p-2 
              prose-th:border prose-th:border-neutral-800 prose-th:p-2 prose-table:border-collapse"
            >
              <div className="markdown-content [&_p:has(img)]:grid [&_p:has(img)]:grid-cols-1 [&_p:has(img)]:md:grid-cols-2 [&_p:has(img)]:lg:grid-cols-3 [&_p:has(img)]:gap-4 [&_p:has(img)]:my-4">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ node, ...props }) => (
                      <table
                        className="border border-neutral-800 w-full"
                        {...props}
                      />
                    ),
                    th: ({ node, ...props }) => (
                      <th
                        className="border border-neutral-800 bg-neutral-900/50 p-2 text-left"
                        {...props}
                      />
                    ),
                    td: ({ node, ...props }) => (
                      <td
                        className="border border-neutral-800 p-2"
                        {...props}
                      />
                    ),
                    a: ({ node, ...props }) => (
                      <a
                        className="text-blue-500 hover:text-blue-400 transition-colors"
                        {...props}
                      />
                    ),
                    code: ({ node, inline, ...props }) =>
                      inline ? (
                        <code
                          className="bg-neutral-800 px-1 py-0.5 rounded text-sm"
                          {...props}
                        />
                      ) : (
                        <code
                          className="block bg-neutral-800 p-4 rounded-lg text-sm my-4 overflow-auto"
                          {...props}
                        />
                      ),
                    img: ({ node, ...props }) => (
                      <img
                        alt="Image"
                        className="w-full h-auto rounded-lg border border-neutral-700 shadow-lg hover:shadow-xl transition-shadow duration-300 object-cover"
                        {...props}
                      />
                    ),
                  }}
                >
                  {item.summary}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
