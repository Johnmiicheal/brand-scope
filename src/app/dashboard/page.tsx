/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

// @ts-nocheck

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
import { CitationsCard } from "@/components/dashboard/citations-card";
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
  Calendar as CalendarIcon,
  Eye,
  X,
  Search,
  Download,
  TextSearch,
  Filter,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
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
import Stripe from "stripe";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GoogleResults } from "@/components/ui/google-results";
import { Gemini } from "@lobehub/icons";
import { toast as toastSonner } from "sonner";
import { TbStarFilled } from "react-icons/tb";
import { GoogleSearch, GoogleSearchResult } from "@/types/search";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useMediaQuery } from "@/hooks/use-mobile";
import { KeywordAnalysisCard } from "@/components/dashboard/keyword-analysis-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StepsTabContent } from "@/components/monitoring/steps-tab-content";
import ExcelJS from "exceljs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";

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
interface BrandFetchProps {
  brandId: string;
  claimed: boolean;
  domain: string;
  name: string;
  icon: string;
  _score: number;
  qualityScore: number;
  verified: boolean;
}

function IndustryRankingsTable({
  brands,
  setSelectedBrand,
  selectedBrand,
  selectedModel,
}: IndustryRankingsTableProps) {
  const [brandFetch, setBrandFetch] = useState<BrandFetchProps[]>([]);
  const [lastFetchedBrands, setLastFetchedBrands] = useState<string[]>([]);
  const brand_name = brands.map((brand) => brand.brand_name.split(" ")[0]);
  // useEffect(() => {
  //   const fetchBrandData = async () => {
  //     try {
  //       if (brand_name.length > 0) {
  //         const brandDataPromises = brand_name.map(async (name) => {
  //           const response = await fetch(
  //             `https://api.brandfetch.io/v2/search/${encodeURIComponent(
  //               name
  //             )}?c=1idSVUQuJldhOA4nY-0`
  //           );

  //           if (!response.ok) {
  //             throw new Error(`Failed to fetch brand data for ${name}`);
  //           }

  //           const data = await response.json();

  //           // Return the first item from the response array for this brand
  //           if (data && data.length > 0) {
  //             return data[0] as BrandFetchProps;
  //           }
  //           return null;
  //         });

  //         const brandDataResults = await Promise.all(brandDataPromises);
  //         const validBrandData = brandDataResults.filter(
  //           Boolean
  //         ) as BrandFetchProps[];

  //         setBrandFetch(validBrandData);
  //         setLastFetchedBrands([...brand_name]);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching brand data:", error);
  //     }
  //   };

  //   // Only fetch if brand names have actually changed
  //   const brandsChanged =
  //     JSON.stringify(brand_name.sort()) !==
  //     JSON.stringify(lastFetchedBrands.sort());

  //   if (brand_name.length > 0 && (brandFetch.length === 0 || brandsChanged)) {
  //     fetchBrandData();
  //   }
  // }, [brand_name, brands]);

  if (!brands || !brandFetch) return null;

  // console.log(brandFetch)

  const maxMentions = Math.max(...brands.map((brand) => brand.total_mentions));
  const maxModels = selectedModel.size === 0 ? 6 : selectedModel.size;
  const getCoverageRatio = (brand: any, type: "ratio" | "count") => {
    const totalMentionsPerModel =
      (brand.claude_mentions > 0 ? 1 : 0) +
      (brand.perplexity_mentions > 0 ? 1 : 0) +
      (brand.gemini_mentions > 0 ? 1 : 0) +
      (brand.gpt_search_mentions > 0 ? 1 : 0) +
      (brand.ai_overview_mentions > 0 ? 1 : 0) +
      (brand.google_ai_mode_mentions > 0 ? 1 : 0);
    // Check selected models and add to total mentions count
    let selectedModelTotalMentions = 0;

    if (selectedModel.has("Claude 4.0 Sonnet") && brand.claude_mentions > 0) {
      selectedModelTotalMentions++;
    }
    if (
      selectedModel.has("Perplexity Sonar") &&
      brand.perplexity_mentions > 0
    ) {
      selectedModelTotalMentions++;
    }
    if (selectedModel.has("Gemini 2.5 Flash") && brand.gemini_mentions > 0) {
      selectedModelTotalMentions++;
    }
    if (
      selectedModel.has("GPT 4o Web Search") &&
      brand.gpt_search_mentions > 0
    ) {
      selectedModelTotalMentions++;
    }
    if (
      selectedModel.has("Google AI Overview") &&
      brand.ai_overview_mentions > 0
    ) {
      selectedModelTotalMentions++;
    }
    if (
      selectedModel.has("Google AI Mode") &&
      brand.google_ai_mode_mentions > 0
    ) {
      selectedModelTotalMentions++;
    }

    // Use selectedModelTotalMentions when filtering is active
    const finalTotalMentions =
      selectedModel.size > 0
        ? selectedModelTotalMentions
        : totalMentionsPerModel;
    const finalMaxModels =
      selectedModel.size > 0 ? selectedModel.size : maxModels;

    if (type === "ratio") {
      return `${finalTotalMentions} / ${finalMaxModels}`;
    } else {
      return (finalTotalMentions / finalMaxModels).toFixed(2);
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
                        <div className="whitespace-normal break-words max-w-[150px] flex items-center">
                          {/* {brandFetch.find((brand) =>
                            entity.brand_name
                              .toLowerCase()
                              ?.includes(brand.name?.toLowerCase() || "")
                          )?.icon ? (
                            <Image
                              className="inline mr-2 rounded-full"
                              src={
                                brandFetch.find((brand) =>
                                  entity.brand_name
                                    .toLowerCase()
                                    ?.includes(brand.name?.toLowerCase() || "")
                                )?.icon!
                              }
                              alt={entity.brand_name}
                              width={20}
                              height={20}
                            />
                          ) : (
                            <div className="inline-block mr-2 min-w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold text-center">
                              {entity.brand_name[0]}
                            </div>
                          )} */}
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
  const [userBrands, setUserBrands] = useState<Brand[]>([]);
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [subsLoading, setSubsLoading] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<string>("all");
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [selectedModel, setSelectedModel] = useState<Set<string>>(
    new Set<string>([])
  );
  const [googleSearchResults, setGoogleSearchResults] = useState<any>(null);
  const [loadingGoogleResults, setLoadingGoogleResults] = useState(false);
  const [showGoogleResults, setShowGoogleResults] = useState(true);

  const fetchBrands = async () => {
    try {
      setIsLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("No authenticated user found");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("brand_project")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching brands:", error);
        setIsLoading(false);
        return;
      }

      setUserBrands(data || []);

      // Set the first brand as selected if available
      if (data && data.length > 0) {
        setCurrentBrand(data[0]);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  // Plans configuration
  const plans = [
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
      product_id: "price_1RniuTR16g0cZkq31HV8wnRh",
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
      product_id: "price_1Rniv8R16g0cZkq37mTSXDfo",
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
      product_id: "price_1RnivgR16g0cZkq3Re1ttVTu",
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
          
          // Safely fetch price and product data from server API
          try {
            const response = await fetch(`/api/stripe/subscription-info?priceId=${fetchedSubscriptionData.price_id}`);
            if (response.ok) {
              const { product } = await response.json();
              setProduct(product);
            }
          } catch (error) {
            console.error('Error fetching subscription info:', error);
          }
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
        const filteredDataByMyBrand = data.monitoring.filter((item: any) =>
          item?.attached_brand_id?.includes(currentBrand?.id)
        );
        console.log("filteredDataByMyBrand: ", filteredDataByMyBrand);

        if (data && data.monitoring) {
          if (currentBrand) {
            setQueries(filteredDataByMyBrand);
            setSelectedQuery(filteredDataByMyBrand[0]);
          } else {
            setQueries(data.monitoring);
            setSelectedQuery(data.monitoring[0]);
          }
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
  }, [toast, user, currentBrand]);

  const [isExpanded, setIsExpanded] = useState(false);

  const results = selectedQuery?.results;
  // console.log("Results: ", results);
  const keywords = results?.[0]?.keyword_analysis?.keywords;
  const [analysis_brands, setAnalysisBrands] = useState<any[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(
    new Set<string>([])
  );
  const [brandSearchQuery, setBrandSearchQuery] = useState<string>("");

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

  const removeBrandFromSelection = (brandName: string) => {
    setSelectedBrands((prevSelected) => {
      const newSelection = new Set(prevSelected);
      newSelection.delete(brandName);

      // If removing the last brand, default to "all"
      if (newSelection.size === 0 && analysis_brands.length > 0) {
        newSelection.add("all");
      }

      return newSelection;
    });
  };

  // Filter brands based on search query
  const filteredBrandsForSearch = useMemo(() => {
    if (!brandSearchQuery.trim()) {
      return analysis_brands;
    }
    return analysis_brands.filter((brand) =>
      brand.name.toLowerCase().includes(brandSearchQuery.toLowerCase())
    );
  }, [analysis_brands, brandSearchQuery]);

  // Export Industry Rankings Table functionality
  const exportToCSV = () => {
    if (!brandMentionsInSummaries || brandMentionsInSummaries.length === 0) {
      toastSonner.error("No brand data available to export");
      return;
    }

    try {
      const exportData: any[] = [];
      const maxModels = selectedModel.size === 0 ? 6 : selectedModel.size;
      const maxMentions = Math.max(
        ...brandMentionsInSummaries.map((brand) => brand.total_mentions)
      );

      // Helper function to calculate coverage ratio for a brand
      const getCoverageRatio = (brand: any) => {
        const totalMentionsPerModel =
          (brand.claude_mentions > 0 ? 1 : 0) +
          (brand.perplexity_mentions > 0 ? 1 : 0) +
          (brand.gemini_mentions > 0 ? 1 : 0) +
          (brand.gpt_search_mentions > 0 ? 1 : 0) +
          (brand.ai_overview_mentions > 0 ? 1 : 0) +
          (brand.google_ai_mode_mentions > 0 ? 1 : 0);

        let selectedModelTotalMentions = 0;

        if (selectedModel.size > 0) {
          if (
            selectedModel.has("Claude 4.0 Sonnet") &&
            brand.claude_mentions > 0
          )
            selectedModelTotalMentions++;
          if (
            selectedModel.has("Perplexity Sonar") &&
            brand.perplexity_mentions > 0
          )
            selectedModelTotalMentions++;
          if (
            selectedModel.has("Gemini 2.5 Flash") &&
            brand.gemini_mentions > 0
          )
            selectedModelTotalMentions++;
          if (
            selectedModel.has("GPT 4o Web Search") &&
            brand.gpt_search_mentions > 0
          )
            selectedModelTotalMentions++;
          if (
            selectedModel.has("Google AI Overview") &&
            brand.ai_overview_mentions > 0
          )
            selectedModelTotalMentions++;
          if (
            selectedModel.has("Google AI Mode") &&
            brand.google_ai_mode_mentions > 0
          )
            selectedModelTotalMentions++;
        }

        const finalTotalMentions =
          selectedModel.size > 0
            ? selectedModelTotalMentions
            : totalMentionsPerModel;
        const finalMaxModels =
          selectedModel.size > 0 ? selectedModel.size : maxModels;

        return ((finalTotalMentions / finalMaxModels) * 100).toFixed(1);
      };

      // Helper function to calculate visibility score for a brand
      const getVisibilityScore = (brand: any) => {
        const coverageRatio = parseFloat(getCoverageRatio(brand)) / 100;
        const mentionsIndex = brand.total_mentions / maxMentions;
        return ((100 * (coverageRatio + mentionsIndex)) / 2).toFixed(1);
      };

      // Helper function to get listed models for a brand
      const getListedModels = (brand: any) => {
        const models: string[] = [];
        if (brand.gpt_search_mentions > 0) models.push("GPT 4o Web Search");
        if (brand.claude_mentions > 0) models.push("Claude 4.0 Sonnet");
        if (brand.perplexity_mentions > 0) models.push("Perplexity Sonar");
        if (brand.gemini_mentions > 0) models.push("Gemini 2.5 Flash");
        if (brand.ai_overview_mentions > 0) models.push("Google AI Overview");
        if (brand.google_ai_mode_mentions > 0) models.push("Google AI Mode");
        return models.join("; ");
      };

      // Collect all citations from all models for each brand
      const getAllCitations = (brandName: string) => {
        const allCitations: string[] = [];

        // Get citations from model summaries
        const dateFilteredResults = getDateFilteredResults;
        dateFilteredResults.forEach((result) => {
          result.model_summary?.forEach((summary: any) => {
            if (summary.reasoning) {
              summary.reasoning.forEach((citation: any) => {
                const url = citation.url || citation.url_citation?.url;
                if (url) allCitations.push(url);
              });
            }
          });
        });

        // Get Google AI Overview citations
        if (googleSearchResults?.search_results) {
          googleSearchResults.search_results.forEach((searchResult: any) => {
            const googleCitations =
              searchResult.results?.ai_overview?.references || [];
            googleCitations.forEach((ref: any) => {
              if (ref.link) allCitations.push(ref.link);
            });
          });
        }

        // Get organic search results
        if (googleSearchResults?.search_results) {
          googleSearchResults.search_results.forEach((searchResult: any) => {
            const organicResults = searchResult.results?.organic_results || [];
            organicResults.forEach((result: any) => {
              if (result.link) allCitations.push(result.link);
            });
          });
        }

        // Remove duplicates and return
        return [...new Set(allCitations)].join("; ");
      };

      // Process each brand in brandMentionsInSummaries (export ALL brands)
      brandMentionsInSummaries.forEach((brand) => {
        const citations = getAllCitations(brand.brand_name);
        const citationCount = citations ? citations.split("; ").length : 0;

        exportData.push({
          "Brand Name": brand.brand_name,
          "Total Mentions": brand.total_mentions,
          "Coverage Ratio (%)": getCoverageRatio(brand),
          "Visibility Score (%)": getVisibilityScore(brand),
          "Listed in Models": getListedModels(brand),
          "GPT 4o Web Search Mentions": brand.gpt_search_mentions > 0,
          "Claude 4.0 Sonnet Mentions": brand.claude_mentions > 0,
          "Perplexity Sonar Mentions": brand.perplexity_mentions > 0,
          "Gemini 2.5 Flash Mentions": brand.gemini_mentions > 0,
          "Google AI Overview Mentions": brand.ai_overview_mentions > 0,
          "Google AI Mode Mentions": brand.google_ai_mode_mentions > 0,
          "All Citations (URLs)": citations,
          "Citation Count": citationCount,
          Query: selectedQuery.query,
          "Analysis Date": new Date().toLocaleDateString(),
        });
      });

      if (exportData.length === 0) {
        toastSonner.error("No data matches your current filters");
        return;
      }

      // Sort by total mentions (descending) to match table order
      exportData.sort((a, b) => b["Total Mentions"] - a["Total Mentions"]);

      // Add summary row at the top
      const totalBrands = exportData.length;
      const totalMentions = exportData.reduce(
        (sum, brand) => sum + brand["Total Mentions"],
        0
      );
      const avgCoverage = (
        exportData.reduce(
          (sum, brand) => sum + parseFloat(brand["Coverage Ratio (%)"]),
          0
        ) / totalBrands
      ).toFixed(1);
      const avgVisibility = (
        exportData.reduce(
          (sum, brand) => sum + parseFloat(brand["Visibility Score (%)"]),
          0
        ) / totalBrands
      ).toFixed(1);
      const allModels = [
        "GPT 4o Web Search",
        "Claude 4.0 Sonnet",
        "Perplexity Sonar",
        "Gemini 2.5 Flash",
        "Google AI Overview",
        "Google AI Mode",
      ];
      const activeModels =
        selectedModel.size > 0
          ? Array.from(selectedModel).join("; ")
          : allModels.join("; ");

      exportData.unshift({
        "Brand Name": "SUMMARY",
        "Total Mentions": totalMentions,
        "Coverage Ratio (%)": `Avg: ${avgCoverage}%`,
        "Visibility Score (%)": `Avg: ${avgVisibility}%`,
        "Listed in Models": activeModels,
        "GPT 4o Web Search Mentions":
          exportData.reduce(
            (sum, brand) => sum + brand["GPT 4o Web Search Mentions"],
            0
          ) || 0,
        "Claude 4.0 Sonnet Mentions":
          exportData.reduce(
            (sum, brand) => sum + brand["Claude 4.0 Sonnet Mentions"],
            0
          ) || 0,
        "Perplexity Sonar Mentions":
          exportData.reduce(
            (sum, brand) => sum + brand["Perplexity Sonar Mentions"],
            0
          ) || 0,
        "Gemini 2.5 Flash Mentions":
          exportData.reduce(
            (sum, brand) => sum + brand["Gemini 2.5 Flash Mentions"],
            0
          ) || 0,
        "Google AI Overview Mentions":
          exportData.reduce(
            (sum, brand) => sum + brand["Google AI Overview Mentions"],
            0
          ) || 0,
        "Google AI Mode Mentions":
          exportData.reduce(
            (sum, brand) => sum + brand["Google AI Mode Mentions"],
            0
          ) || 0,
        "All Citations (URLs)": `${totalBrands} brands analyzed`,
        "Citation Count":
          exportData.reduce((sum, brand) => sum + brand["Citation Count"], 0) ||
          0,
        Query: selectedQuery.query,
        "Analysis Date": `Export Date: ${new Date().toLocaleDateString()}`,
      });

      // Convert to CSV
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(","),
        ...exportData.map((row) =>
          headers
            .map((header) => {
              const value = row[header] || "";
              const stringValue = String(value);
              // Escape quotes and wrap in quotes if contains comma or quote
              if (
                stringValue.includes(",") ||
                stringValue.includes('"') ||
                stringValue.includes("\n")
              ) {
                return `"${stringValue.replace(/"/g, '""')}"`;
              }
              return stringValue;
            })
            .join(",")
        ),
      ].join("\n");

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `industry-rankings-${selectedQuery.query
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase()}-${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toastSonner.success(`Exported ${exportData.length - 1} brands to CSV`); // Subtract 1 for summary row
    } catch (error) {
      console.error("Export error:", error);
      toastSonner.error("Failed to export data");
    }
  };

  // Register Chart.js components
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    ChartTooltip,
    Legend
  );

  // Function to generate chart images using client-side Chart.js
  const generateChartImage = async (chartConfig: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const width = 800;
        const height = 600;

        // Create a canvas element
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          throw new Error("Could not get canvas context");
        }

        // Create the chart
        const chart = new ChartJS(ctx, chartConfig);

        // Wait for chart to render then convert to base64
        setTimeout(() => {
          try {
            const base64Image = canvas.toDataURL("image/png").split(",")[1];
            chart.destroy(); // Clean up
            resolve(base64Image);
          } catch (error) {
            chart.destroy();
            reject(error);
          }
        }, 500); // Give chart time to render
      } catch (error) {
        console.error("Chart generation error:", error);
        reject(error);
      }
    });
  };

  // Export to Excel with Charts
  const exportToExcelWithCharts = async () => {
    if (!brandMentionsInSummaries || brandMentionsInSummaries.length === 0) {
      toastSonner.error("No brand data available to export");
      return;
    }

    try {
      // Filter out any invalid brand data
      const validBrands = brandMentionsInSummaries.filter(
        (brand) =>
          brand &&
          brand.brand_name &&
          typeof brand.brand_name === "string" &&
          typeof brand.total_mentions === "number" &&
          !isNaN(brand.total_mentions)
      );

      if (validBrands.length === 0) {
        toastSonner.error("No valid brand data available to export");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const maxModels = selectedModel.size === 0 ? 7 : selectedModel.size;
      const maxMentions = Math.max(
        ...validBrands.map((brand) => brand.total_mentions || 0)
      );

      // Helper functions (same as CSV export)
      const getCoverageRatio = (brand: any) => {
        if (!brand) return 0;
        const totalMentionsPerModel =
          ((brand.claude_mentions || 0) > 0 ? 1 : 0) +
          ((brand.perplexity_mentions || 0) > 0 ? 1 : 0) +
          ((brand.gemini_mentions || 0) > 0 ? 1 : 0) +
          ((brand.gpt_search_mentions || 0) > 0 ? 1 : 0) +
          ((brand.ai_overview_mentions || 0) > 0 ? 1 : 0) +
          ((brand.google_ai_mode_mentions || 0) > 0 ? 1 : 0);

        let selectedModelTotalMentions = 0;
        if (selectedModel.size > 0) {
          if (
            selectedModel.has("Claude 4.0 Sonnet") &&
            (brand.claude_mentions || 0) > 0
          )
            selectedModelTotalMentions++;
          if (
            selectedModel.has("Perplexity Sonar") &&
            (brand.perplexity_mentions || 0) > 0
          )
            selectedModelTotalMentions++;
          if (
            selectedModel.has("Gemini 2.5 Flash") &&
            (brand.gemini_mentions || 0) > 0
          )
            selectedModelTotalMentions++;
          if (
            selectedModel.has("GPT 4o Web Search") &&
            (brand.gpt_search_mentions || 0) > 0
          )
            selectedModelTotalMentions++;
          if (
            selectedModel.has("Google AI Overview") &&
            (brand.ai_overview_mentions || 0) > 0
          )
            selectedModelTotalMentions++;
          if (
            selectedModel.has("Google AI Mode") &&
            (brand.google_ai_mode_mentions || 0) > 0
          )
            selectedModelTotalMentions++;
        }

        const finalTotalMentions =
          selectedModel.size > 0
            ? selectedModelTotalMentions
            : totalMentionsPerModel;
        const finalMaxModels =
          selectedModel.size > 0 ? selectedModel.size : maxModels;
        return finalMaxModels > 0
          ? (finalTotalMentions / finalMaxModels) * 100
          : 0;
      };

      const getVisibilityScore = (brand: any) => {
        if (!brand) return 0;
        const coverageRatio = getCoverageRatio(brand) / 100;
        const mentionsIndex =
          maxMentions > 0 ? (brand.total_mentions || 0) / maxMentions : 0;
        return (100 * (coverageRatio + mentionsIndex)) / 2;
      };

      // Sheet 1: Industry Rankings
      const rankingsSheet = workbook.addWorksheet("Industry Rankings");

      // Headers
      const headers = [
        "Brand Name",
        "Total Mentions",
        "Coverage Ratio (%)",
        "Visibility Score (%)",
        "GPT 4o Search",
        "Claude 4.0",
        "Perplexity",
        "Gemini 2.5",
        "AI Overview",
        "AI Mode",
      ];

      rankingsSheet.addRow(headers);

      // Style headers
      rankingsSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
      rankingsSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "366092" },
      };

      // Add data rows
      const sortedBrands = [...validBrands].sort(
        (a, b) => (b.total_mentions || 0) - (a.total_mentions || 0)
      );
      sortedBrands.forEach((brand) => {
        rankingsSheet.addRow([
          brand.brand_name || "Unknown",
          brand.total_mentions || 0,
          getCoverageRatio(brand).toFixed(1),
          getVisibilityScore(brand).toFixed(1),
          (brand.gpt_mentions || 0) > 0 ? "✓" : "✗",
          (brand.gpt_search_mentions || 0) > 0 ? "✓" : "✗",
          (brand.claude_mentions || 0) > 0 ? "✓" : "✗",
          (brand.perplexity_mentions || 0) > 0 ? "✓" : "✗",
          (brand.gemini_mentions || 0) > 0 ? "✓" : "✗",
          (brand.ai_overview_mentions || 0) > 0 ? "✓" : "✗",
          (brand.google_ai_mode_mentions || 0) > 0 ? "✓" : "✗",
        ]);
      });

      // Auto-fit columns
      rankingsSheet.columns.forEach((column) => {
        column.width = 15;
      });

      // Generate main visibility score bar chart
      const topBrandsForChart = sortedBrands
        .slice(0, 10)
        .filter((brand) => brand && brand.brand_name); // Top 10 brands
      const visibilityChartConfig = {
        type: "bar",
        data: {
          labels: topBrandsForChart.map(
            (brand) => brand.brand_name || "Unknown"
          ),
          datasets: [
            {
              label: "Visibility Score (%)",
              data: topBrandsForChart.map(
                (brand) => getVisibilityScore(brand) || 0
              ),
              backgroundColor: "#36A2EB",
              borderColor: "#36A2EB",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: "Top 10 Brands - Visibility Score Analysis",
              font: { size: 16 },
            },
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: "Visibility Score (%)",
              },
            },
            x: {
              title: {
                display: true,
                text: "Brands",
              },
            },
          },
        },
      };

      const visibilityChartImageBase64 = await generateChartImage(
        visibilityChartConfig
      );
      rankingsSheet.addImage(
        {
          base64: visibilityChartImageBase64,
          extension: "png",
        },
        {
          tl: { col: 12, row: 1 }, // Start at column M (12), row 2 (1)
          ext: { width: 600, height: 400 },
        }
      );

      // Sheet 2: Temporal Trends
      const trendsSheet = workbook.addWorksheet("Temporal Trends");

      // Prepare temporal data with validation
      const temporalData = (temportalBrandMentionsInSummaries || []).filter(
        (item) => item && item.analysis_date && item.brand_name
      );
      const dates = [
        ...new Set(temporalData.map((item) => item.analysis_date)),
      ].sort();
      const topBrands = sortedBrands
        .slice(0, 10)
        .filter((brand) => brand && brand.brand_name); // Top 10 brands for the chart

      // Headers for temporal data
      const temporalHeaders = [
        "Date",
        ...topBrands.map((brand) => brand.brand_name || "Unknown"),
      ];
      trendsSheet.addRow(temporalHeaders);

      // Style headers
      trendsSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
      trendsSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "366092" },
      };

      // Add temporal data
      dates.forEach((date) => {
        const row = [new Date(date).toLocaleDateString()];
        topBrands.forEach((brand) => {
          const brandData = temporalData.find(
            (item) =>
              item.analysis_date === date &&
              item.brand_name === brand.brand_name
          );
          row.push(brandData ? brandData.total_mentions || 0 : 0);
        });
        trendsSheet.addRow(row);
      });

      // Auto-fit columns
      trendsSheet.columns.forEach((column) => {
        column.width = 12;
      });

      // Generate and embed temporal trends chart
      if (dates.length > 1 && topBrands.length > 0) {
        const chartConfig = {
          type: "line",
          data: {
            labels: dates.map((date) => new Date(date).toLocaleDateString()),
            datasets: topBrands.slice(0, 5).map((brand, index) => {
              const colors = [
                "#FF6384",
                "#36A2EB",
                "#FFCE56",
                "#4BC0C0",
                "#9966FF",
              ];
              const data = dates.map((date) => {
                const brandData = temporalData.find(
                  (item) =>
                    item.analysis_date === date &&
                    item.brand_name === brand.brand_name
                );
                return brandData ? brandData.total_mentions || 0 : 0;
              });

              return {
                label: brand.brand_name || "Unknown",
                data: data,
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length] + "20",
                tension: 0.1,
              };
            }),
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: "Brand Mentions Over Time",
                font: { size: 16 },
              },
              legend: {
                position: "top",
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Number of Mentions",
                },
              },
              x: {
                title: {
                  display: true,
                  text: "Date",
                },
              },
            },
          },
        };

        const chartImageBase64 = await generateChartImage(chartConfig);
        trendsSheet.addImage(
          {
            base64: chartImageBase64,
            extension: "png",
          },
          {
            tl: { col: 13, row: 1 }, // Start at column N (13), row 2 (1)
            ext: { width: 600, height: 400 },
          }
        );
      }

      // Sheet 3: Model Comparison
      const modelSheet = workbook.addWorksheet("Model Comparison");

      // Model comparison data
      const modelNames = [
        "GPT 4o Search",
        "Claude 4.0",
        "Perplexity",
        "Gemini 2.5",
        "AI Overview",
        "AI Mode",
      ];
      const modelHeaders = ["Model", "Total Brands Mentioned", "Percentage"];
      modelSheet.addRow(modelHeaders);

      // Style headers
      modelSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
      modelSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "366092" },
      };

      // Calculate model statistics
      const totalBrands = validBrands.length;
      const modelStats = [
        {
          name: "GPT 4o Search",
          count: validBrands.filter((b) => (b.gpt_search_mentions || 0) > 0)
            .length,
        },
        {
          name: "Claude 4.0",
          count: validBrands.filter((b) => (b.claude_mentions || 0) > 0).length,
        },
        {
          name: "Perplexity",
          count: validBrands.filter((b) => (b.perplexity_mentions || 0) > 0)
            .length,
        },
        {
          name: "Gemini 2.5",
          count: validBrands.filter((b) => (b.gemini_mentions || 0) > 0).length,
        },
        {
          name: "AI Overview",
          count: validBrands.filter((b) => (b.ai_overview_mentions || 0) > 0)
            .length,
        },
        {
          name: "AI Mode",
          count: validBrands.filter((b) => (b.google_ai_mode_mentions || 0) > 0)
            .length,
        },
      ];

      modelStats.forEach((stat) => {
        const percentage = ((stat.count / totalBrands) * 100).toFixed(1);
        modelSheet.addRow([stat.name, stat.count, `${percentage}%`]);
      });

      // Auto-fit columns
      modelSheet.columns.forEach((column) => {
        column.width = 18;
      });

      // Generate and embed model comparison bar chart
      const modelChartConfig = {
        type: "bar",
        data: {
          labels: modelStats.map((stat) => stat.name),
          datasets: [
            {
              label: "Brands Mentioned",
              data: modelStats.map((stat) => stat.count),
              backgroundColor: [
                "#FF6384",
                "#36A2EB",
                "#FFCE56",
                "#4BC0C0",
                "#9966FF",
                "#FF9F40",
                "#FF6384",
              ],
              borderColor: [
                "#FF6384",
                "#36A2EB",
                "#FFCE56",
                "#4BC0C0",
                "#9966FF",
                "#FF9F40",
                "#FF6384",
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: "Model Coverage - Brands Mentioned by Each AI Model",
              font: { size: 16 },
            },
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Number of Brands",
              },
            },
            x: {
              title: {
                display: true,
                text: "AI Models",
              },
            },
          },
        },
      };

      const modelChartImageBase64 = await generateChartImage(modelChartConfig);
      modelSheet.addImage(
        {
          base64: modelChartImageBase64,
          extension: "png",
        },
        {
          tl: { col: 4, row: 1 }, // Start at column E (4), row 2 (1)
          ext: { width: 600, height: 400 },
        }
      );

      // Sheet 4: Executive Summary
      const summarySheet = workbook.addWorksheet("Executive Summary");

      // Executive Summary Content
      summarySheet.addRow(["Brand Analysis Report"]);
      summarySheet.addRow([`Query: ${selectedQuery.query}`]);
      summarySheet.addRow([
        `Analysis Date: ${new Date().toLocaleDateString()}`,
      ]);
      summarySheet.addRow([]);
      summarySheet.addRow(["Key Insights:"]);
      summarySheet.addRow([`• Total Brands Analyzed: ${validBrands.length}`]);
      summarySheet.addRow([
        `• Top Brand: ${sortedBrands[0]?.brand_name || "N/A"} (${
          sortedBrands[0]?.total_mentions || 0
        } mentions)`,
      ]);
      summarySheet.addRow([
        `• Models Covered: ${
          modelStats.filter((m) => m.count > 0).length
        } out of ${modelStats.length}`,
      ]);
      summarySheet.addRow([
        `• Average Visibility Score: ${
          validBrands.length > 0
            ? (
                validBrands.reduce(
                  (sum, brand) => sum + getVisibilityScore(brand),
                  0
                ) / validBrands.length
              ).toFixed(1)
            : "0"
        }%`,
      ]);
      summarySheet.addRow([]);
      summarySheet.addRow(["Report Contents:"]);
      summarySheet.addRow([
        "• Industry Rankings - Complete metrics + Visibility Score Bar Chart",
      ]);
      summarySheet.addRow([
        "• Temporal Trends - Time-series data + Brand Mentions Line Chart",
      ]);
      summarySheet.addRow([
        "• Model Comparison - Coverage stats + AI Model Bar Chart",
      ]);
      summarySheet.addRow([]);
      summarySheet.addRow(["Visual Charts Included:"]);
      summarySheet.addRow(["✓ Top 10 Brands Visibility Score (Bar Chart)"]);
      summarySheet.addRow(["✓ Brand Mentions Over Time (Line Chart)"]);
      summarySheet.addRow(["✓ AI Model Coverage Comparison (Bar Chart)"]);
      summarySheet.addRow([]);
      summarySheet.addRow([
        "📊 All charts are embedded as high-quality images ready for presentations!",
      ]);

      // Style the summary sheet
      summarySheet.getRow(1).font = {
        bold: true,
        size: 16,
        color: { argb: "0066CC" },
      };
      summarySheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "E6F2FF" },
      };
      summarySheet.getRow(5).font = { bold: true, color: { argb: "2F4F4F" } };
      summarySheet.getRow(11).font = { bold: true, color: { argb: "2F4F4F" } };
      summarySheet.getRow(15).font = { bold: true, color: { argb: "2F4F4F" } };

      // Auto-fit columns for summary
      summarySheet.columns.forEach((column) => {
        column.width = 60;
      });

      // Generate and download the Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `brand-analysis-report-${selectedQuery.query
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase()}-${new Date().toISOString().split("T")[0]}.xlsx`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toastSonner.success(
        `🎉 Excel report with embedded visual charts exported successfully! 3 professional charts included.`
      );
    } catch (error) {
      console.error("Excel export error:", error);
      toastSonner.error("Failed to export Excel report");
    }
  };

  // Professional HTML Report Export with Charts
  const exportToHTMLReport = async () => {
    if (!brandMentionsInSummaries || brandMentionsInSummaries.length === 0) {
      toastSonner.error("No brand data available to export");
      return;
    }

    try {
      // Filter valid brands
      const validBrands = brandMentionsInSummaries.filter(
        (brand) =>
          brand &&
          brand.brand_name &&
          typeof brand.brand_name === "string" &&
          typeof brand.total_mentions === "number" &&
          !isNaN(brand.total_mentions)
      );

      if (validBrands.length === 0) {
        toastSonner.error("No valid brand data available to export");
        return;
      }

      const maxModels = selectedModel.size === 0 ? 6 : selectedModel.size;
      const maxMentions = Math.max(
        ...validBrands.map((brand) => brand.total_mentions || 0)
      );

      // Helper functions
      const getCoverageRatio = (brand: any) => {
        if (!brand) return 0;
        const totalMentionsPerModel =
          ((brand.claude_mentions || 0) > 0 ? 1 : 0) +
          ((brand.perplexity_mentions || 0) > 0 ? 1 : 0) +
          ((brand.gemini_mentions || 0) > 0 ? 1 : 0) +
          ((brand.gpt_search_mentions || 0) > 0 ? 1 : 0) +
          ((brand.ai_overview_mentions || 0) > 0 ? 1 : 0) +
          ((brand.google_ai_mode_mentions || 0) > 0 ? 1 : 0);

        const finalMaxModels =
          selectedModel.size > 0 ? selectedModel.size : maxModels;
        return finalMaxModels > 0
          ? (totalMentionsPerModel / finalMaxModels) * 100
          : 0;
      };

      const getVisibilityScore = (brand: any) => {
        if (!brand) return 0;
        const coverageRatio = getCoverageRatio(brand) / 100;
        const mentionsIndex =
          maxMentions > 0 ? (brand.total_mentions || 0) / maxMentions : 0;
        return (100 * (coverageRatio + mentionsIndex)) / 2;
      };

      const sortedBrands = [...validBrands].sort(
        (a, b) => (b.total_mentions || 0) - (a.total_mentions || 0)
      );

      // Generate HTML Report
      const reportHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Brand Analysis Report - ${selectedQuery?.query || "Export"}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
            .page-break { page-break-before: always; }
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #366092;
            padding-bottom: 20px;
            margin-bottom: 40px;
        }
        
        .header h1 {
            color: #366092;
            font-size: 2.5em;
            margin: 0;
            font-weight: 700;
        }
        
        .header .subtitle {
            color: #666;
            font-size: 1.2em;
            margin: 10px 0;
        }
        
        .header .meta {
            color: #888;
            font-size: 0.9em;
        }
        
        .section {
            margin: 40px 0;
        }
        
        .section h2 {
            color: #366092;
            font-size: 1.8em;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .metric-card {
            background: #f8f9fa;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #366092;
            margin: 10px 0;
        }
        
        .metric-label {
            color: #666;
            font-size: 0.9em;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }
        
        th {
            background: #366092;
            color: white;
            font-weight: 600;
            position: sticky;
            top: 0;
        }
        
        tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        tr:hover {
            background: #e8f4f8;
        }
        
        .coverage-indicator {
            display: inline-block;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            text-align: center;
            line-height: 20px;
            font-weight: bold;
            font-size: 12px;
            color: white;
        }
        
        .covered {
            background: #28a745;
        }
        
        .not-covered {
            background: #dc3545;
        }
        
        .chart-container {
            margin: 30px 0;
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
        }
        
        .chart-title {
            font-size: 1.3em;
            font-weight: 600;
            color: #366092;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .chart-canvas {
            max-width: 100% !important;
            height: 400px !important;
            width: 100% !important;
            max-height: 400px !important;
            min-height: 400px !important;
        }
        
        .export-buttons {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
        }
        
        .btn {
            background: #366092;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 0 5px;
            font-size: 14px;
        }
        
        .btn:hover {
            background: #2a4c73;
        }
        
        .btn-secondary {
            background: #6c757d;
        }
        
        .btn-secondary:hover {
            background: #545b62;
        }
        
        .footer {
            margin-top: 60px;
            padding: 30px 0;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            background: #f8f9fa;
        }
        
        .footer-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            flex-wrap: wrap;
        }
        
        .footer-logo {
            height: 40px;
            width: auto;
        }
        
        .footer-text {
            color: #666;
            font-size: 14px;
            font-weight: 500;
        }
        
        @media print {
            .footer {
                margin-top: 40px;
                background: white;
            }
        }
    </style>
</head>
<body>
    <div class="export-buttons no-print">
        <button class="btn" onclick="window.print()">📄 Print/Save PDF</button>
        <button class="btn btn-secondary" onclick="window.close()">✖ Close</button>
    </div>

    <div class="header">
        <h1>Brand Analysis Report</h1>
        <div class="subtitle">Query: "${selectedQuery?.query || "Export"}"</div>
        <div class="meta">
            Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
        </div>
    </div>

    <div class="section">
        <h2>📊 Executive Summary</h2>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${validBrands.length}</div>
                <div class="metric-label">Total Brands Analyzed</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${
                  sortedBrands[0]?.brand_name || "N/A"
                }</div>
                <div class="metric-label">Top Performing Brand</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${
                  sortedBrands[0]?.total_mentions || 0
                }</div>
                <div class="metric-label">Highest Mentions</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${
                  validBrands.length > 0
                    ? (
                        validBrands.reduce(
                          (sum, brand) => sum + getVisibilityScore(brand),
                          0
                        ) / validBrands.length
                      ).toFixed(1)
                    : "0"
                }%</div>
                <div class="metric-label">Average Visibility Score</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>🏆 Brand Rankings</h2>
        <table>
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Brand Name</th>
                    <th>Total Mentions</th>
                    <th>Coverage Ratio</th>
                    <th>Visibility Score</th>
                    <th>GPT 4o</th>
                    <th>Claude 4.0</th>
                    <th>Perplexity</th>
                    <th>Gemini 2.5</th>
                    <th>AI Overview</th>
                    <th>AI Mode</th>
                </tr>
            </thead>
            <tbody>
                ${sortedBrands
                  .map(
                    (brand, index) => `
                    <tr>
                        <td><strong>#${index + 1}</strong></td>
                        <td><strong>${
                          brand.brand_name || "Unknown"
                        }</strong></td>
                        <td>${brand.total_mentions || 0}</td>
                        <td>${getCoverageRatio(brand).toFixed(1)}%</td>
                        <td>${getVisibilityScore(brand).toFixed(1)}%</td>
                        <td><span class="coverage-indicator ${
                          (brand.gpt_search_mentions || 0) > 0
                            ? "covered"
                            : "not-covered"
                        }">${
                      (brand.gpt_search_mentions || 0) > 0 ? "✓" : "✗"
                    }</span></td>
                        <td><span class="coverage-indicator ${
                          (brand.claude_mentions || 0) > 0
                            ? "covered"
                            : "not-covered"
                        }">${
                      (brand.claude_mentions || 0) > 0 ? "✓" : "✗"
                    }</span></td>
                        <td><span class="coverage-indicator ${
                          (brand.perplexity_mentions || 0) > 0
                            ? "covered"
                            : "not-covered"
                        }">${
                      (brand.perplexity_mentions || 0) > 0 ? "✓" : "✗"
                    }</span></td>
                        <td><span class="coverage-indicator ${
                          (brand.gemini_mentions || 0) > 0
                            ? "covered"
                            : "not-covered"
                        }">${
                      (brand.gemini_mentions || 0) > 0 ? "✓" : "✗"
                    }</span></td>
                        <td><span class="coverage-indicator ${
                          (brand.ai_overview_mentions || 0) > 0
                            ? "covered"
                            : "not-covered"
                        }">${
                      (brand.ai_overview_mentions || 0) > 0 ? "✓" : "✗"
                    }</span></td>
                        <td><span class="coverage-indicator ${
                          (brand.google_ai_mode_mentions || 0) > 0
                            ? "covered"
                            : "not-covered"
                        }">${
                      (brand.google_ai_mode_mentions || 0) > 0 ? "✓" : "✗"
                    }</span></td>
                    </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>
    </div>

    <div class="page-break"></div>
    
    <div class="section">
        <h2>📈 Visual Analytics</h2>
        
        <div class="chart-container">
            <div class="chart-title">Top 10 Brands - Visibility Score Analysis</div>
            <div style="position: relative; height: 400px; width: 100%;">
                <canvas id="visibilityChart" class="chart-canvas"></canvas>
            </div>
        </div>
        
        <div class="chart-container">
            <div class="chart-title">AI Model Coverage Comparison</div>
            <div style="position: relative; height: 400px; width: 100%;">
                <canvas id="modelChart" class="chart-canvas"></canvas>
            </div>
        </div>
    </div>

    <script>
        // Generate charts after page loads
        window.addEventListener('load', function() {
            // Visibility Score Chart
            const visibilityCtx = document.getElementById('visibilityChart').getContext('2d');
            const topBrands = ${JSON.stringify(
              sortedBrands.slice(0, 10).map((brand) => ({
                name: brand.brand_name,
                score: getVisibilityScore(brand),
              }))
            )};
            
            new Chart(visibilityCtx, {
                type: 'bar',
                data: {
                    labels: topBrands.map(brand => brand.name),
                    datasets: [{
                        label: 'Visibility Score (%)',
                        data: topBrands.map(brand => brand.score),
                        backgroundColor: '#366092',
                        borderColor: '#366092',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: { display: true, text: 'Visibility Score (%)' }
                        },
                        x: {
                            title: { display: true, text: 'Brands' }
                        }
                    },
                    layout: {
                        padding: 10
                    }
                }
            });

            // Model Coverage Chart
            const modelCtx = document.getElementById('modelChart').getContext('2d');
            const modelStats = [
                { name: 'GPT 4o Search', count: ${
                  validBrands.filter((b) => (b.gpt_search_mentions || 0) > 0)
                    .length
                } },
                { name: 'Claude 4.0', count: ${
                  validBrands.filter((b) => (b.claude_mentions || 0) > 0).length
                } },
                { name: 'Perplexity', count: ${
                  validBrands.filter((b) => (b.perplexity_mentions || 0) > 0)
                    .length
                } },
                { name: 'Gemini 2.5', count: ${
                  validBrands.filter((b) => (b.gemini_mentions || 0) > 0).length
                } },
                { name: 'AI Overview', count: ${
                  validBrands.filter((b) => (b.ai_overview_mentions || 0) > 0)
                    .length
                } },
                { name: 'AI Mode', count: ${
                  validBrands.filter(
                    (b) => (b.google_ai_mode_mentions || 0) > 0
                  ).length
                } }
            ];
            
            new Chart(modelCtx, {
                type: 'bar',
                data: {
                    labels: modelStats.map(stat => stat.name),
                    datasets: [{
                        label: 'Brands Mentioned',
                        data: modelStats.map(stat => stat.count),
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'],
                        borderColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: 'Number of Brands' }
                        },
                        x: {
                            title: { display: true, text: 'AI Models' }
                        }
                    },
                    layout: {
                        padding: 10
                    }
                }
            });
        });
    </script>

    <div class="footer">
        <div class="footer-content">
            <img src="https://airankia.com/icons/air-logo-dark.png" alt="AI Rankia Logo" class="footer-logo">
            <div class="footer-text">
                Report created on AI Rankia
            </div>
        </div>
    </div>
