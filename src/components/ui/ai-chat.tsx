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
import { useAuth } from "@/hooks/useAuth";
import { LoadingState } from "../loading-state";
import { useBrandData } from "@/contexts/brand-data-context";
import { countries } from "@/lib/countries";

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

export function AIChatInterface() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const { user, session } = useAuth();
  const { brand } = useBrandData();
  const [mode, setMode] = useState<AnalysisMode>("Explorer");
  const [loading, setLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMonitoringMode, setIsMonitoringMode] = useState(false);
  const [monitorFrequency, setMonitorFrequency] = useState<"daily" | "weekly">(
    "daily"
  );
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState("");
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

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

    if (!brand && mode === "Explorer") {
      toast({
        title: "Error",
        description: "Explorer mode requires a brand to be selected.",
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
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error("API Error (Schedule Query):", error);
          throw new Error(error.error || "Failed to schedule query");
        }

        toast({
          title: "Query Scheduled",
          description: `Your query has been scheduled for ${monitorFrequency} monitoring. Check the Monitoring tab for details.`,
        });
        setTimeout(() => {
          router.push(`/dashboard/library`);
        }, 400);
        setValue(""); // Clear input
        adjustHeight(true);
        setIsAnalyzing(false); // Reset analyzing state
      } else {
        // --- Search Mode Logic (Existing) ---
        const response = await fetch(process.env.NEXT_PUBLIC_SEARCH as string, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session}`,
          },
          body: JSON.stringify({
            mode,
            user_id: user.id,
            query: value.trim(),
            brand_name: brand?.name, // Use optional chaining
            brand_industry: brand?.industry, // Use optional chaining
            brand_id: brand?.id, // Use optional chaining
            location: location,
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

        const { mode_id } = JSON.parse(result);

        toast({
          title: "Analysis started",
          description: `Your ${mode} analysis is processing. You'll be redirected to results when complete.`,
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
              <span className="text-xs text-muted-foreground">
                thought for {formatTime(elapsedSeconds)}
              </span>
            </div>
            <h1 className="text-2xl font-bold mb-3 text-center">
              Analyzing Your Search Query
            </h1>
          </div>
          <p className="text-muted-foreground mb-10 text-center">
            We&apos;re gathering data and insights about {value || "your query"}
            . This may take a few moments.
          </p>
          <LoadingState />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 space-y-8">
      <h1 className="text-4xl font-regular text-black dark:text-white">
        {isMonitoringMode
          ? "Search and Monitor Prompts"
          : "Let's help you understand your brand"}
      </h1>

      <div className="w-full">
        <div
          className={cn(
            "relative bg-neutral-900 rounded-xl border border-neutral-800",
            isMonitoringMode &&
              "ring-2 ring-blue-500 ring-offset-2 ring-offset-neutral-950"
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
                "text-white text-sm",
                "focus:outline-none",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "placeholder:text-neutral-500 placeholder:text-sm",
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
              {/* Attach Location Button */}
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="group p-3 hover:bg-neutral-800 cursor-pointer rounded-full border border-accent transition-all duration-400 ease flex items-center "
                  >
                    <MapPin className="w-4 h-4 text-white/60" />
                    <span className="text-xs opacity-0 max-w-0 group-hover:max-w-[200px] group-hover:ml-2 group-hover:opacity-100 transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap">
                      {location
                        ? countries.find((item) => item.label === location)
                            ?.label
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
                        {countries.map((item) => (
                          <CommandItem
                            key={item.value}
                            value={item.label}
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
                                location === item.label
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {item.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Analysis Mode Dropdown */}
              <DropdownMenu>
                <div className="inline-flex bg-blue-500/20 text-white/70 -space-x-px divide-x divide-primary-foreground/30 rounded-full rtl:space-x-reverse">
                  <Button
                    variant="outline"
                    className="rounded-none shadow-none first:rounded-s-full last:rounded-e-full focus-visible:z-10 text-[12px] overflow-hidden"
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
                      className="rounded-none shadow-none focus-visible:z-10 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus-visible:outline-none last:rounded-e-full"
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
                <DropdownMenuContent className="p-2">
                  {modes.map((item) => (
                    <DropdownMenuItem
                      key={item.key}
                      className="cursor-pointer"
                      onClick={() => setMode(item.key as AnalysisMode)}
                    >
                      <div className="flex gap-2 items-center">
                        {item.key === mode && <Check className="w-4 h-4" />}
                        <div>
                          <h4 className="text-[14px]">{item.key}</h4>
                          <p className="text-white/70 text-[10px]">
                            {item.caption}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Frequency Dropdown (Monitor Mode Only) */}
              {isMonitoringMode && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="rounded-full text-xs">
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
              {/* Country Selector Dropdown */}

              {/* Search/Monitor Toggle */}
              <div className="flex items-center space-x-2 bg-neutral-800/60 p-1 rounded-full">
                <Button
                  variant={!isMonitoringMode ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setIsMonitoringMode(false)}
                  className="rounded-full h-7 px-3 text-xs"
                >
                  <Search className="w-3 h-3 mr-1" />
                  Search
                </Button>
                <Button
                  variant={isMonitoringMode ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setIsMonitoringMode(true)}
                  className={`rounded-full h-7 px-3 text-xs ${
                    isMonitoringMode ? "bg-blue-600 hover:bg-blue-600" : ""
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
                disabled={loading || !value.trim()}
                className={cn(
                  "p-2 active:scale-95 rounded-full text-sm -rotate-45 cursor-pointer hover:rotate-0 transition-all ease-in-out duration-300 border border-zinc-700 hover:border-zinc-600 hover:bg-accent flex items-center justify-center", // Centered icon
                  value.trim() ? "bg-white text-black" : "text-zinc-400"
                )}
                aria-label={
                  isMonitoringMode ? "Schedule Monitor" : "Send Search"
                }
              >
                <ArrowRightIcon
                  className={cn(
                    "w-4 h-4",
                    value.trim() ? "text-black" : "text-zinc-400"
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
          <div className="flex w-[90%] gap-3 mx-0 p-5 items-center rounded-b-xl border-l border-r border-b border-accent">
            <div className="flex gap-2 items-center text-sm font-bold w-1/4">
              <Telescope className="w-4 h-4" />
              {mode}
            </div>
            <span className="text-xs w-full">
              {modes.find((item) => item.key === mode)?.caption}
            </span>
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
        </div>
      </div>

      {/* Search Mode Tips */}
      <div className="w-full max-w-4xl mt-8">
        <div className="bg-neutral-900/50 rounded-xl border border-neutral-800 p-5">
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            Search Mode Tips
          </h3>

          <div className="space-y-4">
            {mode === "Voyager" && (
              <div className="flex items-start gap-3">
                <div>
                  <h4 className="font-medium text-sm">Voyager Mode</h4>
                  <p className="text-sm text-neutral-400 mt-1">
                    Leverages Llama 4 Scout, DeepSeek R1, and Qwen to create
                    in-depth brand ranking and analysis with social sentiment
                    insights. Includes citations for more credible results.
                    Ideal for comprehensive market research.
                  </p>
                </div>
              </div>
            )}

            {mode === "Explorer" && (
              <div className="flex items-start gap-3">
                <div>
                  <h4 className="font-medium text-sm">Explorer Mode</h4>
                  <p className="text-sm text-neutral-400 mt-1">
                    Our most comprehensive analysis using GPT 4o, Perplexity
                    Sonar, Gemini 2.0 Flash and Claude 3.5 Extracts brands
                    insights from native AI search prompts
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-neutral-800">
              <p className="text-xs text-neutral-500">
                {isMonitoringMode
                  ? "Monitored queries run automatically. View their status and results in the Monitoring tab."
                  : "For best results, be specific in your queries and include relevant industry terms."}
              </p>
            </div>
          </div>
        </div>
      </div>
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
      className="flex group items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 rounded-full border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}
