"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Telescope,
  Check,
  ArrowRightIcon,
  ClockIcon,
  CalendarIcon,
  Lightbulb,
  Search,
  Repeat,
  MapPin,
  Paperclip,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { AnalysisMode } from "@/types/search";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "./button";
import { motion } from "framer-motion";
import { UserSubscription } from "@/hooks/useAuth";
import { LoadingState } from "../loading-state";
import { Brand } from "@/contexts/brand-data-context";
import { domains } from "@/types/domains";
import { User } from "@supabase/supabase-js";
import Stripe from "stripe";
import { getConstraints } from "@/lib/constraints";
import { AttachBrandModal } from "../dashboard/attach-brand-modal";
import { supabase } from "@/lib/supabase";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AiStudio, Claude, DeepSeek, Gemini, Google, Grok, Meta, OpenAI, Perplexity } from "@lobehub/icons";


interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      // Temporarily shrink to get the right scrollHeight
      textarea.style.height = `${minHeight}px`;

      // Calculate new height
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
      );

      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    // Set initial height
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  // Adjust height on window resize
  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

interface AIChatInterfaceProps {
  user: User | null;
  session: string;
  product: Stripe.Product | null;
  subscription: UserSubscription | null;
  monitoring?: string | null;
  attachedBrandId?: string | null;
}

interface ModelInfo {
  key: string;
  name: string;
  credit_cost: number;
}

interface ModelsData {
  explorer: {
    models: ModelInfo[];
    max_credits_per_analysis: number;
    credit_cost_per_model: number;
    google_ai_overview_cost: number;
  };
  voyager: {
    models: ModelInfo[];
    max_credits_per_analysis: number;
    credit_cost_per_model: number;
    google_ai_overview_cost: number;
  };
}