</body>
</html>`;

      // Create and download HTML file
      const blob = new Blob([reportHTML], { type: "text/html" });
      const url = URL.createObjectURL(blob);

      // Open in new window for printing/PDF
      const newWindow = window.open(url, "_blank");
      if (newWindow) {
        newWindow.focus();
      } else {
        // Fallback: download as file
        const link = document.createElement("a");
        link.href = url;
        link.download = `brand-analysis-report-${(
          selectedQuery?.query || "export"
        )
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase()}-${new Date().toISOString().split("T")[0]}.html`;
        link.click();
      }

      toastSonner.success(
        "🎉 HTML Report generated! Use Print → Save as PDF for PDF export."
      );
    } catch (error) {
      console.error("HTML Report export error:", error);
      toastSonner.error("Failed to generate HTML report");
    }
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
    allModels.push("Google AI Overview");
    return [...new Set(allModels)];
  }, [results]);

  // Helper function to filter results by date range
  const getDateFilteredResults = useMemo(() => {
    if (!results || !Array.isArray(results)) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (selectedDateRange) {
      case "today":
        return results.filter((result) => {
          const resultDate = new Date(result.analysis_date);
          const resultDateOnly = new Date(
            resultDate.getFullYear(),
            resultDate.getMonth(),
            resultDate.getDate()
          );
          return resultDateOnly.getTime() === today.getTime();
        });
      case "7days":
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        return results.filter((result) => {
          const resultDate = new Date(result.analysis_date);
          return resultDate >= sevenDaysAgo && resultDate <= now;
        });
      case "30days":
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        return results.filter((result) => {
          const resultDate = new Date(result.analysis_date);
          return resultDate >= thirtyDaysAgo && resultDate <= now;
        });
      case "custom":
        if (!customDateRange.from || !customDateRange.to) return results;
        return results.filter((result) => {
          const resultDate = new Date(result.analysis_date);
          return (
            resultDate >= customDateRange.from! &&
            resultDate <= customDateRange.to!
          );
        });
      case "all":
      default:
        return results;
    }
  }, [results, selectedDateRange, customDateRange]);

  // Filter analysis brands based on selected date and model
  const filteredAnalysisBrands = useMemo(() => {
    if (!results || !Array.isArray(results)) return [];

    // Filter results based on selected date range
    const dateFilteredResults = getDateFilteredResults;

    const flat_google_overview_brands =
      googleSearchResults?.search_results
        ?.flatMap((result: GoogleSearch) => {
          try {
            if (!result.rankings) return [];
            const rankings =
              typeof result.rankings === "string"
                ? JSON.parse(result.rankings)
                : result.rankings;
            return rankings.brands
              .map((rank: any) => rank.name)
              .filter(Boolean);
          } catch (e) {
            console.error("Error parsing rankings:", e);
            return [];
          }
        })
        .filter(Boolean) || [];

    const unique_google_overview_brands = [
      ...new Set(flat_google_overview_brands),
    ];

    // Extract brands from the date-filtered results, considering model filter
    const filteredBrands = dateFilteredResults
      .flatMap((result) => {
        // If AI Overview is selected, return Google brands
        if (
          Array.from(selectedModel).some(
            (model) => model.toLowerCase() === "google ai overview"
          )
        ) {
          return unique_google_overview_brands.map((brand) => ({
            name: brand,
          }));
        }

        // Otherwise, process model results as before
        return result.model_results
          ?.filter((modelResult: { llm_name: string }) => {
            if (selectedModel.size === 0) return true;
            return selectedModel.has(modelResult.llm_name);
          })
          .flatMap(
            (modelResult: { llm_name: string; data: { brands: any[] } }) =>
              modelResult.data?.brands || []
          )
          .filter(Boolean);
      })
      .filter(Boolean);

    // Deduplicate based on brand name
    const uniqueBrands = new Map();
    filteredBrands.forEach((brand) => {
      if (brand.name && !uniqueBrands.has(brand.name)) {
        uniqueBrands.set(brand.name, brand);
      }
    });

    return Array.from(uniqueBrands.values());
  }, [results, selectedDateRange, selectedModel, customDateRange]);

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

    // Safely extract and parse rankings from Google search results
    const flat_google_overview_brands =
      googleSearchResults?.search_results
        ?.flatMap((result: GoogleSearch) => {
          try {
            if (!result.rankings) return [];
            const rankings =
              typeof result.rankings === "string"
                ? JSON.parse(result.rankings)
                : result.rankings;
            return rankings.brands
              .map((rank: any) => rank.name)
              .filter(Boolean);
          } catch (e) {
            console.error("Error parsing rankings:", e);
            return [];
          }
        })
        .filter(Boolean) || [];

    const unique_google_overview_brands = [
      ...new Set(flat_google_overview_brands),
    ];

    // Deduplicate based on brand name
    const uniqueBrands = new Map();
    allBrands.forEach((brand) => {
      if (brand.name && !uniqueBrands.has(brand.name)) {
        uniqueBrands.set(brand.name, brand);
      }
    });
    unique_google_overview_brands.forEach((brand) => {
      if (brand && !uniqueBrands.has(brand)) {
        uniqueBrands.set(brand, { name: brand });
      }
    });

    return Array.from(uniqueBrands.values());
  }, [googleSearchResults?.search_results, results]);

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
    const google_overview = googleSearchResults?.search_results.flatMap(
      (result: GoogleSearch) => result.ai_overview
    );

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
          claude_mentions: 0,
          perplexity_mentions: 0,
          gemini_mentions: 0,
          gpt_search_mentions: 0,
          ai_overview_mentions: 0,
          google_ai_mode_mentions: 0,
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
              if (modelName.includes("claude")) {
                mentions.claude_mentions += mentionCount;
              } else if (modelName.includes("perplexity")) {
                mentions.perplexity_mentions += mentionCount;
              } else if (modelName.includes("gemini")) {
                mentions.gemini_mentions += mentionCount;
              } else if (modelName.includes("search")) {
                mentions.gpt_search_mentions += mentionCount;
              } else if (modelName.includes("ai overview")) {
                mentions.ai_overview_mentions += mentionCount;
              } else if (modelName.includes("google ai mode")) {
                mentions.google_ai_mode_mentions += mentionCount;
              }
            }
          }
        );

        if (google_overview) {
          google_overview.forEach((overview: any) => {
            if (overview.includes(brandName)) {
              mentions.ai_overview_mentions += 1;
            }
          });
        }

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
    const google_overview = googleSearchResults?.search_results.flatMap(
      (result: GoogleSearch) => result.ai_overview
    );

    // Filter results based on selected date range (same logic as filteredAnalysisBrands)
    const dateFilteredResults = getDateFilteredResults;

    // Initialize a map to store brand mentions
    const brandMentionsMap = new Map();

    // Process each brand
    analysis_brands.forEach((brand) => {
      const brandName = brand.name;
      const mentions = {
        claude_mentions: 0,
        perplexity_mentions: 0,
        gemini_mentions: 0,
        gpt_search_mentions: 0,
        ai_overview_mentions: 0,
        google_ai_mode_mentions: 0,
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
              if (modelName.includes("claude")) {
                mentions.claude_mentions += mentionCount;
              } else if (modelName.includes("perplexity")) {
                mentions.perplexity_mentions += mentionCount;
              } else if (modelName.includes("gemini")) {
                mentions.gemini_mentions += mentionCount;
              } else if (modelName.includes("search")) {
                mentions.gpt_search_mentions += mentionCount;
              } else if (modelName.includes("ai overview")) {
                mentions.ai_overview_mentions += mentionCount;
              } else if (modelName.includes("google ai mode")) {
                mentions.google_ai_mode_mentions += mentionCount;
              }
            }
          }
        );
      });

      if (google_overview) {
        google_overview.forEach((overview: any) => {
          if (overview.includes(brandName)) {
            mentions.ai_overview_mentions += 1;
          }
        });
      }

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
  }, [
    results,
    analysis_brands,
    googleSearchResults?.search_results,
    selectedDateRange,
    selectedModel,
    customDateRange,
    getDateFilteredResults,
  ]);

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
    if (brandMentionsInSummaries && brandMentionsInSummaries.length > 0) {
      const firstBrandName = brandMentionsInSummaries[0]?.brand_name;
      if (selectedBrands.size === 0) {
        setSelectedBrands(new Set([firstBrandName]));
      } else if (selectedBrands.size > 0) {
        // Get the first selected brand name
        const firstSelectedBrand = Array.from(selectedBrands)[0];
        // Check if the selected brand exists in the current brand mentions
        const brandExists = brandMentionsInSummaries.some(
          (brand) => brand.brand_name === firstSelectedBrand
        );
        if (!brandExists) {
          setSelectedBrands(new Set([firstBrandName]));
        }
      }
    }
  }, [brandMentionsInSummaries, selectedBrands]);

  // Effect to reset filters when prompt changes
  useEffect(() => {
    // Reset filters when the prompt changes
    if (selectedQuery) {
      setSelectedModel(new Set<string>([])); // Reset to empty set (show all models)
      setSelectedDateRange("all");
      setCustomDateRange({ from: undefined, to: undefined });
      console.log("Prompt changed, resetting filters");
    }
  }, [selectedQuery]);

  // Fetch Google search results using the monitoring API
  const fetchGoogleSearchResults = async (
    mode_id: string,
    dateRange?: string,
    customRange?: { from: Date | undefined; to: Date | undefined }
  ) => {
    if (!mode_id) return;

    try {
      setLoadingGoogleResults(true);
      const response = await fetch(`/api/monitoring?mode_id=${mode_id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch Google search results");
      }

      const data = await response.json();

      // Filter search results by date range if provided
      if (dateRange && dateRange !== "all" && data.search_results) {
        const now = new Date();
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        const filteredResults = data.search_results.filter((result: any) => {
          if (!result.created_at) return false;
          const resultDate = new Date(result.created_at);

          switch (dateRange) {
            case "today":
              const resultDateOnly = new Date(
                resultDate.getFullYear(),
                resultDate.getMonth(),
                resultDate.getDate()
              );
              return resultDateOnly.getTime() === today.getTime();
            case "7days":
              const sevenDaysAgo = new Date(today);
              sevenDaysAgo.setDate(today.getDate() - 7);
              return resultDate >= sevenDaysAgo && resultDate <= now;
            case "30days":
              const thirtyDaysAgo = new Date(today);
              thirtyDaysAgo.setDate(today.getDate() - 30);
              return resultDate >= thirtyDaysAgo && resultDate <= now;
            case "custom":
              if (!customRange?.from || !customRange?.to) return true;
              return (
                resultDate >= customRange.from && resultDate <= customRange.to
              );
            default:
              return true;
          }
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
      fetchGoogleSearchResults(
        selectedQuery.mode_id,
        selectedDateRange,
        customDateRange
      );
    }
  }, [selectedQuery, selectedDateRange, customDateRange]);

  const isNotDesktop = useMediaQuery("(max-width: 1024px)");

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

  if (!subsLoading && !subscription && !loading) {
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
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full !border !border-accent md:w-fit rounded-full"
                >
                  <Filter className="w-4 h-4" />
                  {currentBrand ? currentBrand.name : "Select a Brand"}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="pb-2 px-2 space-y-3 rounded-xl w-50"
              >
                <DropdownMenuLabel className="text-xs text-white/20 ">
                  Brand Options
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setCurrentBrand(null)} className="rounded-md">
                  <div className="flex items-center gap-2">
                    <span>View All Prompts</span>
                  </div>
                </DropdownMenuItem>
                {userBrands.map((brand) => (
                  <DropdownMenuItem
                  key={brand?.id}
                    onClick={() => setCurrentBrand(brand)}
                    className="rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <span>{brand.name}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
                <Tabs defaultValue="ai-analysis" className="w-full">
                  <TabsList className="w-full bg-background h-14">
                    <TabsTrigger
                      value="ai-analysis"
                      className="data-[state=active]:!bg-blue-500/20 border-none rounded-full"
                    >
                      <Gemini.Color className="w-4 h-4" />
                      AI Analysis
                    </TabsTrigger>
                    <TabsTrigger
                      value="citations"
                      className="data-[state=active]:!bg-blue-500/20 border-none rounded-lg"
                    >
                      <TextSearch className="w-4 h-4" />
                      Citations
                    </TabsTrigger>
                    <TabsTrigger
                      value="google-search"
                      className="data-[state=active]:!bg-blue-500/20 border-none rounded-full"
                    >
                      <Search className="w-4 h-4" />
                      Google Search
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="ai-analysis" className="space-y-4">
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
                        <p className="text-muted-foreground">
                          {queries.length} total prompts
                        </p>
                        {"•"}
                        <p className="text-muted-foreground">
                          {
                            queries.filter((query) => query.status === "active")
                              .length
                          }{" "}
                          active
                        </p>
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
                        {/* Export Buttons */}
                        <div className="flex gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full !border !border-accent md:w-fit rounded-full"
                              >
                                <Download className="w-4 h-4" />
                                Export
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="start"
                              className="pb-2 px-2 space-y-3 rounded-xl w-50"
                            >
                              <DropdownMenuLabel className="text-xs text-white/20 ">
                                Export Options
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={exportToCSV}
                                className="rounded-md"
                              >
                                <div className="flex items-center gap-2">
                                  <span>Export as CSV</span>
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={exportToExcelWithCharts}
                                className="rounded-md"
                              >
                                <div className="flex items-center gap-2">
                                  <span>Export as Excel</span>
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={exportToHTMLReport}
                                className="rounded-md"
                              >
                                <div className="flex items-center gap-2">
                                  <span>Generate HTML Report</span>
                                </div>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

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
                          <DropdownMenuContent className="w-80">
                            <DropdownMenuLabel>
                              Filter by Brand
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            {/* Search Input */}
                            <div className="px-2 py-2">
                              <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Search brands..."
                                  value={brandSearchQuery}
                                  onChange={(e) =>
                                    setBrandSearchQuery(e.target.value)
                                  }
                                  className="pl-8"
                                />
                              </div>
                            </div>

                            {/* Selected Brands Grid */}
                            {selectedBrands.size > 0 &&
                              !selectedBrands.has("all") && (
                                <div className="px-2 py-2">
                                  <div className="text-xs text-muted-foreground mb-2">
                                    Selected ({selectedBrands.size})
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {Array.from(selectedBrands).map(
                                      (brandName) => (
                                        <div
                                          key={brandName}
                                          className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs"
                                        >
                                          <span className="truncate max-w-24">
                                            {brandName}
                                          </span>
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              removeBrandFromSelection(
                                                brandName
                                              );
                                            }}
                                            className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        </div>
                                      )
                                    )}
                                  </div>
                                  <DropdownMenuSeparator className="my-2" />
                                </div>
                              )}

                            {/* All Brands Option */}
                            <DropdownMenuCheckboxItem
                              checked={selectedBrands.has("all")}
                              onCheckedChange={(checked) =>
                                handleCheckedChange("all", checked)
                              }
                            >
                              All Brands
                            </DropdownMenuCheckboxItem>

                            {/* Scrollable Brand List */}
                            <ScrollArea className="h-[200px]">
                              {filteredBrandsForSearch?.length > 0 ? (
                                filteredBrandsForSearch.map((brand, index) => (
                                  <DropdownMenuCheckboxItem
                                    key={index}
                                    checked={selectedBrands.has(brand.name)}
                                    onCheckedChange={(checked) =>
                                      handleCheckedChange(brand.name, checked)
                                    }
                                  >
                                    {brand.name}
                                  </DropdownMenuCheckboxItem>
                                ))
                              ) : (
                                <div className="px-2 py-2 text-sm text-muted-foreground text-center">
                                  {brandSearchQuery
                                    ? "No brands found"
                                    : "No brands available"}
                                </div>
                              )}
                            </ScrollArea>

                            {/* Clear Search */}
                            {brandSearchQuery && (
                              <>
                                <DropdownMenuSeparator />
                                <div className="px-2 py-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setBrandSearchQuery("")}
                                    className="w-full text-xs"
                                  >
                                    Clear Search
                                  </Button>
                                </div>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Date Range Selection */}
                        {isNotDesktop ? (
                          <div className="grid grid-cols-4 w-full items-center gap-2 whitespace-nowrap">
                            <Button
                              variant={
                                selectedDateRange === "today"
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => {
                                setSelectedDateRange("today");
                                setCustomDateRange({
                                  from: undefined,
                                  to: undefined,
                                });
                              }}
                              className={`text-xs ${
                                selectedDateRange === "today" &&
                                "rounded-full bg-blue-500/20 text-blue-500 border border-blue-500 hover:text-white"
                              }`}
                            >
                              Today
                            </Button>
                            <Button
                              variant={
                                selectedDateRange === "7days"
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => {
                                setSelectedDateRange("7days");
                                setCustomDateRange({
                                  from: undefined,
                                  to: undefined,
                                });
                              }}
                              className={`text-xs ${
                                selectedDateRange === "7days" &&
                                "rounded-full bg-blue-500/20 text-blue-500 border border-blue-500 hover:text-white"
                              }`}
                            >
                              7 Days
                            </Button>
                            <Button
                              variant={
                                selectedDateRange === "30days"
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => {
                                setSelectedDateRange("30days");
                                setCustomDateRange({
                                  from: undefined,
                                  to: undefined,
                                });
                              }}
                              className={`text-xs ${
                                selectedDateRange === "30days" &&
                                "rounded-full bg-blue-500/20 text-blue-500 border border-blue-500 hover:text-white"
                              }`}
                            >
                              30 Days
                            </Button>
                            <Button
                              variant={
                                selectedDateRange === "all"
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => {
                                setSelectedDateRange("all");
                                setCustomDateRange({
                                  from: undefined,
                                  to: undefined,
                                });
                              }}
                              className={`text-xs ${
                                selectedDateRange === "all" &&
                                "rounded-full bg-blue-500/20 text-blue-500 border border-blue-500 hover:text-white"
                              }`}
                            >
                              All Time
                            </Button>

                            {/* Custom Date Range Picker */}
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant={
                                    selectedDateRange === "custom"
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  className={cn(
                                    "text-xs justify-start text-left font-normal col-span-2",
                                    !customDateRange.from &&
                                      !customDateRange.to &&
                                      "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {customDateRange.from ? (
                                    customDateRange.to ? (
                                      <>
                                        {format(
                                          customDateRange.from,
                                          "LLL dd, y"
                                        )}{" "}
                                        -{" "}
                                        {format(
                                          customDateRange.to,
                                          "LLL dd, y"
                                        )}
                                      </>
                                    ) : (
                                      format(customDateRange.from, "LLL dd, y")
                                    )
                                  ) : (
                                    <span>Pick a date range</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  initialFocus
                                  mode="range"
                                  defaultMonth={customDateRange.from}
                                  selected={customDateRange}
                                  onSelect={(range) => {
                                    setCustomDateRange(
                                      range || {
                                        from: undefined,
                                        to: undefined,
                                      }
                                    );
                                    if (range?.from && range?.to) {
                                      setSelectedDateRange("custom");
                                    }
                                  }}
                                  numberOfMonths={2}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group">
                            <Button
                              size="sm"
                              variant="outline"
                              className={`min-w-[120px] text-sm py-4 rounded-full !border !border-accent`}
                            >
                              <span className="group-hover:hidden">
                                {selectedDateRange === "today" ? (
                                  "Today"
                                ) : selectedDateRange === "7days" ? (
                                  "7 Days"
                                ) : selectedDateRange === "30days" ? (
                                  "30 Days"
                                ) : selectedDateRange === "all" ? (
                                  "All Time"
                                ) : customDateRange.from ? (
                                  customDateRange.to ? (
                                    <>
                                      {format(
                                        customDateRange.from,
                                        "LLL dd, y"
                                      )}{" "}
                                      -{" "}
                                      {format(customDateRange.to, "LLL dd, y")}
                                    </>
                                  ) : (
                                    format(customDateRange.from, "LLL dd, y")
                                  )
                                ) : (
                                  <span>Select Date Range</span>
                                )}
                              </span>
                              <span className="hidden group-hover:block">
                                Select Date Range
                              </span>
                            </Button>
                            <div className="flex items-center gap-2 opacity-0 max-w-0 group-hover:max-w-[600px] group-hover:ml-2 group-hover:opacity-100 transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap">
                              <Button
                                variant={
                                  selectedDateRange === "today"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => {
                                  setSelectedDateRange("today");
                                  setCustomDateRange({
                                    from: undefined,
                                    to: undefined,
                                  });
                                }}
                                className={`text-xs ${
                                  selectedDateRange === "today" &&
                                  "rounded-full bg-blue-500/20 text-blue-500 border border-blue-500 hover:text-white"
                                }`}
                              >
                                Today
                              </Button>
                              <Button
                                variant={
                                  selectedDateRange === "7days"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => {
                                  setSelectedDateRange("7days");
                                  setCustomDateRange({
                                    from: undefined,
                                    to: undefined,
                                  });
                                }}
                                className={`text-xs ${
                                  selectedDateRange === "7days" &&
                                  "rounded-full bg-blue-500/20 text-blue-500 border border-blue-500 hover:text-white"
                                }`}
                              >
                                7 Days
                              </Button>
                              <Button
                                variant={
                                  selectedDateRange === "30days"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => {
                                  setSelectedDateRange("30days");
                                  setCustomDateRange({
                                    from: undefined,
                                    to: undefined,
                                  });
                                }}
                                className={`text-xs ${
                                  selectedDateRange === "30days" &&
                                  "rounded-full bg-blue-500/20 text-blue-500 border border-blue-500 hover:text-white"
                                }`}
                              >
                                30 Days
                              </Button>
                              <Button
                                variant={
                                  selectedDateRange === "all"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => {
                                  setSelectedDateRange("all");
                                  setCustomDateRange({
                                    from: undefined,
                                    to: undefined,
                                  });
                                }}
                                className={`text-xs ${
                                  selectedDateRange === "all" &&
                                  "rounded-full bg-blue-500/20 text-blue-500 border border-blue-500 hover:text-white"
                                }`}
                              >
                                All Time
                              </Button>

                              {/* Custom Date Range Picker */}
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant={
                                      selectedDateRange === "custom"
                                        ? "default"
                                        : "outline"
                                    }
                                    size="sm"
                                    className={cn(
                                      "text-xs justify-start text-left font-normal",
                                      !customDateRange.from &&
                                        !customDateRange.to &&
                                        "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {customDateRange.from ? (
                                      customDateRange.to ? (
                                        <>
                                          {format(
                                            customDateRange.from,
                                            "LLL dd, y"
                                          )}{" "}
                                          -{" "}
                                          {format(
                                            customDateRange.to,
                                            "LLL dd, y"
                                          )}
                                        </>
                                      ) : (
                                        format(
                                          customDateRange.from,
                                          "LLL dd, y"
                                        )
                                      )
                                    ) : (
                                      <span>Pick a date range</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-0"
                                  align="start"
                                >
                                  <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={customDateRange.from}
                                    selected={customDateRange}
                                    onSelect={(range) => {
                                      setCustomDateRange(
                                        range || {
                                          from: undefined,
                                          to: undefined,
                                        }
                                      );
                                      if (range?.from && range?.to) {
                                        setSelectedDateRange("custom");
                                      }
                                    }}
                                    numberOfMonths={2}
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        )}

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
                            <DropdownMenuLabel>
                              Filter by Model
                            </DropdownMenuLabel>
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
                          onClick={() =>
                            setShowGoogleResults(!showGoogleResults)
                          }
                          variant="outline"
                          className={`rounded-full !border !border-accent group ${
                            showGoogleResults && "opacity-60"
                          }`}
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden group-hover:block">
                            {showGoogleResults
                              ? "Hide Google Results"
                              : "Show Google Results"}
                          </span>
                        </Button>
                      </div>
                    </motion.div>
                    <p className="text-muted-foreground items-center flex">
                      <Eye className="w-4 h-4 mr-2" />
                      Currently viewing:{" "}
                      <em className="text-white">
                        &quot;{selectedQuery?.query}&quot;
                      </em>
                    </p>
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
                    
                    {/* Check for unavailable selected models and show empty states */}
                    {(() => {
                      const isAiOverviewSelected = selectedModel.has("Google AI Overview");
                      const isAiModeSelected = selectedModel.has("Google AI Mode");
                      const hasAiOverviewData = brandMentionsInSummaries?.some(b => (b.ai_overview_mentions || 0) > 0) || false;
                      const hasAiModeData = brandMentionsInSummaries?.some(b => (b.google_ai_mode_mentions || 0) > 0) || false;

                      const selectedUnavailableModels = [];
                      if (isAiOverviewSelected && !hasAiOverviewData) selectedUnavailableModels.push("Google AI Overview");
                      if (isAiModeSelected && !hasAiModeData) selectedUnavailableModels.push("Google AI Mode");

                      // If we have selected models but they're all unavailable, show empty state
                      if (selectedModel.size > 0 &&
                          ((isAiOverviewSelected && !hasAiOverviewData) || (isAiModeSelected && !hasAiModeData)) &&
                          selectedModel.size === (
                              (isAiOverviewSelected && !hasAiOverviewData ? 1 : 0) +
                              (isAiModeSelected && !hasAiModeData ? 1 : 0)
                          )
                      ) {
                        return (
                          <Card className="bg-background shadow-none border-[#e2e2e2]/70 dark:border-accent">
                            <CardContent className="flex flex-col items-center justify-center py-16">
                              <div className="text-center space-y-4">
                                <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto">
                                  <Info className="w-6 h-6 text-yellow-500" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold">Selected Model{selectedUnavailableModels.length > 1 ? 's' : ''} Not Available</h3>
                                  <p className="text-muted-foreground mt-2 max-w-md">
                                    {selectedUnavailableModels.includes("Google AI Overview") && selectedUnavailableModels.includes("Google AI Mode") ? (
                                      <>Google AI Overview and Google AI Mode are not available for this query. Google AI Overview requires specific search results, and Google AI Mode only works with English prompts.</>
                                    ) : selectedUnavailableModels.includes("Google AI Overview") ? (
                                      <>Google AI Overview is not available for this query. This feature requires specific Google search results to be present.</>
                                    ) : (
                                      <>Google AI Mode is not available for this query. This feature only works with English language prompts.</>
                                    )}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-3">
                                    Try selecting different models or use &quot;All Models&quot; to see available data.
                                  </p>
                                </div>
                                <Button
                                  variant="outline"
                                  onClick={() => setSelectedModel(new Set<string>([]))}
                                  className="mt-4"
                                >
                                  Show All Available Models
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      }
                      return null;
                    })()}

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
                    <StepsTabContent
                      citations={(() => {
                        if (!results || results.length === 0) return null;

                        // Extract citations from model_summary using new schema
                        const allCitations: any[] = [];

                        results
                          .flatMap((result: any) => result.model_summary || [])
                          .flatMap((summary: any) => summary.reasoning || [])
                          .forEach((item: any) => {
                            if (item && typeof item === "object") {
                              // Handle url_citation.url (nested structure)
                              if (item.url_citation?.url) {
                                allCitations.push({
                                  url: item.url_citation.url,
                                  title: item.url_citation.title || "No title",
                                  snippet:
                                    item.url_citation.snippet || "No snippet",
                                  source:
                                    item.source ||
                                    item.domain ||
                                    "Unknown source",
                                });
                              }
                              // Handle direct url field
                              if (
                                item.url &&
                                item.url !== item.url_citation?.url
                              ) {
                                allCitations.push({
                                  url: item.url,
                                  title: item.title || "No title",
                                  snippet: item.text || "No snippet",
                                  source:
                                    item.source ||
                                    item.domain ||
                                    "Unknown source",
                                });
                              }
                            }
                          });

                        return allCitations.length > 0 ? allCitations : null;
                      })()}
                      monitoringId={selectedQuery?.mode_id || ""}
                      prompt={selectedQuery?.query || ""}
                      country={selectedQuery?.location || ""}
                      brand={currentBrand}
                      orientation={"horizontal"}
                    />
                    {/* <Tabs defaultValue="keywords" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 bg-muted/20">
                        <TabsTrigger
                          value="keywords"
                          className="data-[state=active]:bg-blue-500/10"
                        >
                          Keywords
                        </TabsTrigger>
                        <TabsTrigger
                          value="steps"
                          className="data-[state=active]:bg-blue-500/10"
                        >
                          Steps
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="keywords">
                        <KeywordAnalysisCard />
                      </TabsContent>
                      <TabsContent value="steps">
                       
                      </TabsContent>
                    </Tabs> */}
                  </TabsContent>
                  <TabsContent value="citations">
                    <CitationsCard
                      results={results || []}
                      selectedDateRange={selectedDateRange}
                      customDateRange={customDateRange}
                      selectedModel={selectedModel}
                      googleSearchResults={googleSearchResults}
                    />
                  </TabsContent>
                  <TabsContent value="google-search">
                    <div className="">
                      {showGoogleResults &&
                        googleSearchResults &&
                        googleSearchResults.search_results &&
                        googleSearchResults.search_results.length > 0 && (
                          <ScrollArea className="min-h-[500px] w-full">
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
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full h-full">
                  {/* {keywords && (
                      <KeywordCloud keywords={keywords} />
                  )} */}
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
