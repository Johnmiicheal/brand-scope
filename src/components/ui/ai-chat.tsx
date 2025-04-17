"use client";

import { useEffect, useRef, useCallback } from "react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Paperclip,
  ChevronDown,
  Telescope,
  Check,
  ArrowRightIcon,
  ClockIcon,
  CalendarIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { AnalysisMode } from "@/types/search";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./button";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { LoadingState } from "../loading-state";
import { useBrandData } from "@/contexts/brand-data-context";

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
  const [mode, setMode] = useState<AnalysisMode>("DeepFocus");
  const [loading, setLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
        description: "Please enter a query or keyword to search and analyse",
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

    if (!brand) {
      toast({
        title: "Error",
        description: "Please create a brand to continue",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setIsAnalyzing(true);

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
          brand_name: brand.name,
          brand_industry: brand.industry,
          brand_id: brand.id,
        }),
      });

      if (!response.ok) {
        setIsAnalyzing(false);
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          console.error("API Error:", error);
          throw new Error(error.error || "Failed to start analysis");
        } else {
          const text = await response.text();
          console.error("Non-JSON Error Response:", text);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      // Handle streaming response
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

      // Parse the final result
      const { mode_id } = JSON.parse(result);

      toast({
        title: "Analysis started",
        description: `Your ${mode} analysis is processing. You'll be redirected to results when complete.`,
      });

      setIsAnalyzing(false);
      setTimeout(() => {
        // Redirect to analysis results page
        router.push(`/dashboard/search/analysis?mode_id=${mode_id}`);
      }, 400);

      // Clear input and reset height
      setValue("");
      adjustHeight(true);
    } catch (error) {
      console.error("Error submitting analysis:", error);
      setIsAnalyzing(false);

      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsAnalyzing(false);
    }
  };

  const modes = [
    {
      key: "DeepFocus",
      caption:
        "Advanced brand analysis with detailed reasoning and market insights",
    },
    {
      key: "Voyager",
      caption:
        "Comprehensive analysis with social sentiment tracking & market perception insights",
    },
    {
      key: "Explorer",
      caption:
        "In-depth search and tracking with leading AI Search Engines for enhanced insights",
    },
  ];
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

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

const formatTime = (totalSeconds: number): string => {
  if (totalSeconds < 0) return "0s"; // Safety check
  if (totalSeconds === 0) return "0s"; // Handle zero explicitly

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  // Show seconds if they are > 0 OR if hours and minutes are both 0 (i.e., time < 1 minute)
  if (seconds > 0 || parts.length === 0) {
     // Don't show seconds if they are 0 and we already have hours or minutes
     if(seconds > 0 || (hours === 0 && minutes === 0)) {
        parts.push(`${seconds}s`);
     }
  }

  return parts.join(' '); // Join the parts with a space
};

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="w-full ">
          <div className="flex flex-col items-center space-y-3">
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                mode === "Voyager"
                  ? "bg-orange-500/20 text-orange-400"
                  : mode === "DeepFocus"
                  ? "bg-blue-500/20 text-blue-400"
                  : mode === "Explorer"
                  ? "bg-green-500/20 text-green-400"
                  : ""
              }`}
            >
              {mode}
            </span>
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
        Let&apos;s help you understand your brand
      </h1>

      <div className="w-full">
        <div className="relative bg-neutral-900 rounded-xl border border-neutral-800">
          <div className="overflow-y-auto">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                adjustHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
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

          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="group p-3 hover:bg-neutral-800 cursor-pointer rounded-full border border-accent transition-all duration-400 ease flex items-center "
              >
                <Paperclip className="w-4 h-4 text-white/60" />
                <span className="text-xs opacity-0 max-w-0 group-hover:max-w-[200px] group-hover:ml-2 group-hover:opacity-100 transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap">
                  Attach Brand
                </span>
              </button>
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
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !value.trim()}
                className={cn(
                  "p-2 active:scale-95 rounded-full text-sm -rotate-45 cursor-pointer hover:rotate-0 transition-all ease-in-out duration-300 border border-zinc-700 hover:border-zinc-600 hover:bg-accent flex items-center justify-between gap-1",
                  value.trim() ? "bg-white text-black" : "text-zinc-400"
                )}
              >
                <ArrowRightIcon
                  className={cn(
                    "w-4 h-4",
                    value.trim() ? "text-black" : "text-zinc-400"
                  )}
                />
                <span className="sr-only">Send</span>
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
