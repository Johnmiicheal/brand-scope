/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import { useEffect, useState, useRef, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Brand,
  BrandDataProvider,
  useBrandData,
} from "@/contexts/brand-data-context";
import { LoadingState } from "@/components/loading-state";
import ShinyText from "@/components/ui/shiny-text";
import { motion, AnimatePresence } from "framer-motion";
import { MetricsHeader } from "@/components/dashboard/metrics-card";
import { KeywordCloud } from "@/components/dashboard/keyword-cloud";
import { CompetitorNetwork } from "@/components/dashboard/competitor-network";
import { BrandInsights } from "@/components/dashboard/insights-card";
import Image from "next/image";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import {
  Blocks,
  Check,
  CheckCircle,
  ChevronDown,
  Clock9,
  CloudUpload,
  Info,
  RefreshCcw,
  Settings,
  SquareArrowOutUpRight,
  Star,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import {
  ScheduledQueriesList,
  ScheduledQuery,
} from "@/components/library/scheduled-queries-list";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckoutButton } from "@/components/stripe/checkout-button";
import { CheckoutSuccess } from "@/components/stripe/checkout-success";
import { stripe } from "@/lib/stripe";
import { QueryCounter } from "@/components/dashboard/query-counter";
import Stripe from "stripe";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GoogleResults } from "@/components/ui/google-results";
import { Gemini } from "@lobehub/icons";
import { toast } from "sonner";
import { TbStarFilled } from "react-icons/tb";

const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Retail",
  "Food & Beverage",
  "Travel",
  "Entertainment",
  "Education",
  "Real Estate",
  "Manufacturing",
  "Automotive",
  "Energy",
  "Telecommunications",
];

// Define props for the new table component
interface IndustryRankingsTableProps {
  brands: {
    brand_name: string;
    gpt_mentions: number;
    gpt_search_mentions: number;
    claude_mentions: number;
    perplexity_mentions: number;
    gemini_mentions: number;
    total_mentions: number;
  }[];
  setSelectedBrand: (brand: Set<string>) => void;
  selectedBrand: Set<string>;
  selectedModel: Set<string>;
}