export function AIChatInterface({
  user,
  session,
  product,
  subscription,
  monitoring,
  attachedBrandId,
}: AIChatInterfaceProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<AnalysisMode>("Explorer");
  const [loading, setLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMonitoringMode, setIsMonitoringMode] = useState(
    monitoring === "true" ? true : false
  );
  const [attachedBrand, setAttachedBrand] = useState<Brand | null>(
    attachedBrandId
      ? ({
          id: attachedBrandId,
          name: "Your Brand",
          industry: "",
          logo_url: "",
          website: "",
          language: "",
          location: "",
          created_at: "",
        } as Brand)
      : null
  );
  const [monitorFrequency, setMonitorFrequency] = useState<"daily" | "weekly">(
    "daily"
  );
  const [open, setOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [location, setLocation] = useState("");


    // Model to icon mapping
    const modelIcons: Record<
    string,
    React.ComponentType<{ className?: string }>
  > = {
    "gpt-4o-search": OpenAI,
    "claude-search": Claude.Color,
    "perplexity-sonar": Perplexity,
    "gemini-search": Gemini.Color,
    "google-ai-mode": AiStudio.Color,
    "google-ai-overview": Gemini.Color,
    "deepseek-v3": DeepSeek.Color,
    "gpt-4.1-nano": OpenAI,
    "grok-3-mini": Grok,
    "llama-4-maverick": Meta.Color,
  };


  // New state for credit-based model selection
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [includeGoogleSearch, setIncludeGoogleSearch] = useState(true);
  const [modelsData, setModelsData] = useState<ModelsData | null>(null);
  const [creditsRequired, setCreditsRequired] = useState(0);

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Fetch available models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch("/api/search/models");
        if (response.ok) {
          const data = await response.json();
          setModelsData(data);

          // Set default selected models (all models for current mode)
          const currentModeModels =
            data[mode.toLowerCase() as "explorer" | "voyager"]?.models || [];
          setSelectedModels(
            currentModeModels.map((model: ModelInfo) => model.key)
          );
        }
      } catch (error) {
        console.error("Error fetching models:", error);
      }
    };

    fetchModels();
  }, []);

  // Update selected models when mode changes
  useEffect(() => {
    if (modelsData) {
      const currentModeModels =
        modelsData[mode.toLowerCase() as "explorer" | "voyager"]?.models || [];
      setSelectedModels(currentModeModels.map((model: ModelInfo) => model.key));
    }
  }, [mode, modelsData]);

  // Calculate credits required when selected models change
  useEffect(() => {
    if (modelsData && selectedModels.length > 0) {
      const currentModeData =
        modelsData[mode.toLowerCase() as "explorer" | "voyager"];
      let totalCredits = 0;
      
      // Calculate credits for selected models based on their individual costs
      selectedModels.forEach(modelKey => {
        const model = currentModeData.models.find((m: ModelInfo) => m.key === modelKey);
        if (model) {
          totalCredits += model.credit_cost;
        }
      });
      
      // Add Google AI Overview cost if included
      if (includeGoogleSearch) {
        totalCredits += currentModeData.google_ai_overview_cost || 1;
      }
      
      setCreditsRequired(totalCredits);
    }
  }, [selectedModels, mode, modelsData, includeGoogleSearch]);

  useEffect(() => {
    if (!attachedBrandId) return;
    const fetchBrand = async () => {
      const { data, error } = await supabase
        .from("brand_project")
        .select("*")
        .eq("id", attachedBrandId)
        .single();
      if (error) {
        console.error("Error fetching brand:", error);
      } else {
        setAttachedBrand(data as unknown as Brand);
      }
    };
    fetchBrand();
  }, [attachedBrandId]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Timer for analysis duration
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined = undefined;

    if (isAnalyzing) {
      interval = setInterval(() => {
        setElapsedSeconds((prevSeconds) => prevSeconds + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isAnalyzing]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        handleSubmit();
      }
    }
  };

  const updateQueryCount = async () => {
    if (!subscription) return;

    const updatedSubscription = await fetch("/api/update-query-count", {
      method: "POST",
      body: JSON.stringify({
        user: user,
        subscription: subscription,
        isMonitoringMode: isMonitoringMode,
      }),
    });

    if (!updatedSubscription.ok) {
      toast({
        title: "Error",
        description: "Failed to update query count. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleModelToggle = (modelKey: string, checked: boolean) => {
    if (checked) {
      setSelectedModels((prev) => [...prev, modelKey]);
    } else {
      setSelectedModels((prev) => prev.filter((key) => key !== modelKey));
    }
  };

  const handleSelectAllModels = () => {
    if (!modelsData) return;
    const currentModeModels =
      modelsData[mode.toLowerCase() as "explorer" | "voyager"]?.models || [];
    setSelectedModels(currentModeModels.map((model: ModelInfo) => model.key));
    setIncludeGoogleSearch(true);
  };

  const handleDeselectAllModels = () => {
    setSelectedModels([]);
    setIncludeGoogleSearch(false);
  };

  const handleSubmit = async () => {
    if (!value.trim()) {
      toast({
        title: "Error",
        description: `Please enter a query or keyword to ${
          isMonitoringMode ? "monitor" : "search"
        }.`,
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "Please sign in to continue",
        variant: "destructive",
      });
      return;
    }

    if (!subscription) {
      toast({
        title: "Error",
        description:
          "Subscription plan could not be found. Please contact support or try again later.",
        variant: "destructive",
      });
      return;
    }

    if (subscription.status !== "active") {
      toast({
        title: "Error",
        description:
          "Your subscription is not active or has expired. Please upgrade to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!product) {
      toast({
        title: "Error",
        description:
          "Subscription plan could not be found. Please contact support or try again later.",
        variant: "destructive",
      });
      return;
    }

    if (selectedModels.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one AI model for analysis.",
        variant: "destructive",
      });
      return;
    }

    const userConstraint = getConstraints(product.name);

    if (subscription.query_count >= userConstraint.max_credits) {
      toast({
        title: "Error",
        description:
          "You have reached the maximum number of credits for your plan. Please upgrade to continue.",
        variant: "destructive",
      });
      return;
    }

    if (
      isMonitoringMode &&
      subscription.monitoring_count >= userConstraint.max_scheduled_queries
    ) {
      toast({
        title: "Error",
        description:
          "You have reached the maximum number of scheduled queries for your plan. Please upgrade to continue.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setIsAnalyzing(true); // Keep this for UI feedback, adjust meaning if needed for monitor

      if (isMonitoringMode) {
        setIsAnalyzing(true);
        // --- Monitoring Mode Logic ---
        const response = await fetch("/api/schedule-query", {
          // New API route
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session}`,
          },
          body: JSON.stringify({
            user_id: user.id,
            query: value.trim(),
            frequency: monitorFrequency,
            mode,
            location: location,
            attached_brand_id: attachedBrand?.id ? [attachedBrand.id] : null,
            attached_brand_name: attachedBrand ? attachedBrand?.name : "",
            attached_brand_industry: attachedBrand
              ? attachedBrand?.industry
              : "",
            attached_brand_logo_url: attachedBrand
              ? attachedBrand?.logo_url || ""
              : "",
            attached_brand_website: attachedBrand ? attachedBrand?.website : "",
            attached_brand_language: attachedBrand
              ? attachedBrand?.language
              : "",
            attached_brand_location: attachedBrand
              ? attachedBrand?.location
              : "",
            selected_models: selectedModels,
            include_google_search: includeGoogleSearch,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error("API Error (Schedule Query):", error);
          throw new Error(error.error || "Failed to schedule query");
        }

        toast({
          title: "Query Scheduled",
          description: `Your query has been scheduled for ${monitorFrequency} monitoring with ${selectedModels.length} AI models (${creditsRequired} credits per run). Check the Monitoring tab for details.`,
        });
        updateQueryCount();
        setTimeout(() => {
          window.location.assign(`/dashboard/library`);
        }, 400);
        setValue(""); // Clear input
        adjustHeight(true);
        setIsAnalyzing(false); // Reset analyzing state
      } else {
        // --- Search Mode Logic (Existing) ---
        const response = await fetch("/api/search/prompt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session}`,
          },
          body: JSON.stringify({
            mode,
            user_id: user.id,
            query: value.trim(),
            brand_name: attachedBrand?.name || "No Brand Name", // Use optional chaining
            brand_industry: attachedBrand?.industry || "No Brand Industry", // Use optional chaining
            brand_id: attachedBrand?.id || "No Brand ID", // Use optional chaining
            location: location,
            attached_brand_id: attachedBrand?.id ? [attachedBrand.id] : null,
            selected_models: selectedModels,
            include_google_search: includeGoogleSearch,
          }),
        });

        if (!response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const error = await response.json();
            console.error("API Error (Search):", error);
            throw new Error(error.error || "Failed to start analysis");
          } else {
            const text = await response.text();
            console.error("Non-JSON Error Response:", text);
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }
        updateQueryCount();
        // Handle streaming response (or adjust if backend changes)
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        let result = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          result += new TextDecoder().decode(value);
        }

        const { mode_id, credits_used } = JSON.parse(result);

        toast({
          title: "Analysis started",
          description: `Your ${mode} analysis is processing using ${selectedModels.length} AI models (${credits_used} credits used). You'll be redirected to results when complete.`,
        });

        setIsAnalyzing(false);
        setTimeout(() => {
          router.push(`/dashboard/search/analysis?mode_id=${mode_id}`);
        }, 400);

        setValue("");
        adjustHeight(true);
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      setIsAnalyzing(false);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      // Ensure analyzing is false unless explicitly set during submission
      if (!isMonitoringMode) {
        setIsAnalyzing(false);
      } // For monitoring, it's reset earlier
    }
  };

  const modes = [
    {
      key: "Explorer",
      caption:
        "Enhanced brand analysis and insights from top AI search engines",
    },
    {
      key: "Voyager",
      caption:
        "Comprehensive analysis with social sentiment tracking & market perception insights",
    },
  ];

  const formatTime = (totalSeconds: number): string => {
    if (totalSeconds < 0) return "0s";
    if (totalSeconds === 0) return "0s";

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts: string[] = [];

    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) {
      if (seconds > 0 || (hours === 0 && minutes === 0)) {
        parts.push(`${seconds}s`);
      }
    }
    return parts.join(" ");
  };

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="w-full ">
          <div className="flex flex-col items-center space-y-3">
            <div className="flex items-center space-x-2">
              <span
                className={cn(
                  "px-2 py-1 text-xs rounded-full",
                  mode === "Voyager" && "bg-orange-500/20 text-orange-400",
                  mode === "Explorer" && "bg-green-500/20 text-green-400"
                )}
              >
                {mode}
              </span>
              {isMonitoringMode && (
                <span
                  className={cn(
                    "px-2 py-1 text-xs rounded-full",
                    isMonitoringMode && "bg-blue-500/20 text-blue-400"
                  )}
                >
                  Monitor
                </span>
              )}
              <span className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-400">
                {selectedModels.length} Models
              </span>
              <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400">
                {creditsRequired} Credits
              </span>
              <span className="text-xs text-muted-foreground">
                thought for {formatTime(elapsedSeconds)}
              </span>
            </div>
            <h1 className="text-2xl font-bold mb-3 text-center text-foreground dark:text-white">
              Analyzing Your Search Query
            </h1>
          </div>
          <p className="text-muted-foreground mb-10 text-center">
            We&apos;re gathering data and insights about {value || "your query"}
            using {selectedModels.length} AI models. This may take a few
            moments.
          </p>
          <LoadingState />
        </div>
      </div>
    );
  }

  const currentModeData =
    modelsData?.[mode.toLowerCase() as "explorer" | "voyager"];

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 space-y-8">
      <h1 className="text-4xl font- text-center text-neutral-700 dark:text-white">
        {isMonitoringMode
          ? "Search and Monitor Prompts"
          : attachedBrand
          ? "Search and Monitor Prompts for " + attachedBrand?.name
          : "Let's help you understand your prompts"}
      </h1>

      <div className="w-full">
        <div
          className={cn(
            "relative bg-[#e2e2e2]/20 dark:bg-neutral-900/10 rounded-xl border border-[#e2e2e2]/20 hover:border-[#e2e2e2]/40 dark:border-neutral-800",
            isMonitoringMode &&
              "ring-3 ring-blue-500 ring-offset-2 ring-offset-background dark:ring-offset-neutral-950",
            attachedBrand &&
              "ring-3 ring-purple-500 ring-offset-2 ring-offset-background dark:ring-offset-neutral-950"
          )}
        >
          <div className="overflow-y-auto">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                adjustHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                isMonitoringMode
                  ? "Enter query to monitor..."
                  : "Enter search prompt to analyze..."
              }
              className={cn(
                "w-full px-4 py-3",
                "resize-none",
                "bg-transparent",
                "border-none",
                "text-neutral-600 dark:text-white text-sm",
                "focus:outline-none",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "placeholder:text-neutral-300 dark:placeholder:text-neutral-500 placeholder:text-sm",
                "min-h-[60px]"
              )}
              style={{
                overflow: "hidden",
              }}
            />
          </div>

          <div className="flex items-center justify-between p-3 flex-wrap gap-2">
            {/* Left Side Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Attach Brand Button */}
              <button
                type="button"
                onClick={() => setOpenModal(true)}
                className={cn(
                  "group p-[10px] bg-muted/50 dark:bg-black/20 dark:hover:bg-neutral-800 cursor-pointer rounded-full border border-[#e2e2e2]/20 dark:border-accent transition-all duration-400 ease flex items-center ",
                  attachedBrand &&
                    "bg-purple-500/40 dark:bg-purple-900/40 hover:bg-purple-500/50 dark:hover:bg-purple-900/50"
                )}
              >
                <Paperclip className="w-4 h-4 text-neutral-400 dark:text-white/60" />
                <span className="text-xs text-neutral-400 dark:text-white opacity-0 max-w-0 group-hover:max-w-[200px] group-hover:ml-2 group-hover:opacity-100 transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap">
                  {attachedBrand ? "Change Brand" : "Attach Brand"}
                </span>
              </button>

              {/* Attach Location Button */}
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="group p-[10px] bg-muted/50 dark:bg-black/20 dark:hover:bg-neutral-800 cursor-pointer rounded-full border border-[#e2e2e2]/20 dark:border-accent transition-all duration-400 ease flex items-center "
                  >
                    <MapPin className="w-4 h-4 text-neutral-400 dark:text-white/60" />
                    <span className="text-xs text-neutral-400 dark:text-white opacity-0 max-w-0 group-hover:max-w-[200px] group-hover:ml-2 group-hover:opacity-100 transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap">
                      {location
                        ? domains.find((item) => item.country_name === location)
                            ?.country_name
                        : "Select location..."}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search locations..." />
                    <CommandList>
                      <CommandEmpty>No locations found.</CommandEmpty>
                      <CommandGroup>
                        {domains.map((item) => (
                          <CommandItem
                            key={item.country_name}
                            value={item.country_name}
                            onSelect={(currentValue) => {
                              setLocation(
                                currentValue === location ? "" : currentValue
                              );
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                location === item.country_name
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {item.country_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Analysis Mode Dropdown */}
              <DropdownMenu>
                <div className="inline-flex bg-blue-500/40 text-primary dark:text-white/60 -space-x-px divide-x divide-primary/30 dark:divide-blue-500/20 rounded-full rtl:space-x-reverse">
                  <Button
                    variant="outline"
                    className="rounded-none shadow-none first:rounded-s-full last:rounded-e-full focus-visible:z-10 text-[12px] overflow-hidden border-primary/30 dark:border-blue-500/20 hover:bg-primary/20 dark:hover:bg-transparent"
                  >
                    <Telescope
                      className="opacity-60 w-4 h-4"
                      aria-hidden="true"
                    />
                    <motion.div
                      key={mode}
                      initial={{ x: 10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 10, opacity: 0 }}
                      transition={{
                        duration: 0.3,
                        ease: [0.4, 0, 0.2, 1],
                        opacity: { duration: 0.15 },
                      }}
                    >
                      {mode}
                    </motion.div>
                  </Button>
                  <DropdownMenuTrigger className="focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none">
                    <Button
                      variant="outline"
                      className="rounded-none shadow-none focus-visible:z-10 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus-visible:outline-none last:rounded-e-full border-primary/30 dark:border-blue-500/20 hover:bg-primary/20 dark:hover:bg-transparent"
                      size="icon"
                      aria-label="Options"
                    >
                      <ChevronDown
                        className="w-4 h-4"
                        size={16}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                </div>
                <DropdownMenuContent className="p-4 md:ml-52 rounded-xl w-[320px] md:w-[450px] max-h-[50vh] overflow-y-auto">
                  {/* Mode Selection */}
                  <div className="space-y-2 mb-4">
                    <h4 className="font-medium text-sm text-neutral-600 dark:text-white">
                      Analysis Mode
                    </h4>
                    {modes.map((item) => (
                      <div
                        key={item.key}
                        className="cursor-pointer rounded-[8px] hover:bg-blue-500/10 p-2"
                        onClick={() => setMode(item.key as AnalysisMode)}
                      >
                        <div className="flex gap-2 items-center">
                          {item.key === mode && <Check className="w-4 h-4" />}
                          <div>
                            <h4 className="text-[14px] text-neutral-600 dark:text-white">
                              {item.key}
                            </h4>
                            <p className="text-neutral-400 dark:text-white/70 text-[10px]">
                              {item.caption}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* AI Mode English Notice */}
                  {mode === "Explorer" && selectedModels.includes("google-ai-mode") && (
                    <div className="bg-amber-500/10 border border-dashed border-amber-500 rounded-lg p-3 mb-4">
                      <p className="text-xs text-amber-500 font-medium flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2" /> AI Mode currently works with only English Language
                      </p>
                    </div>
                  )}

                  {/* Model Selection */}
                  <div className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm text-neutral-600 dark:text-white">
                        AI Models for {mode}
                      </h4>
                      <Badge
                        variant="secondary"
                        className="bg-purple-500/20 text-purple-600 dark:text-purple-400"
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        {creditsRequired} Credits
                      </Badge>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAllModels();
                        }}
                        className="text-xs rounded-full flex-1 sm:flex-none"
                      >
                        Select All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeselectAllModels();
                        }}
                        className="text-xs rounded-full flex-1 sm:flex-none"
                      >
                        Deselect All
                      </Button>
                    </div>

                    <div className="space-y-3 max-h-[200px] overflow-y-auto">
                      {currentModeData?.models.map((model) => {
                        const IconComponent = modelIcons[model.key];
                        return (
                        <div
                          key={model.key}
                          className="flex items-center space-x-2 md:space-x-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            id={`${model.key}-dropdown`}
                            checked={selectedModels.includes(model.key)}
                            onCheckedChange={(checked) =>
                              handleModelToggle(model.key, checked as boolean)
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor={`${model.key}-dropdown`}
                              className="text-sm flex items-center gap-1.5 md:gap-2 font-medium cursor-pointer block text-neutral-600 dark:text-white"
                            >
                              <IconComponent className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              <span className="truncate">{model.name}</span>
                            </label>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {model.credit_cost} {model.credit_cost === 1 ? 'credit' : 'credits'}
                          </Badge>
                        </div>
                      );
                    })}
                    </div>

                    <div
                      className="flex items-center space-x-2 md:space-x-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        id="google-search-dropdown"
                        checked={includeGoogleSearch}
                        onCheckedChange={(checked) =>
                          setIncludeGoogleSearch(checked as boolean)
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor="google-search-dropdown"
                          className="text-sm font-medium cursor-pointer flex items-center gap-1.5 md:gap-2 text-neutral-600 dark:text-white"
                        >
                          <Google.Color className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          <span className="truncate">Google AI Overview</span>
                        </label>
                      </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                            {1} credit
                          </Badge>
                    </div>
                    {mode === "Explorer" && (
                    <div className="pt-2 bg-muted/50 rounded p-3">
                      <p className="text-xs text-muted-foreground">
                        💡 <strong>Credit Calculation:</strong> Each AI model
                        has web search available and returns URL analysis.
                      </p>
                    </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Frequency Dropdown (Monitor Mode Only) */}
              {isMonitoringMode && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="rounded-full border-[#e2e2e2]/20 dark:border-accent text-xs text-muted-foreground dark:text-muted-foreground"
                    >
                      <Repeat className="w-3 h-3 mr-2" />
                      {monitorFrequency === "daily" ? "Daily" : "Weekly"}
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onSelect={() => setMonitorFrequency("daily")}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          monitorFrequency === "daily"
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      Daily
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => setMonitorFrequency("weekly")}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          monitorFrequency === "weekly"
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      Weekly
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center gap-3">
              {/* Search/Monitor Toggle */}
              <div className="flex items-center space-x-2 bg-background dark:bg-neutral-800/40 p-1 rounded-full">
                <Button
                  variant={!isMonitoringMode ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setIsMonitoringMode(false)}
                  className={`rounded-full h-7 px-3 text-xs hover:!bg-transparent hover:!text-blue-500/50 text-muted-foreground/50 dark:text-muted-foreground/50 ${
                    !isMonitoringMode &&
                    "!bg-neutral-100 dark:!bg-neutral-800/70 !text-[#7a7a7a] dark:!text-muted-foreground hover:dark:!bg-neutral-800 hover:!bg-neutral-100"
                  }`}
                >
                  <Search className="w-3 h-3 mr-1" />
                  Search
                </Button>
                <Button
                  variant={isMonitoringMode ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setIsMonitoringMode(true)}
                  className={`rounded-full h-7 px-3 text-xs text-muted-foreground/50 dark:text-muted-foreground/50 hover:!bg-transparent hover:!text-blue-500/50 ${
                    isMonitoringMode &&
                    "!bg-primary hover:!bg-primary dark:!bg-blue-600 dark:hover:!bg-blue-600 !text-accent dark:!text-white"
                  }`}
                >
                  <Repeat className="w-3 h-3 mr-1" />
                  Monitor
                </Button>
              </div>

              {/* Send Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  loading || !value.trim() || selectedModels.length === 0
                }
                className={cn(
                  "p-2 active:scale-95 rounded-full text-sm -rotate-45 cursor-pointer hover:rotate-0 transition-all ease-in-out duration-300 border hover:bg-muted flex items-center justify-center", // Centered icon
                  value.trim() && selectedModels.length > 0
                    ? "bg-foreground text-background dark:bg-white dark:text-black border-foreground dark:border-zinc-700 hover:border-foreground/80 dark:hover:border-zinc-600"
                    : "text-muted-foreground dark:text-zinc-400 border-border dark:border-zinc-700"
                )}
                aria-label={
                  isMonitoringMode ? "Schedule Monitor" : "Send Search"
                }
              >
                <ArrowRightIcon
                  className={cn(
                    "w-4 h-4",
                    value.trim() && selectedModels.length > 0
                      ? "text-background dark:text-black"
                      : "text-muted-foreground dark:text-zinc-400"
                  )}
                />
              </button>
            </div>
          </div>
        </div>
        <motion.div
          key={mode} // Add key to trigger animation on mode change
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: ["0px", "60px", "60px", "0px"],
            opacity: [0, 1, 1, 0],
            transition: {
              duration: 3.3,
              times: [0, 0.1, 0.9, 1],
            },
          }}
          className="flex w-full justify-center overflow-hidden"
        >
          <div className="flex w-[90%] gap-3 mx-0 p-5 items-center rounded-b-xl border-l border-r border-b border-[#e2e2e2]/50 dark:border-accent text-foreground">
            <div className="flex gap-2 items-center text-sm font-bold w-1/4 text-neutral-500 dark:text-white">
              <Telescope className="w-4 h-4" />
              {mode}
            </div>
            <span className="text-xs w-full text-neutral-500 dark:text-muted-foreground">
              {modes.find((item) => item.key === mode)?.caption}
            </span>
            {/* {currentModeData && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {selectedModels.length}/{currentModeData.models.length} models
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {creditsRequired} credits
                </Badge>
              </div>
            )} */}
          </div>
        </motion.div>

        <div className="flex items-center justify-center gap-3 mt-4">
          <ActionButton
            icon={<ClockIcon className="w-4 h-4 text-sky-400" />}
            label={currentTime.toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          />
          <ActionButton
            icon={<CalendarIcon className="w-4 h-4 text-orange-400" />}
            label={currentTime.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          />
          {/* Credits Display */}
          {creditsRequired > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 dark:bg-purple-900/30 rounded-full">
              <Zap className="w-3 h-3 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                {creditsRequired} {creditsRequired === 1 ? "credit" : "credits"}
              </span>
            </div>
          )}{" "}
        </div>
      </div>

      {/* Search Mode Tips */}
      <div className="w-full max-w-4xl mt-8">
        <div className="bg-[#e2e2e2]/20 dark:bg-neutral-900/10 rounded-xl border border-[#e2e2e2]/20 dark:border-neutral-800 p-5">
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2 text-neutral-700 dark:text-foreground">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            Search Mode Tips
          </h3>

          <div className="space-y-4">
            {mode === "Voyager" && (
              <div className="flex items-start gap-3">
                <div>
                  <h4 className="font-medium text-sm text-neutral-700 dark:text-foreground">
                    Voyager Mode
                  </h4>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    Leverages Llama 4 Maverick, DeepSeek v3, Grok 3 Mini, and
                    GPT 4.1 Nano to create in-depth brand ranking and analysis
                    with social sentiment insights. Each model costs 1 credit
                    per analysis.
                  </p>
                </div>
              </div>
            )}

            {mode === "Explorer" && (
              <div className="flex items-start gap-3">
                <div>
                  <h4 className="font-medium text-sm text-neutral-700 dark:text-foreground">
                    Explorer Mode
                  </h4>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    Our most comprehensive analysis using GPT 4o Web Search,
                    Perplexity Sonar, Google AI Overview, Google AI Mode, Gemini
                    2.5 Flash, and Claude 4.0 Sonnet. Each model costs 1 credit
                    per analysis.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-[#e2e2e2]/50 dark:border-neutral-800">
              {/* <div className="flex items-start gap-3 mb-3">
                <Zap className="w-4 h-4 text-purple-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm text-neutral-700 dark:text-foreground">
                    Credit System
                  </h4>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    Select specific AI models to optimize your credit usage. You
                    can choose individual models or use all available models for
                    comprehensive analysis. Google Search is always included at
                    no extra cost.
                  </p>
                </div>
              </div> */}
              <p className="text-xs text-muted-foreground/30 dark:text-neutral-500">
                {isMonitoringMode
                  ? "Monitored queries run automatically with your selected models. View their status and results in the Monitoring tab."
                  : "For best results, be specific in your queries and select models that best fit your analysis needs."}
              </p>
            </div>
          </div>
        </div>
      </div>
      <AttachBrandModal
        showBrandModal={openModal}
        setShowBrandModal={setOpenModal}
        setAttachedBrand={setAttachedBrand}
      />
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
}

function ActionButton({ icon, label }: ActionButtonProps) {
  return (
    <button
      type="button"
      className="flex group items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-accent/80 dark:bg-neutral-900/20 dark:hover:bg-neutral-800 rounded-full border border-[#e2e2e2]/40 dark:border-neutral-800 text-muted-foreground hover:text-accent-foreground dark:text-neutral-400 dark:hover:text-white transition-colors"
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}
