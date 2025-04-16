/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// CompanyResearchHome.tsx

"use client";
import { useState, FormEvent } from "react";
import CompetitorsDisplay from "./competitors/CompetitorsDisplay";
import NewsDisplay from "./news/NewsDisplay";
import CompanySummary from "./companycontent/CompanySummar";
import FundingDisplay from "./companycontent/FundingDisplay";
import ProfileDisplay from "./twitter/TwitterProfileDisplay";
import RecentTweetsDisplay from "./twitter/RecentTweetsDisplay";
import YoutubeVideosDisplay from "./youtube/YoutubeVideosDisplay";
import TikTokDisplay from "./tiktok/TikTokDisplay";
import WikipediaDisplay from "./wikipedia/WikipediaDisplay";
import CrunchbaseDisplay from "./crunchbase/CrunchbaseDisplay";
import PitchBookDisplay from "./pitchbook/PitchBookDisplay";
import TracxnDisplay from "./tracxn/TracxnDisplay";
import FoundersDisplay from "./founders/FoundersDisplay";
import {
  YouTubeSkeleton,
  TikTokSkeleton,
  TwitterSkeleton,
  CompetitorsSkeleton,
  NewsSkeleton,
  FoundersSkeleton,
  WikipediaSkeleton,
  FundingSkeleton,
  CompanySummarySkeleton,
} from "./skeletons/ResearchSkeletons";
import CompanyMindMap from "./mindmap/CompanyMindMap";
import Link from "next/link";

interface Video {
  id: string;
  url: string;
  title: string;
  author: string;
  [key: string]: any;
}

interface Tweet {
  id: string;
  url: string;
  title: string;
  author: string;
  [key: string]: any;
}

interface Competitor {
  title: string;
  url: string;
  summary: string;
  [key: string]: any;
}

interface NewsItem {
  url: string;
  title: string;
  image: string;
  [key: string]: any;
}

interface Founder {
  url: string;
  title: string;
  [key: string]: any;
}

// Add new interface for company map data
interface CompanyMapData {
  companyName: string;
  rootNode: {
    title: string;
    children: Array<{
      title: string;
      description: string;
      children: Array<{
        title: string;
        description: string;
      }>;
    }>;
  };
}