// Updated component for the Industry Rankings Table
function IndustryRankingsTable({
  brands,
  setSelectedBrand,
  selectedBrand,
  selectedModel,
}: IndustryRankingsTableProps) {
  if (!brands) return null;
  const all_total_mentions = brands.reduce(
    (acc, brand) => acc + brand.total_mentions,
    0
  );

  const maxMentions = Math.max(...brands.map((brand) => brand.total_mentions));
  const maxModels = selectedModel.size === 0 ? 5 : selectedModel.size;
  const getCoverageRatio = (brand: any, type: "ratio" | "count") => {
    const totalMentionsPerModel =
      (brand.gpt_mentions > 0 ? 1 : 0) +
      (brand.claude_mentions > 0 ? 1 : 0) +
      (brand.perplexity_mentions > 0 ? 1 : 0) +
      (brand.gemini_mentions > 0 ? 1 : 0) +
      (brand.gpt_search_mentions > 0 ? 1 : 0);
    if (type === "ratio") {
      return `${totalMentionsPerModel} / ${maxModels}`;
    } else {
      return (totalMentionsPerModel / maxModels).toFixed(2);
    }
  };
  const getMentionsIndex = (brand: any) => {
    return brand.total_mentions / maxMentions;
  };
  return (
    <Card className="bg-background shadow-none border-[#e2e2e2]/70 dark:border-accent text-white">
      <CardHeader>
        <CardTitle className="text-black dark:text-white">
          Brand Ranking
        </CardTitle>
        <CardDescription>Brands ranked by visibility score</CardDescription>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow className="border-[#e2e2e2]/40 dark:border-accent">
                  <TableHead className="w-[100px] sticky top-0 bg-background">
                    Rank
                  </TableHead>
                  <TableHead className="bg-background !w-fit">Entity</TableHead>
                  <TableHead className="sticky top-0 bg-background">
                    <span className="flex items-center gap-2">
                      Coverage
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-4 h-4 text-accent-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              This measures the ratio of models that mentioned
                              <br /> the entity in the summaries.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                  </TableHead>
                  <TableHead className="sticky top-0 bg-background">
                    Visibility %
                  </TableHead>
                  <TableHead className="sticky top-0 bg-background">
                    Mentions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground"
                    >
                      No ranking data available yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  brands.map((entity, index) => (
                    <TableRow
                      key={index}
                      className="dark:text-white text-black border-[#e2e2e2]/40 dark:border-accent cursor-pointer"
                      onClick={() => {
                        setSelectedBrand(new Set([entity.brand_name]));
                        toast.info(`You have selected ${entity.brand_name}`);
                      }}
                    >
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="flex items-center gap-2">
                        <div className="whitespace-normal break-words max-w-[150px]">
                          {entity.brand_name}{" "}
                          {selectedBrand.has(entity.brand_name) ? (
                            <TbStarFilled className="inline w-4 h-4 text-yellow-500" />
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        ⌀ {getCoverageRatio(entity, "ratio")}
                      </TableCell>
                      <TableCell>
                        {(
                          (100 *
                            (Number(getCoverageRatio(entity, "count")) +
                              getMentionsIndex(entity))) /
                          2
                        ).toFixed(1)}
                        %
                      </TableCell>
                      <TableCell>{entity.total_mentions}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </motion.div>
      </CardContent>
    </Card>
  );
}

interface UserSubscription {
  id: string;
  user_id: string;
  subscription_plan_id: string;
  stripe_subscription_id: string;
  status: string;
  query_count: number;
  monitoring_count: number;
  created_at: string;
  updated_at: string;
}

function DashboardContent() {
  const router = useRouter();
  // All state declarations at the top
  const [sessionKey, setSessionKey] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null
  );
  const [product, setProduct] = useState<Stripe.Product | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<ScheduledQuery | null>(
    null
  );
  const [currentTime, setCurrentTime] = useState(new Date());
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandWebsite, setBrandWebsite] = useState("");
  const [brandIndustry, setBrandIndustry] = useState("");
  const [brandLogo, setBrandLogo] = useState<File | null>(null);
  const [brandLogoPreview, setBrandLogoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [subsLoading, setSubsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<Set<string>>(
    new Set<string>([])
  );
  const [googleSearchResults, setGoogleSearchResults] = useState<any>(null);
  const [loadingGoogleResults, setLoadingGoogleResults] = useState(false);
  const [showGoogleResults, setShowGoogleResults] = useState(true);

  // const fetchBrands = async () => {
  //   try {
  //     setIsLoading(true);

  //     // Get current user
  //     const {
  //       data: { user },
  //     } = await supabase.auth.getUser();

  //     if (!user) {
  //       console.error("No authenticated user found");
  //       setIsLoading(false);
  //       return;
  //     }

  //     // Fetch brands where user_id matches and website and logo are not empty
  //     const { data, error } = await supabase
  //       .from("brands")
  //       .select("*")
  //       .eq("user_id", user.id)
  //       .not("website", "is", null)
  //       .not("logo_url", "is", null);

  //     if (error) {
  //       console.error("Error fetching brands:", error);
  //       setIsLoading(false);
  //       return;
  //     }

  //     setBrands(data || []);

  //     // Set the first brand as selected if available
  //     if (data && data.length > 0) {
  //       setSelectedBrand(data[0]);
  //     } else {
  //       // Show brand creation modal if no valid brands exist
  //       setShowBrandModal(true);
  //     }

  //     setIsLoading(false);
  //   } catch (error) {
  //     console.error("Error:", error);
  //     setIsLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   fetchBrands();
  // }, []);

  // Plans configuration
  const plans = [
    // {
    //   id: "free",
    //   name: "Free Trial",
    //   price: "$0",
    //   features: [
    //     "Country Monitoring",
    //     "Company Research",
    //     "SEO Keyword Analysis",
    //     "Brand Analysis",
    //   ],
    //   searches: "5 Searches",
    //   monitoring: "0 Monitoring",
    //   frequency: "N/A",
    //   recommended: false,
    //   product_id: "",
    // },
    {
      id: "pro",
      name: "Pro Plan",
      price: "$29/month",
      features: [
        "Country Monitoring",
        "Company Research",
        "SEO Keyword Analysis",
        "Brand Analysis",
      ],
      searches: "30 Searches",
      monitoring: "10 Monitoring",
      frequency: "(Weekly only)",
      recommended: false,
      product_id: "price_1RRP3EFQrMIDoBVCh5GyR8s6",
    },
    {
      id: "plus",
      name: "Plus Plan",
      price: "$189/month",
      features: [
        "Country Monitoring",
        "Company Research",
        "SEO Keyword Analysis",
        "Brand Analysis",
      ],
      searches: "300 Searches",
      monitoring: "100 Monitoring",
      frequency: "(Daily + Weekly)",
      recommended: true,
      product_id: "price_1RRfOsFQrMIDoBVCpnaAjkZX",
    },
    {
      id: "premium",
      name: "Premium Plan",
      price: "$300/month",
      features: [
        "Country Monitoring",
        "Company Research",
        "SEO Keyword Analysis",
        "Brand Analysis",
      ],
      searches: "900 Searches",
      monitoring: "300 Monitoring",
      frequency: "(Daily + Weekly)",
      recommended: false,
      product_id: "price_1RRtvLFQrMIDoBVCxNAAW9sM",
    },
  ];

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      setSubsLoading(true);
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        setUser(null);
        setSubscription(null);
        setSubsLoading(false);
        return;
      }

      if (!session) {
        if (window.location.pathname !== "/login") {
          router.push("/login");
        }
        setUser(null);
        setSubscription(null);
        setSubsLoading(false);
      } else {
        setSessionKey(session.access_token || "");
        setUser(session.user);
        setSubsLoading(false);
        // Check subscription immediately after setting user
        if (!subscription) {
          await checkSubs(session.user);
        }
      }
    };

    const checkSubs = async (currentUser: User | null) => {
      if (!currentUser) return;
      setSubsLoading(true);
      try {
        const { data: fetchedSubscriptionData, error: subscriptionError } =
          await supabase
            .from("user_subscriptions")
            .select("*")
            .eq("user_id", currentUser.id)
            .single();

        if (subscriptionError) {
          if (subscriptionError.code === "PGRST116") {
            setSubscription(null);
          } else {
            setSubscription(null);
          }
          setSubsLoading(false);
        } else {
          setSubscription(
            fetchedSubscriptionData as unknown as UserSubscription
          );
          const stripePrice = await stripe.prices.retrieve(
            fetchedSubscriptionData.price_id as string
          );
          const stripeProduct = await stripe.products.retrieve(
            stripePrice.product as string
          );
          setProduct(stripeProduct);
          setSubsLoading(false);
        }
      } catch (e) {
        setSubscription(null);
      } finally {
        setSubsLoading(false);
      }
    };

    checkAuth();
  }, [router, subscription]);

  // Function to fetch scheduled queries for the dashboard
  const [queries, setQueries] = useState<ScheduledQuery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  useEffect(() => {
    async function fetchScheduledQueries() {
      if (!user) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/monitoring?user_id=${user?.id}`);

        if (!response.ok) {
          setError(
            `We could not fetch your scheduled queries. Please try again later.`
          );
          throw new Error(
            `Error fetching scheduled queries: ${response.statusText}`
          );
        }

        const data = await response.json();

        if (data && data.monitoring) {
          setQueries(data.monitoring);
          setSelectedQuery(data.monitoring[0]);
          setIsLoading(false);
        } else {
          setQueries([]);
          setIsLoading(false);
        }
      } catch (error) {
        setError(
          `We could not fetch your scheduled queries. Please try again later.`
        );
        setIsLoading(false);
        console.error("Failed to fetch scheduled queries:", error);
        toast({
          title: "Error",
          description:
            "Failed to load scheduled queries. Please try again later.",
          variant: "destructive",
        });
        setQueries([]);
      } finally {
        setLoading(false);
      }
    }

    fetchScheduledQueries();
  }, [toast, user]);

  const [isExpanded, setIsExpanded] = useState(false);

  const results = selectedQuery?.results;
  const keywords = results?.[0]?.keyword_analysis?.keywords;
  const [analysis_brands, setAnalysisBrands] = useState<any[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(
    new Set<string>([])
  );

  const handleCheckedChange = (brandName: string, isChecked: boolean) => {
    setSelectedBrands((prevSelected) => {
      const newSelection = new Set(prevSelected);

      if (brandName === "all") {
        if (isChecked) {
          newSelection.clear();
          newSelection.add("all");
        } else {
          newSelection.delete("all");
          // Optional: if unchecking "all" and the list is empty,
          // and you want to ensure at least one "default" state like "all"
          // if (newSelection.size === 0 && analysis_brands.length > 0) {
          //   newSelection.add("all"); // Or leave empty for "no selection"
          // }
        }
      } else {
        // Handle individual brand selection
        if (isChecked) {
          newSelection.add(brandName);
          // If "all" was selected, unselect it as we are now specific
          if (newSelection.has("all")) {
            newSelection.delete("all");
          }
        } else {
          newSelection.delete(brandName);
        }

        // Optional: if all individual brands are selected, automatically select "all"
        // const allIndividualBrandsSelected = analysis_brands.every(brand => newSelection.has(brand.name));
        // if (allIndividualBrandsSelected && analysis_brands.length > 0) {
        //   newSelection.clear();
        //   newSelection.add("all");
        // }

        // Optional: if the selection becomes empty (and not due to unchecking "all"), select "all"
        if (newSelection.size === 0 && analysis_brands.length > 0) {
          newSelection.add("all"); // Default to "all" if empty
        }
      }
      return newSelection;
    });
  };

  const getDisplayValue = () => {
    if (selectedBrands.has("all")) {
      return "All Brands";
    }
    if (selectedBrands.size === 0) {
      return "Select brand(s)";
    }
    if (selectedBrands.size === 1) {
      return Array.from(selectedBrands)[0];
    }
    return `${selectedBrands.size} brands selected`;
  };
  // console.log("Selected Brands: ", selectedBrands);

  const analysis_dates = useMemo(() => {
    if (!results || !Array.isArray(results)) return [];
    return [
      ...new Set(
        results.map((result: { analysis_date: string }) => result.analysis_date)
      ),
    ];
  }, [results]);
  // console.log("Analysis Dates: ", analysis_dates)

  const analysis_models = useMemo(() => {
    if (!results || !Array.isArray(results)) return [];
    const allModels = results?.flatMap(
      (result: { model_results: { llm_name: string }[] }) =>
        result.model_results?.map((r: { llm_name: string }) => r.llm_name) || []
    );
    return [...new Set(allModels)];
  }, [results]);

  // Filter analysis brands based on selected date and model
  const filteredAnalysisBrands = useMemo(() => {
    if (!results || !Array.isArray(results)) return [];

    // Filter results based on selected date
    const dateFilteredResults =
      selectedDate === "latest"
        ? results
        : results.filter((result) => result.analysis_date === selectedDate);

    // Extract brands from the date-filtered results, considering model filter
    const filteredBrands = dateFilteredResults
      .flatMap((result) =>
        result.model_results
          // Filter by model if specific models are selected
          ?.filter(
            (modelResult: { llm_name: string }) =>
              selectedModel.size === 0 ||
              selectedModel.has(modelResult.llm_name)
          )
          // Extract brands from filtered model results
          .flatMap(
            (modelResult: { llm_name: string; data: { brands: any[] } }) =>
              modelResult.data?.brands || []
          )
      )
      .filter(Boolean);

    // Create a map to deduplicate brands by id
    const brandMap = new Map();
    filteredBrands.forEach((brand) => {
      if (brand && brand.name) {
        brandMap.set(brand.name, brand);
      }
    });

    // Convert map values back to array
    return Array.from(brandMap.values());
  }, [results, selectedDate, selectedModel]);

  const allAnalysisBrands = useMemo(() => {
    if (!results || !Array.isArray(results)) return [];
    const allBrands = results
      .flatMap(
        (result: {
          model_results: { llm_name: string; data: { brands: any[] } }[];
        }) =>
          result.model_results?.flatMap(
            (r: { llm_name: string; data: { brands: any[] } }) =>
              r.data?.brands || []
          )
      )
      .filter(Boolean);

    // Deduplicate based on brand name
    const uniqueBrands = new Map();
    allBrands.forEach((brand) => {
      if (brand.name && !uniqueBrands.has(brand.name)) {
        uniqueBrands.set(brand.name, brand);
      }
    });

    return Array.from(uniqueBrands.values());
  }, [results]);

  // Calculate brand mentions in model summaries
  const temportalBrandMentionsInSummaries = useMemo(() => {
    if (
      !results ||
      !Array.isArray(results) ||
      !analysis_brands ||
      analysis_brands.length === 0
    ) {
      return [];
    }

    // Initialize an array to store brand mentions for each date
    const brandMentionsArray: any[] = [];

    // Process each result (which represents a different analysis date)
    results.forEach((result) => {
      // Initialize a map for this date's brand mentions
      const brandMentionsMap = new Map();

      // Process each brand
      analysis_brands.forEach((brand) => {
        const brandName = brand.name;
        const mentions = {
          gpt_mentions: 0,
          claude_mentions: 0,
          perplexity_mentions: 0,
          gemini_mentions: 0,
          gpt_search_mentions: 0,
        };

        // Process model results for this date
        result.model_results?.forEach(
          (modelResult: { llm_name: string; data: { brands: any[] } }) => {
            const modelName = modelResult.llm_name.toLowerCase();

            // Filter by model if specific models are selected
            if (
              selectedModel.size > 0 &&
              !selectedModel.has(modelResult.llm_name)
            ) {
              return;
            }

            // Count mentions in brand data
            const brandData = modelResult.data?.brands?.find(
              (b) => b.name === brandName
            );
            if (brandData) {
              let mentionCount = 1; // Count direct mention in brand analysis

              // Add mentions from reasoning if available
              if (brandData.reasoning) {
                const reasoningMatches = brandData.reasoning.match(
                  new RegExp(`\\b${brandName}\\b`, "gi")
                );
                if (reasoningMatches) {
                  mentionCount += reasoningMatches.length;
                }
              }

              // Assign mentions to the appropriate model
              if (modelName.includes("4.1")) {
                mentions.gpt_mentions += mentionCount;
              } else if (modelName.includes("claude")) {
                mentions.claude_mentions += mentionCount;
              } else if (modelName.includes("perplexity")) {
                mentions.perplexity_mentions += mentionCount;
              } else if (modelName.includes("gemini")) {
                mentions.gemini_mentions += mentionCount;
              } else if (modelName.includes("search")) {
                mentions.gpt_search_mentions += mentionCount;
              }
            }
          }
        );

        const total_mentions = Object.values(mentions).reduce(
          (sum, count) => sum + count,
          0
        );

        if (total_mentions > 0) {
          brandMentionsMap.set(brandName, {
            brand_name: brandName,
            analysis_date: result.analysis_date,
            ...mentions,
            total_mentions,
          });
        }
      });

      // Add this date's brand mentions to the array
      brandMentionsArray.push(...Array.from(brandMentionsMap.values()));
    });

    // Sort by date and then by total mentions within each date
    return brandMentionsArray.sort((a, b) => {
      const dateCompare =
        new Date(a.analysis_date).getTime() -
        new Date(b.analysis_date).getTime();
      if (dateCompare === 0) {
        return b.total_mentions - a.total_mentions;
      }
      return dateCompare;
    });
  }, [results, analysis_brands, selectedModel]);

  // Calculate brand mentions in model summaries
  const brandMentionsInSummaries = useMemo(() => {
    if (
      !results ||
      !Array.isArray(results) ||
      !analysis_brands ||
      analysis_brands.length === 0
    ) {
      return [];
    }

    // Filter results based on selected date (same logic as filteredAnalysisBrands)
    const dateFilteredResults =
      selectedDate === "latest" || selectedDate === ""
        ? results
        : results.filter((result) => result.analysis_date === selectedDate);

    // Initialize a map to store brand mentions
    const brandMentionsMap = new Map();

    // Process each brand
    analysis_brands.forEach((brand) => {
      const brandName = brand.name;
      const mentions = {
        gpt_mentions: 0,
        claude_mentions: 0,
        perplexity_mentions: 0,
        gemini_mentions: 0,
        gpt_search_mentions: 0,
      };

      // Process each filtered result
      dateFilteredResults.forEach((result) => {
        result.model_results?.forEach(
          (modelResult: { llm_name: string; data: { brands: any[] } }) => {
            const modelName = modelResult.llm_name.toLowerCase();

            // Filter by model if specific models are selected
            if (
              selectedModel.size > 0 &&
              !selectedModel.has(modelResult.llm_name)
            ) {
              return;
            }

            // Count mentions in brand data
            const brandData = modelResult.data?.brands?.find(
              (b) => b.name === brandName
            );
            if (brandData) {
              let mentionCount = 1; // Count direct mention in brand analysis

              // Add mentions from reasoning if available
              if (brandData.reasoning) {
                const reasoningMatches = brandData.reasoning.match(
                  new RegExp(`\\b${brandName}\\b`, "gi")
                );
                if (reasoningMatches) {
                  mentionCount += reasoningMatches.length;
                }
              }

              // Assign mentions to the appropriate model
              if (modelName.includes("4.1")) {
                mentions.gpt_mentions += mentionCount;
              } else if (modelName.includes("claude")) {
                mentions.claude_mentions += mentionCount;
              } else if (modelName.includes("perplexity")) {
                mentions.perplexity_mentions += mentionCount;
              } else if (modelName.includes("gemini")) {
                mentions.gemini_mentions += mentionCount;
              } else if (modelName.includes("search")) {
                mentions.gpt_search_mentions += mentionCount;
              }
            }
          }
        );
      });

      const total_mentions = Object.values(mentions).reduce(
        (sum, count) => sum + count,
        0
      );

      if (total_mentions > 0) {
        brandMentionsMap.set(brandName, {
          brand_name: brandName,
          ...mentions,
          total_mentions,
        });
      }
    });

    // Convert map to array and sort by total mentions
    return Array.from(brandMentionsMap.values()).sort(
      (a, b) => b.total_mentions - a.total_mentions
    );
  }, [results, analysis_brands, selectedDate, selectedModel]);

  // Effect to update analysis_brands based on selectedModel
  useEffect(() => {
    if (selectedModel.size === 0) {
      setAnalysisBrands(allAnalysisBrands);
    } else {
      setAnalysisBrands(filteredAnalysisBrands);
    }
  }, [
    selectedModel,
    allAnalysisBrands,
    filteredAnalysisBrands,
    analysis_brands,
  ]);

  // Effect to set default selected brand to first brand in the array
  useEffect(() => {
    if (
      brandMentionsInSummaries &&
      brandMentionsInSummaries.length > 0 &&
      selectedBrands.size === 0
    ) {
      const firstBrandName = brandMentionsInSummaries[0]?.brand_name;
      if (firstBrandName) {
        setSelectedBrands(new Set([firstBrandName]));
      }
    }
  }, [brandMentionsInSummaries, selectedQuery, selectedBrands.size]);

  // Effect to reset filters when prompt changes
  useEffect(() => {
    // Reset filters when the prompt changes
    if (selectedQuery) {
      setSelectedModel(new Set<string>([])); // Reset to empty set (show all models)
      setSelectedDate("latest");
      console.log("Prompt changed, resetting filters");
    }
  }, [selectedQuery]);

  // Fetch Google search results using the monitoring API
  const fetchGoogleSearchResults = async (
    mode_id: string,
    analysisDate?: string
  ) => {
    if (!mode_id) return;

    try {
      setLoadingGoogleResults(true);
      const response = await fetch(`/api/monitoring?mode_id=${mode_id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch Google search results");
      }

      const data = await response.json();

      // Filter search results by analysis date if provided
      if (
        analysisDate &&
        analysisDate !== "latest" &&
        analysisDate !== "" &&
        data.search_results
      ) {
        // Extract just the date part (YYYY-MM-DD) from the analysis date
        const targetDate = analysisDate.split("T")[0];

        const filteredResults = data.search_results.filter((result: any) => {
          if (!result.created_at) return false;
          // Extract date part from created_at timestamp
          const resultDate = new Date(result.created_at)
            .toISOString()
            .split("T")[0];
          return resultDate === targetDate;
        });

        data.search_results = filteredResults;
      }

      setGoogleSearchResults(data);
    } catch (error) {
      console.error("Error fetching Google search results:", error);
      setGoogleSearchResults(null);
    } finally {
      setLoadingGoogleResults(false);
    }
  };

  // Effect to fetch Google search results when selected query or date changes
  useEffect(() => {
    if (selectedQuery?.mode_id) {
      fetchGoogleSearchResults(selectedQuery.mode_id, selectedDate);
    }
  }, [selectedQuery, selectedDate]);
  console.log(googleSearchResults);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-3xl">
          <div className="flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <ShinyText
              text="Fetching your latest data..."
              disabled={false}
              speed={3}
              className="font-medium text-sm"
            />
          </div>
        </div>
      </div>
    );
  }

  if (subsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-3xl">
          <div className="flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <ShinyText
              text="Checking your profile status..."
              disabled={false}
              speed={3}
              className="font-medium text-sm"
            />
          </div>
        </div>
      </div>
    );
  }

  const handleNextStep = () => {
    setOnboardingStep((prev) => prev + 1);
  };

  const handleSkip = () => {
    if (onboardingStep === 0) {
      setSelectedPlan("free");
    }
    setOnboardingStep((prev) => prev + 1);
  };

  const handleStartSearching = () => {
    // Handle subscription creation with selected plan
    router.push("/dashboard/search");
  };

  const handleCreateBrand = async () => {
    if (!brandName || !brandWebsite || !brandIndustry) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in to create a brand");
        setSubmitting(false);
        return;
      }

      let logoData = null;

      // Convert file to base64 if provided
      if (brandLogo) {
        logoData = brandLogoPreview;
      }

      // Create brand record
      const brandId = uuidv4();
      const { data, error } = await supabase
        .from("brands")
        .insert([
          {
            id: brandId,
            name: brandName,
            logo_url: logoData,
            website: brandWebsite,
            industry: brandIndustry,
            user_id: user.id,
          },
        ])
        .select();

      if (error) {
        console.error("Error creating brand:", error);
        setSubmitting(false);
        return;
      }

      // Clear form
      setBrandName("");
      setBrandWebsite("");
      setBrandIndustry("");
      setBrandLogo(null);
      setBrandLogoPreview(null);

      // Trigger brand analysis
      await analyzeBrand(brandId);

      setSubmitting(false);
    } catch (error) {
      console.error("Error:", error);
      setSubmitting(false);
    }
  };

  const analyzeBrand = async (brandId: string) => {
    try {
      setIsAnalyzing(true);
      // Call the analysis API
      const response = await fetch(
        process.env.NEXT_PUBLIC_ANALYZE_BRAND as string,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionKey}`,
          },
          body: JSON.stringify({
            brandId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Brand analysis failed:", errorData);
        setIsAnalyzing(false);
        return;
      }
      toast({
        title: "Brand analysis completed",
        description:
          "We've analyzed your brand and you can view the results in the dashboard",
        duration: 5000,
      });
      setOnboardingStep((prev) => prev + 1);
      setIsAnalyzing(false);
    } catch (error) {
      console.error("Error analyzing brand:", error);
      setIsAnalyzing(false);
    }
  };

  // const handleAnalyze = async () => {
  //   if (!brand) return;

  //   console.log("Selected Monitoring Frequency:", monitoringFrequency);

  //   setIsAnalyzing(true);
  //   try {
  //     const response = await fetch(
  //       process.env.NEXT_PUBLIC_ANALYZE_BRAND as string,
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${sessionKey}`,
  //         },
  //         body: JSON.stringify({ brandId: brand.id }),
  //       }
  //     );

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       console.error("Brand analysis failed:", errorData);
  //       setIsAnalyzing(false);
  //       return;
  //     }

  //     // Refetch brand data to get updated metrics
  //     await refetch();
  //   } catch (error) {
  //     console.error("Error analyzing brand:", error);
  //   } finally {
  //     setIsAnalyzing(false);
  //   }
  // };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBrandLogo(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setBrandLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setBrandLogo(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setBrandLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (!subsLoading && !subscription && !loading && !queries) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-7xl p-8 bg-transparent rounded-lg shadow-lg">
          <div className="flex justify-between mb-16">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    onboardingStep >= step - 1
                      ? "bg-blue-500 text-white"
                      : "bg-gray-800 text-gray-300"
                  }`}
                >
                  {step}
                </div>
                <span className="text-sm text-gray-400">
                  {step === 1
                    ? "Select Plan"
                    : step === 2
                    ? "Your Brand"
                    : "Get Started"}
                </span>
              </div>
            ))}
          </div>

          {onboardingStep === 0 && (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-200 mb-2">
                Choose Your Plan
              </h2>
              <p className="text-gray-400 mb-18">
                Select the plan that best fits your needs
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-8">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`border border-neutral-600 rounded-lg p-4 transition-all hover:translate-y-[-5px] cursor-pointer relative ${
                      selectedPlan === plan.product_id
                        ? "outline-2 outline-blue-500 outline-offset-2"
                        : ""
                    } ${
                      plan.recommended
                        ? "bg-gradient-to-b from-background to-blue-500/50"
                        : ""
                    }`}
                    onClick={() => setSelectedPlan(plan?.product_id || "")}
                  >
                    {plan.recommended && (
                      <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-t-full inline-block absolute top-0 left-0 right-0 -mt-4">
                        POPULAR
                      </div>
                    )}
                    <h3 className="text-md font-bold mb-2">{plan.name}</h3>
                    <p className="text-3xl font-bold mb-4">{plan.price}</p>
                    <div className="space-y-2 text-left">
                      <p className="flex items-center">
                        <Check className="w-5 h-5 text-blue-500 mr-2" />
                        {plan.searches}
                      </p>
                      <p className="flex items-center">
                        <Check className="w-5 h-5 text-blue-500 mr-2" />
                        {plan.monitoring} {plan.frequency}
                      </p>
                      {plan.features.map((feature, index) => (
                        <p key={index} className="flex items-center">
                          <Check className="w-5 h-5 text-blue-500 mr-2" />
                          {feature}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="ghost" onClick={handleSkip}>
                  Skip for now (Free Trial)
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleNextStep}
                  disabled={!selectedPlan}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {onboardingStep === 1 && (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-200 mb-2">
                Tell Us About Your Brand
              </h2>
              <p className="text-gray-400 mb-8">
                This helps us personalize your experience (optional)
              </p>

              {isAnalyzing ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="w-full max-w-3xl">
                    <h1 className="text-2xl font-bold mb-6 text-center">
                      Creating Brand Analysis
                    </h1>
                    <p className="text-muted-foreground mb-8 text-center">
                      Analyzing...
                    </p>
                    <LoadingState />
                  </div>
                </div>
              ) : (
                <div className="max-w-md mx-auto mb-8">
                  <div className="sm:max-w-[500px] overflow-hidden border-accent">
                    <div className="p-6">
                      <div className="grid gap-6">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            value={brandName}
                            placeholder="Acme Corporation"
                            onChange={(e) => setBrandName(e.target.value)}
                            className="bg-zinc-800"
                            required
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            value={brandWebsite}
                            onChange={(e) => setBrandWebsite(e.target.value)}
                            className="bg-zinc-800"
                            placeholder="https://example.com"
                            required
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="industry">Industry</Label>
                          <Select
                            value={brandIndustry}
                            onValueChange={setBrandIndustry}
                          >
                            <SelectTrigger className="bg-zinc-800 w-full">
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                            <SelectContent>
                              {INDUSTRIES.map((industry) => (
                                <SelectItem key={industry} value={industry}>
                                  {industry}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="logo">Logo</Label>
                          <div className="flex items-center gap-4">
                            <input
                              ref={fileInputRef}
                              id="logo"
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                            />

                            {!brandLogoPreview ? (
                              <div
                                onClick={openFileDialog}
                                onDragEnter={handleDragEnter}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleFileDrop}
                                className={`
                          h-32 w-full rounded-md border-2 border-dashed 
                          flex flex-col items-center justify-center p-4 
                          cursor-pointer transition-all duration-200
                          ${
                            isDragging
                              ? "border-blue-500 bg-blue-500/10"
                              : "border-zinc-700 bg-zinc-800 hover:border-zinc-500"
                          }
                        `}
                              >
                                <div className="flex flex-col items-center text-center">
                                  <CloudUpload className="w-5 h-5 text-zinc-400 mb-2" />
                                  <div className="font-medium text-sm mb-1">
                                    Click to upload
                                  </div>
                                  <div className="text-xs text-zinc-400">
                                    or drag and drop your logo here
                                  </div>
                                  <div className="text-[10px] text-zinc-500 mt-3">
                                    PNG, JPG or SVG (max 5MB)
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full flex flex-col items-center">
                                <div className="w-28 h-28 p-3 rounded-md overflow-hidden bg-zinc-700 flex items-center justify-center mb-3">
                                  <Image
                                    src={brandLogoPreview}
                                    alt="Preview"
                                    width={50}
                                    height={50}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={openFileDialog}
                                  className="mt-2"
                                >
                                  <CloudUpload className="w-4 h-4 mr-2" />
                                  Change Logo
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-4">
                      <Button
                        onClick={handleCreateBrand}
                        disabled={submitting}
                        className="w-full"
                      >
                        {submitting ? "Creating..." : "Create Brand"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={() => setOnboardingStep(0)}
                  disabled={isAnalyzing}
                >
                  Back
                </Button>
                <div className="space-x-4">
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    disabled={isAnalyzing}
                  >
                    Skip
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleNextStep}
                    disabled={isAnalyzing}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          )}

          {onboardingStep === 2 && (
            <div className="text-center items-center flex flex-col">
              <h2 className="text-3xl font-bold text-gray-300 mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-gray-500 mb-8 max-w-2xl mx-auto">
                You&apos;ve chosen the{" "}
                <span className="font-bold">
                  {plans.find((p) => p.product_id === selectedPlan)?.name}
                </span>{" "}
                plan. You can always upgrade or change your plan later in
                settings.
              </p>

              <div className="max-w-md mx-auto flex gap-4">
                <CheckoutButton
                  priceId={selectedPlan || ""}
                  userId={user?.id || ""}
                  buttonText="Continue to payments"
                />
                <Button variant="outline" onClick={handleStartSearching}>
                  Try BrandScope for free
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error && queries.length <= 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-2">
        <Blocks className="w-6 h-6 text-blue-500" />
        <div className="text-center text-blue-500 mb-2">
          No Scheduled Searches
        </div>
        <p>
          You have no scheduled searches. Please create a new search to get
          started.
        </p>
        <Button
          variant="outline"
          className="mt-5"
          onClick={() =>
            window.location.assign("/dashboard/search?monitoring=true")
          }
        >
          Start Monitoring
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="text-center text-red-500">
          Error fetching Dashboard Data
        </div>
        <p>
          We apologize but at the moment, we were unable to fetch your dashboard
          data. Please try again later.
        </p>
        <Button variant="outline" onClick={() => router.refresh()}>
          Refresh
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full">
      <CheckoutSuccess />

      <div className="w-full mx-auto px-4 py-4">
        <div className="w-full flex md:flex-row flex-col md:justify-between justify-start md:items-center gap-4">
          <QueryCounter product={product} subscription={subscription} />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                window.location.assign("/dashboard/search?monitoring=true")
              }
            >
              Start Monitoring
            </Button>
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-4"
          >
            <div className="min-h-screen ">
              <div className="space-y-6">
                <motion.div
                  className="w-full flex justify-between items-center gap-2 rounded-md p-3 bg-blue-500/10 border-dashed border-1 border-blue-500/20 cursor-pointer hover:bg-blue-500/20 transition duration-300"
                  onClick={() => setIsExpanded(!isExpanded)}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-2">
                    <Clock9 className="w-4 h-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {currentTime.toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                      })}
                    </p>
                    {"•"}
                    <p>{queries.length} active prompts</p>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <div className="flex md:flex-row flex-col justify-start md:items-center gap-4 w-full">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full !border !border-accent md:w-fit"
                        >
                          {getDisplayValue()}
                          <span>
                            <ChevronDown className="w-4 h-4 opacity-40" />
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        {" "}
                        <DropdownMenuLabel>Filter by Brand</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                          checked={selectedBrands.has("all")}
                          onCheckedChange={(checked) =>
                            handleCheckedChange("all", checked)
                          }
                        >
                          All Brands
                        </DropdownMenuCheckboxItem>
                        <ScrollArea className="h-[200px]">
                          {analysis_brands?.map((brand, index) => (
                            <DropdownMenuCheckboxItem
                              key={index}
                              checked={selectedBrands.has(brand.name)}
                              onCheckedChange={(checked) =>
                                handleCheckedChange(brand.name, checked)
                              }
                            >
                              {brand.name}
                            </DropdownMenuCheckboxItem>
                          ))}
                        </ScrollArea>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Select
                      defaultValue={selectedDate || "latest"}
                      onValueChange={(value) => setSelectedDate(value)}
                    >
                      <SelectTrigger className="w-full !border !border-accent md:w-fit">
                        <SelectValue placeholder="Select date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="latest">All Analysis</SelectItem>
                        {analysis_dates?.sort((a, b) => b.localeCompare(a)).map((date: string) => (
                          <SelectItem key={date} value={date}>
                            {date}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full !border !border-accent md:w-fit"
                        >
                          {selectedModel.size === 0
                            ? "All Models"
                            : selectedModel.size === 1
                            ? Array.from(selectedModel)[0]
                            : `${selectedModel.size} models selected`}
                          <span>
                            <ChevronDown className="w-4 h-4 opacity-40" />
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        <DropdownMenuLabel>Filter by Model</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                          checked={selectedModel.size === 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedModel(new Set<string>([]));
                            }
                          }}
                        >
                          All Models
                        </DropdownMenuCheckboxItem>
                        <ScrollArea className="h-[200px]">
                          {analysis_models?.map((model: string) => (
                            <DropdownMenuCheckboxItem
                              key={model}
                              checked={selectedModel.has(model)}
                              onCheckedChange={(checked) => {
                                setSelectedModel((prev) => {
                                  const newSelection = new Set(prev);
                                  if (checked) {
                                    newSelection.add(model);
                                  } else {
                                    newSelection.delete(model);
                                  }
                                  return newSelection;
                                });
                              }}
                            >
                              {model}
                            </DropdownMenuCheckboxItem>
                          ))}
                        </ScrollArea>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      onClick={() => setShowGoogleResults(!showGoogleResults)}
                      variant="outline"
                      className="rounded-full"
                    >
                      <Gemini className="w-4 h-4" />
                      {showGoogleResults
                        ? "Hide Google Results"
                        : "Show Google Results"}
                    </Button>
                  </div>
                </motion.div>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <Card className="bg-background rounded-md p-4 border-[#e2e2e2]/70 dark:border-accent">
                        <ScheduledQueriesList
                          queries={queries}
                          selectedQuery={selectedQuery?.query}
                          onSelectQuery={(query) => {
                            setSelectedQuery(query);
                            setIsExpanded(false); // Close the list after selection
                          }}
                        />
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex md:flex-row flex-col gap-4 w-full h-full">
                  <MetricsHeader
                    brands={brandMentionsInSummaries}
                    temporalBrands={temportalBrandMentionsInSummaries}
                    selectedBrand={selectedBrands}
                    selectedModel={selectedModel}
                  />
                  <IndustryRankingsTable
                    brands={brandMentionsInSummaries}
                    setSelectedBrand={setSelectedBrands}
                    selectedBrand={selectedBrands}
                    selectedModel={selectedModel}
                  />
                </div>

                <div className="flex md:flex-row flex-col gap-4 w-full h-full">
                  {/* Google Search Results */}
                  {showGoogleResults &&
                    googleSearchResults &&
                    googleSearchResults.search_results &&
                    googleSearchResults.search_results.length > 0 && (
                      <ScrollArea className="h-[500px] w-full">
                        <GoogleResults
                          googleResults={
                            googleSearchResults.search_results[0].results
                          }
                          rankings={
                            googleSearchResults.search_results[0]?.rankings
                          }
                        />
                      </ScrollArea>
                    )}

                  {keywords && (
                    <div className="space-y-6 w-full h-full">
                      <KeywordCloud keywords={keywords} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <BrandDataProvider>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-3xl">
              <div className="flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <ShinyText
                  text="Fetching your latest data..."
                  disabled={false}
                  speed={3}
                  className="font-medium text-sm"
                />
              </div>
            </div>
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </BrandDataProvider>
  );
}
