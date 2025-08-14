import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely extracts hostname from a URL string
 * @param url - The URL string to extract hostname from
 * @param fallback - Fallback string if URL is invalid (default: "Unknown Source")
 * @returns The hostname or fallback string
 */
export function safeGetHostname(url: string | null | undefined, fallback: string = "Unknown Source"): string {
  if (!url || url.trim() === "") {
    return fallback;
  }
  
  try {
    return new URL(url).hostname;
  } catch {
    return "Invalid URL";
  }
}

export const INDUSTRIES = [
  "Aerospace",
  "Agriculture",
  "Automotive",
  "Banking",
  "Beauty",
  "Biotechnology",
  "Construction",
  "Consulting",
  "E-commerce",
  "Education",
  "Energy",
  "Entertainment",
  "Fashion",
  "Finance",
  "Food & Beverage",
  "Gaming",
  "Government",
  "Healthcare",
  "Insurance",
  "Legal",
  "Logistics",
  "Manufacturing",
  "Marketing",
  "Media",
  "Mining",
  "Music",
  "Non-Profit",
  "Pharmaceuticals",
  "Publishing",
  "Real Estate",
  "Retail",
  "Security",
  "Sports",
  "Technology",
  "Telecommunications",
  "Transportation",
  "Travel",
  "Utilities",
  "Other",
];
// Plans configuration
export const plans = [
  {
    id: "pro",
    name: "Pro Plan",
    description: "Get Started with essential AI Analysis.",
    price: "$89",
    features: [
      "Country Monitoring",
      "Company Research",
      "SEO Keyword Analysis",
      "Native AI Search",
    ],
    models: [
      { name: "GPT 4o Web Search", key: "gpt-4o-search" },
      { name: "Claude 4.0 Sonnet", key: "claude-search" },
      { name: "Perplexity Sonar", key: "perplexity-sonar" },
      { name: "Gemini 2.5 Flash", key: "gemini-search" },
      { name: "Google AI Overview", key: "google-ai-overview" },
      { name: "Google AI Mode", key: "google-ai-mode" },
    ],
    credits: "2250 Credits",
    searches: "30 Searches",
    monitoring: "10 Monitoring",
    frequency: "(Weekly only)",
    recommended: false,
    product_id: "price_1RniuTR16g0cZkq31HV8wnRh",
  },
  {
    id: "plus",
    name: "Plus Plan",
    description: "Scale your insights and monitoring.",
    price: "$249",
    features: [
      "Country Monitoring",
      "Company Research",
      "SEO Keyword Analysis",
      "Native AI Search",
    ],
    credits: "7200 Credits",
    models: [
      { name: "GPT 5", key: "gpt-5" },
      { name: "GPT 4o Web Search", key: "gpt-4o-search" },
      { name: "Claude 4.0 Sonnet", key: "claude-search" },
      { name: "Perplexity Sonar", key: "perplexity-sonar" },
      { name: "Gemini 2.5 Flash", key: "gemini-search" },
      { name: "Google AI Overview", key: "google-ai-overview" },
      { name: "Google AI Mode", key: "google-ai-mode" },
      { name: "DeepSeek v3", key: "deepseek-v3" },
      { name: "Grok 4", key: "grok-4" },
      { name: "Llama 4 Maverick", key: "llama-4-maverick" },
      { name: "Mistral Medium", key: "mistral-medium" },
      { name: "Ernie 4.5", key: "ernie-4.5" },
      { name: "Qwen 3.235B", key: "qwen-3-235b" },
    ],
    searches: "300 Searches",
    monitoring: "100 Monitoring",
    frequency: "(Daily + Weekly)",
    recommended: true,
    product_id: "price_1Rniv8R16g0cZkq37mTSXDfo",
  },
  {
    id: "premium",
    name: "Premium Plan",
    description: "For comprehensive insights and monitoring.",
    price: "$699",
    features: [
      "Country Monitoring",
      "Company Research",
      "SEO Keyword Analysis",
      "Native AI Search",
    ],
    credits: "27000 Credits",
    models: [
      { name: "GPT 5", key: "gpt-5" },
      { name: "GPT 4o Web Search", key: "gpt-4o-search" },
      { name: "Claude 4.0 Sonnet", key: "claude-search" },
      { name: "Perplexity Sonar", key: "perplexity-sonar" },
      { name: "Gemini 2.5 Flash", key: "gemini-search" },
      { name: "Google AI Overview", key: "google-ai-overview" },
      { name: "Google AI Mode", key: "google-ai-mode" },
      { name: "DeepSeek v3", key: "deepseek-v3" },
      { name: "Grok 4", key: "grok-4" },
      { name: "Llama 4 Maverick", key: "llama-4-maverick" },
    ],
    searches: "900 Searches",
    monitoring: "300 Monitoring",
    frequency: "(Daily + Weekly)",
    recommended: false,
    product_id: "price_1RnivgR16g0cZkq3Re1ttVTu",
  },
];