export default function CompanyResearcher() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [companyUrl, setCompanyUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [competitors, setCompetitors] = useState<Competitor[] | null>(null);
  const [news, setNews] = useState<NewsItem[] | null>(null);
  const [companySummary, setCompanySummary] = useState<any>(null);
  const [twitterProfileText, setTwitterProfileText] = useState<any>(null);
  const [recentTweets, setRecentTweets] = useState<Tweet[] | null>(null);
  const [youtubeVideos, setYoutubeVideos] = useState<Video[] | null>(null);
  const [githubUrl, setGithubUrl] = useState<string | null>(null);
  const [fundingData, setFundingData] = useState<any>(null);
  const [financialReport, setFinancialReport] = useState<any>(null);
  const [tiktokData, setTiktokData] = useState<any>(null);
  const [wikipediaData, setWikipediaData] = useState<any>(null);
  const [crunchbaseData, setCrunchbaseData] = useState<any>(null);
  const [pitchbookData, setPitchbookData] = useState<any>(null);
  const [tracxnData, setTracxnData] = useState<any>(null);
  const [founders, setFounders] = useState<Founder[] | null>(null);
  const [companyMap, setCompanyMap] = useState<CompanyMapData | null>(null);

  // Function to check if a string is a valid URL
  const isValidUrl = (url: string): boolean => {
    try {
      // Remove any whitespace
      url = url.trim();

      // Check if it's just a single word without dots
      if (!url.includes(".")) {
        return false;
      }

      // Add protocol if missing
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }

      const urlObj = new URL(url);
      // Check if hostname has at least one dot and no spaces
      return urlObj.hostname.includes(".") && !urlObj.hostname.includes(" ");
    } catch {
      return false;
    }
  };

  // Function to validate and extract domain name from URL
  const extractDomain = (url: string): string | null => {
    try {
      if (!isValidUrl(url)) {
        return null;
      }

      let cleanUrl = url.trim().toLowerCase();

      // Add protocol if missing
      if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
        cleanUrl = "https://" + cleanUrl;
      }

      // Parse URL
      const parsedUrl = new URL(cleanUrl);

      // Get domain without www.
      const domain = parsedUrl.hostname.replace(/^www\./, "");

      // Additional validation: domain should have at least one dot and no spaces
      if (!domain.includes(".") || domain.includes(" ")) {
        return null;
      }

      return domain;
    } catch (error) {
      return null;
    }
  };

  // Function to scrape main page
  const scrapeMainPage = async (url: string) => {
    try {
      const response = await fetch("/api/scrapewebsiteurl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ websiteurl: url }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch main website data");
      }

      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error("Error scraping main page:", error);
      throw error;
    }
  };

  // Function to fetch company details (summary and map)
  const fetchCompanyDetails = async (mainPageData: any, url: string) => {
    try {
      // First fetch subpages
      const subpagesResponse = await fetch("/api/scrapewebsitesubpages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ websiteurl: url }),
      });

      if (!subpagesResponse.ok) {
        throw new Error("Failed to fetch subpages data");
      }

      const subpagesData = await subpagesResponse.json();

      // Then use both main page and subpages data
      await Promise.all([
        fetchCompanySummary(subpagesData.results, mainPageData, url),
        fetchCompanyMap(mainPageData, url),
      ]);
    } catch (error) {
      console.error("Error fetching company details:", error);
      throw error;
    }
  };

  // Update fetchCompetitors to only use main page data
  const fetchCompetitors = async (summary: string, url: string) => {
    try {
      const response = await fetch("/api/findcompetitors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          websiteurl: url,
          summaryText: summary,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch competitors");
      }

      const data = await response.json();
      return data.results.map((result: any) => ({
        title: result.title,
        url: result.url,
        summary: result.summary,
      }));
    } catch (error) {
      console.error("Error fetching competitors:", error);
      throw error;
    }
  };

  // New function to fetch news
  const fetchNews = async (url: string) => {
    try {
      const response = await fetch("/api/findnews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ websiteurl: url }),
      });

      if (!response.ok) {
        throw new Error("News research failed");
      }

      const data = await response.json();
      return data.results.filter((item: any) => item.title).slice(0, 6);
    } catch (error) {
      console.error("Error fetching news:", error);
      throw error;
    }
  };

  // Separate function for fetching company summary
  const fetchCompanySummary = async (
    subpages: any,
    mainpage: any,
    websiteurl: string
  ) => {
    try {
      const response = await fetch("/api/companysummary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subpages,
          mainpage,
          websiteurl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch company summary");
      }

      const data = await response.json();
      setCompanySummary(data.result);
    } catch (error) {
      console.error("Error fetching company summary:", error);
      setErrors((prev) => ({
        ...prev,
        summary:
          error instanceof Error
            ? error.message
            : "An error occurred with company summary",
      }));
    }
  };

  // New function for fetching company map
  const fetchCompanyMap = async (mainpage: any, websiteurl: string) => {
    try {
      const response = await fetch("/api/companymap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mainpage,
          websiteurl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch company map");
      }

      const data = await response.json();
      setCompanyMap(data.result);
    } catch (error) {
      console.error("Error fetching company map:", error);
      setErrors((prev) => ({
        ...prev,
        map:
          error instanceof Error
            ? error.message
            : "An error occurred with company map",
      }));
    }
  };

  // Recent tweets fetch function
  const fetchRecentTweets = async (username: string) => {
    try {
      const response = await fetch("/api/scraperecenttweets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch recent tweets");
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("Error fetching recent tweets:", error);
      throw error;
    }
  };

  // Twitter profile fetch function
  const fetchTwitterProfile = async (url: string) => {
    try {
      const response = await fetch("/api/scrapetwitterprofile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ websiteurl: url }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Twitter profile");
      }

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        // Fetch tweets separately without waiting
        if (result.author) {
          fetchRecentTweets(result.author)
            .then((tweets) => setRecentTweets(tweets))
            .catch((error) =>
              console.error("Error fetching recent tweets:", error)
            );
        }
        return {
          text: result.text,
          username: result.author,
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching Twitter profile:", error);
      throw error;
    }
  };
  // Youtube videos fetch function
  const fetchYoutubeVideos = async (url: string) => {
    try {
      const response = await fetch("/api/fetchyoutubevideos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ websiteurl: url }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch YouTube videos");
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("Error fetching YouTube videos:", error);
      throw error;
    }
  };

  // Reddit posts fetch function
  const fetchRedditPosts = async (url: string) => {
    try {
      const response = await fetch("/api/scrapereddit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ websiteurl: url }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Reddit posts");
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("Error fetching Reddit posts:", error);
      throw error;
    }
  };

  // GitHub URL fetch function
  const fetchGitHubUrl = async (url: string) => {
    try {
      const response = await fetch("/api/fetchgithuburl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ websiteurl: url }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch GitHub URL");
      }

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].url;
      }
      return null;
    } catch (error) {
      console.error("Error fetching GitHub URL:", error);
      throw error;
    }
  };

  // Funding API fetch function
  const fetchFunding = async (url: string) => {
    try {
      const response = await fetch("/api/fetchfunding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ websiteurl: url }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch funding data");
      }

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0];
      }
      return null;
    } catch (error) {
      console.error("Error fetching funding data:", error);
      throw error;
    }
  };

  // Financial report fetch function
  const fetchFinancialReport = async (url: string) => {
    try {
      const response = await fetch("/api/fetchfinancialreport", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ websiteurl: url }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch financial report");
      }

      const data = await response.json();
      return data.results || null;
    } catch (error) {
      console.error("Error fetching financial report:", error);
      throw error;
    }
  };

  // TikTok fetch function
  const fetchTikTokProfile = async (url: string) => {
    try {
      const response = await fetch("/api/fetchtiktok", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ websiteurl: url }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch TikTok profile");
      }

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0];
      }
      return null;
    } catch (error) {
      console.error("Error fetching TikTok profile:", error);
      throw error;
    }
  };

  // Wikipedia fetch function
  const fetchWikipedia = async (url: string) => {
    try {
      const response = await fetch("/api/fetchwikipedia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ websiteurl: url }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Wikipedia data");
      }

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return {
          text: data.results[0].text,
          url: data.results[0].url,
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching Wikipedia data:", error);
      throw error;
    }
  };

  // Crunchbase fetch function
  const fetchCrunchbase = async (url: string) => {
    try {
      const response = await fetch("/api/fetchcrunchbase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ websiteurl: url }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Crunchbase data");
      }

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0];
      }
      return null;
    } catch (error) {
      console.error("Error fetching Crunchbase data:", error);
      throw error;
    }
  };

  // PitchBook fetch function
  const fetchPitchbook = async (url: string) => {
    try {
      const response = await fetch("/api/fetchpitchbook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ websiteurl: url }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch PitchBook data");
      }

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0];
      }
      return null;
    } catch (error) {
      console.error("Error fetching PitchBook data:", error);
      throw error;
    }
  };

  // Tracxn fetch function
  const fetchTracxn = async (url: string) => {
    try {
      const response = await fetch("/api/fetchtracxn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ websiteurl: url }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Tracxn data");
      }

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0];
      }
      return null;
    } catch (error) {
      console.error("Error fetching Tracxn data:", error);
      throw error;
    }
  };

  // Founders fetch function
  const fetchFounders = async (url: string) => {
    try {
      const response = await fetch("/api/fetchfounders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ websiteurl: url }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch founders");
      }

      const data = await response.json();
      // Filter out company and post URLs, only keep individual profiles
      return data.results.filter(
        (result: any) =>
          !result.url.includes("/company/") &&
          !result.url.includes("/post/") &&
          result.url.includes("/in/")
      );
    } catch (error) {
      console.error("Error fetching founders:", error);
      throw error;
    }
  };


  // Add helper function to parse company size
  const parseCompanySize = (size: string): number => {
    if (!size) return 0;
    // Extract first number from string (e.g. "1,001-5,000" -> 1001)
    const match = size.match(/(\d+(?:,\d+)*)/);
    if (!match) return 0;
    return parseInt(match[1].replace(/,/g, ""));
  };

  // Main Research Function
  const handleResearch = async (e: FormEvent) => {
    e.preventDefault();

    if (!companyUrl) {
      setErrors({ form: "Please enter a company URL" });
      return;
    }

    const domainName = extractDomain(companyUrl);

    if (!domainName) {
      setErrors({ form: "Please enter a valid company URL ('example.com')" });
      return;
    }

    setIsGenerating(true);
    setErrors({});

    // Reset all states to null
    setCompetitors(null);
    setNews(null);
    setCompanySummary(null);
    setTwitterProfileText(null);
    setRecentTweets(null);
    setYoutubeVideos(null);
    setGithubUrl(null);
    setFundingData(null);
    setFinancialReport(null);
    setTiktokData(null);
    setWikipediaData(null);
    setCrunchbaseData(null);
    setPitchbookData(null);
    setTracxnData(null);
    setFounders(null);
    setCompanyMap(null);

    try {
      // Run all API calls in parallel
      const promises = [
        // Main page scraping and dependent calls
        (async () => {
          const mainPageData = await scrapeMainPage(domainName);
          if (mainPageData && mainPageData[0]?.summary) {
            await Promise.all([
              fetchCompanyDetails(mainPageData, domainName).catch((error) =>
                setErrors((prev) => ({
                  ...prev,
                  companyDetails:
                    error instanceof Error
                      ? error.message
                      : "An error occurred with company details",
                }))
              ),
              fetchCompetitors(mainPageData[0].summary, domainName)
                .then((data) => setCompetitors(data))
                .catch((error) =>
                  setErrors((prev) => ({
                    ...prev,
                    competitors:
                      error instanceof Error
                        ? error.message
                        : "An error occurred with competitors",
                  }))
                ),
            ]);
          }
        })().catch((error) =>
          setErrors((prev) => ({
            ...prev,
            websiteData:
              error instanceof Error
                ? error.message
                : "An error occurred with website data",
          }))
        ),


        fetchNews(domainName)
          .then((data) => setNews(data))
          .catch((error) =>
            setErrors((prev) => ({
              ...prev,
              news:
                error instanceof Error
                  ? error.message
                  : "An error occurred with news",
            }))
          ),

        fetchTwitterProfile(domainName)
          .then((data) => setTwitterProfileText(data))
          .catch((error) =>
            setErrors((prev) => ({
              ...prev,
              twitter:
                error instanceof Error
                  ? error.message
                  : "An error occurred with Twitter profile",
            }))
          ),

        fetchYoutubeVideos(domainName)
          .then((data) => setYoutubeVideos(data))
          .catch((error) =>
            setErrors((prev) => ({
              ...prev,
              youtube:
                error instanceof Error
                  ? error.message
                  : "An error occurred with YouTube videos",
            }))
          ),

        fetchGitHubUrl(domainName)
          .then((url) => setGithubUrl(url))
          .catch((error) =>
            setErrors((prev) => ({
              ...prev,
              github:
                error instanceof Error
                  ? error.message
                  : "An error occurred with GitHub",
            }))
          ),

        fetchFunding(domainName)
          .then((data) => setFundingData(data))
          .catch((error) =>
            setErrors((prev) => ({
              ...prev,
              funding:
                error instanceof Error
                  ? error.message
                  : "An error occurred with funding data",
            }))
          ),

        fetchFinancialReport(domainName)
          .then((data) => setFinancialReport(data))
          .catch((error) =>
            setErrors((prev) => ({
              ...prev,
              financial:
                error instanceof Error
                  ? error.message
                  : "An error occurred with financial report",
            }))
          ),

        fetchTikTokProfile(domainName)
          .then((data) => setTiktokData(data))
          .catch((error) =>
            setErrors((prev) => ({
              ...prev,
              tiktok:
                error instanceof Error
                  ? error.message
                  : "An error occurred with TikTok profile",
            }))
          ),

        fetchWikipedia(domainName)
          .then((data) => setWikipediaData(data))
          .catch((error) =>
            setErrors((prev) => ({
              ...prev,
              wikipedia:
                error instanceof Error
                  ? error.message
                  : "An error occurred with Wikipedia data",
            }))
          ),

        fetchCrunchbase(domainName)
          .then((data) => setCrunchbaseData(data))
          .catch((error) =>
            setErrors((prev) => ({
              ...prev,
              crunchbase:
                error instanceof Error
                  ? error.message
                  : "An error occurred with Crunchbase data",
            }))
          ),

        fetchPitchbook(domainName)
          .then((data) => setPitchbookData(data))
          .catch((error) =>
            setErrors((prev) => ({
              ...prev,
              pitchbook:
                error instanceof Error
                  ? error.message
                  : "An error occurred with PitchBook data",
            }))
          ),

        fetchTracxn(domainName)
          .then((data) => setTracxnData(data))
          .catch((error) =>
            setErrors((prev) => ({
              ...prev,
              tracxn:
                error instanceof Error
                  ? error.message
                  : "An error occurred with Tracxn data",
            }))
          ),

        fetchFounders(domainName)
          .then((data) => setFounders(data))
          .catch((error) =>
            setErrors((prev) => ({
              ...prev,
              founders:
                error instanceof Error
                  ? error.message
                  : "An error occurred with founders",
            }))
          ),
      ];

      await Promise.allSettled(promises);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-5xl p-6 z-10 mb-20 mt-6 text-neutral-200">
      <h1 className="md:text-6xl text-4xl pb-5 font-medium opacity-0 fade-up text-white">
        <span className="text-blue-400"> Company </span>
        Researcher
      </h1>

      <p className="text-neutral-300 mb-12 opacity-0 fade-up">
        Enter a company URL for detailed research info. Instantly know any
        company inside out.
      </p>

      <form onSubmit={handleResearch} className="space-y-6 mb-20">
        <input
          value={companyUrl}
          onChange={(e) => setCompanyUrl(e.target.value)}
          placeholder="Enter Company URL (e.g., example.com)"
          className="w-full bg-zinc-900 text-white placeholder-neutral-500 p-3 border border-zinc-700 box-border outline-none rounded-sm ring-1 ring-zinc-700 focus:ring-blue-500 resize-none opacity-0 fade-up"
        />
        <button
          type="submit"
          className={`w-full text-white font-semibold px-2 py-2 rounded-sm transition-opacity opacity-0 fade-up min-h-[50px] ${
            isGenerating
              ? "bg-zinc-600 cursor-not-allowed"
              : "bg-brand-default hover:bg-brand-default/90 ring-1 ring-brand-default"
          } transition-colors`}
          disabled={isGenerating}
        >
          {isGenerating ? "Researching..." : "Research Now"}
        </button>
      </form>

      {Object.entries(errors).map(([key, message]) => (
        <div
          key={key}
          className="mt-4 mb-4 p-3 bg-red-900/20 border border-red-500/50 text-red-400 rounded-sm"
        >
          {message}
        </div>
      ))}

      <div className="space-y-12">
        {/* Company Overview Section */}

        <div className="space-y-16">
          {(
            companySummary ||
            founders ||
            financialReport ||
            fundingData ||
            crunchbaseData ||
            pitchbookData ||
            tracxnData ||
            wikipediaData ||
            competitors ||
            news ||
            isGenerating) && (
            <div className="flex items-center">
              <h2 className="text-4xl font-medium text-white">
                Company Overview
              </h2>
            </div>
          )}

          {isGenerating && founders === null ? (
            <FoundersSkeleton />
          ) : (
            founders &&
            founders.length > 0 && (
              <div className="opacity-0 fade-up">
                <FoundersDisplay founders={founders} />
              </div>
            )
          )}

          <div className="space-y-6">
            {isGenerating && fundingData === null ? (
              <FundingSkeleton />
            ) : (
              fundingData && (
                <div className="opacity-0 fade-up">
                  <FundingDisplay fundingData={fundingData} />
                </div>
              )
            )}

            {isGenerating && crunchbaseData === null ? (
              <FundingSkeleton />
            ) : (
              crunchbaseData && (
                <div className="opacity-0 fade-up">
                  <CrunchbaseDisplay data={crunchbaseData} />
                </div>
              )
            )}

            {isGenerating && pitchbookData === null ? (
              <FundingSkeleton />
            ) : (
              pitchbookData && (
                <div className="opacity-0 fade-up">
                  <PitchBookDisplay data={pitchbookData} />
                </div>
              )
            )}

            {isGenerating && tracxnData === null ? (
              <FundingSkeleton />
            ) : (
              tracxnData && (
                <div className="opacity-0 fade-up">
                  <TracxnDisplay data={tracxnData} />
                </div>
              )
            )}
          </div>

          {isGenerating && wikipediaData === null ? (
            <WikipediaSkeleton />
          ) : (
            wikipediaData && (
              <div className="opacity-0 fade-up">
                <WikipediaDisplay
                  data={wikipediaData}
                  websiteUrl={companyUrl}
                />
              </div>
            )
          )}

          {isGenerating && competitors === null ? (
            <CompetitorsSkeleton />
          ) : (
            competitors &&
            competitors.length > 0 && (
              <div className="opacity-0 fade-up">
                <CompetitorsDisplay competitors={competitors} />
              </div>
            )
          )}

          {isGenerating && news === null ? (
            <NewsSkeleton />
          ) : (
            news &&
            news.length > 0 && (
              <div className="opacity-0 fade-up">
                <NewsDisplay news={news} />
              </div>
            )
          )}
        </div>

        {/* Company Socials Section */}
        <div className="space-y-16 pt-12">
          {(twitterProfileText ||
            youtubeVideos ||
            tiktokData ||
            githubUrl ||
            isGenerating) && (
            <div className="flex items-center">
              <h2 className="text-4xl font-medium text-white">
                Company Socials
              </h2>
            </div>
          )}

          {isGenerating && twitterProfileText === null ? (
            <TwitterSkeleton />
          ) : (
            twitterProfileText && (
              <div className="opacity-0 fade-up">
                <ProfileDisplay
                  rawText={twitterProfileText.text}
                  username={twitterProfileText.username}
                />
                {recentTweets && <RecentTweetsDisplay tweets={recentTweets} />}
              </div>
            )
          )}

          {isGenerating && youtubeVideos === null ? (
            <YouTubeSkeleton />
          ) : (
            youtubeVideos &&
            youtubeVideos.length > 0 && (
              <div className="opacity-0 fade-up">
                <YoutubeVideosDisplay videos={youtubeVideos} />
              </div>
            )
          )}


          {isGenerating && tiktokData === null ? (
            <TikTokSkeleton />
          ) : (
            tiktokData && (
              <div className="opacity-0 fade-up">
                <TikTokDisplay data={tiktokData} />
              </div>
            )
          )}

        </div>

        {/* Summary and Mind Map Section */}
        {(isGenerating || companySummary || companyMap) && (
          <div className="space-y-8">
            <div className="flex items-center">
              <h2 className="text-3xl font-medium mt-6 text-white">
                Summary and Mind Map
              </h2>
            </div>

            {isGenerating && companySummary === null ? (
              <CompanySummarySkeleton />
            ) : (
              companySummary && (
                <div className="opacity-0 fade-up">
                  <CompanySummary summary={companySummary} />
                </div>
              )
            )}

            {isGenerating && companyMap === null ? (
              <div className="hidden sm:block animate-pulse">
                <div className="h-64 bg-zinc-800 rounded-lg flex items-center justify-center">
                  <p className="text-neutral-500 text-md">
                    Loading Mind Map...
                  </p>
                </div>
              </div>
            ) : (
              companyMap && (
                <div className="hidden sm:block opacity-0 fade-up">
                  <CompanyMindMap data={companyMap} />
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
