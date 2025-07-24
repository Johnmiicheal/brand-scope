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
