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


export const keywordLanguages = [
  { name: "English", code: "en", id: 1000 },
  { name: "French", code: "fr", id: 1002 },
  { name: "Spanish", code: "es", id: 1003 },
  { name: "German", code: "de", id: 1001 },
  { name: "Arabic", code: "ar", id: 1019 },
  { name: "Bengali", code: "bn", id: 1056 },
  { name: "Bulgarian", code: "bg", id: 1020 },
  { name: "Catalan", code: "ca", id: 1038 },
  { name: "Chinese (simplified)", code: "zh_CN", id: 1017 },
  { name: "Chinese (traditional)", code: "zh_TW", id: 1018 },
  { name: "Croatian", code: "hr", id: 1039 },
  { name: "Czech", code: "cs", id: 1021 },
  { name: "Danish", code: "da", id: 1009 },
  { name: "Dutch", code: "nl", id: 1010 },
  { name: "Estonian", code: "et", id: 1043 },
  { name: "Filipino", code: "tl", id: 1042 },
  { name: "Finnish", code: "fi", id: 1011 },
  { name: "Greek", code: "el", id: 1022 },
  { name: "Gujarati", code: "gu", id: 1072 },
  { name: "Hebrew", code: "iw", id: 1027 },
  { name: "Hindi", code: "hi", id: 1023 },
  { name: "Hungarian", code: "hu", id: 1024 },
  { name: "Icelandic", code: "is", id: 1026 },
  { name: "Indonesian", code: "id", id: 1025 },
  { name: "Italian", code: "it", id: 1004 },
  { name: "Japanese", code: "ja", id: 1005 },
  { name: "Kannada", code: "kn", id: 1086 },
  { name: "Korean", code: "ko", id: 1012 },
  { name: "Latvian", code: "lv", id: 1028 },
  { name: "Lithuanian", code: "lt", id: 1029 },
  { name: "Malay", code: "ms", id: 1102 },
  { name: "Malayalam", code: "ml", id: 1098 },
  { name: "Marathi", code: "mr", id: 1101 },
  { name: "Norwegian", code: "no", id: 1013 },
  { name: "Persian", code: "fa", id: 1064 },
  { name: "Polish", code: "pl", id: 1030 },
  { name: "Portuguese", code: "pt", id: 1014 },
  { name: "Punjabi", code: "pa", id: 1110 },
  { name: "Romanian", code: "ro", id: 1032 },
  { name: "Russian", code: "ru", id: 1031 },
  { name: "Serbian", code: "sr", id: 1035 },
  { name: "Slovak", code: "sk", id: 1033 },
  { name: "Slovenian", code: "sl", id: 1034 },
  { name: "Swedish", code: "sv", id: 1015 },
  { name: "Tamil", code: "ta", id: 1130 },
  { name: "Telugu", code: "te", id: 1131 },
  { name: "Thai", code: "th", id: 1044 },
  { name: "Turkish", code: "tr", id: 1037 },
  { name: "Ukrainian", code: "uk", id: 1036 },
  { name: "Urdu", code: "ur", id: 1041 },
  { name: "Vietnamese", code: "vi", id: 1040 },
];

