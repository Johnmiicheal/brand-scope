"use client";

import { useEffect, useRef, useCallback } from "react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ImageIcon,
  FileUp,
  Figma,
  MonitorIcon,
  CircleUserRound,
  ArrowUpIcon,
  Paperclip,
  PlusIcon,
  ChevronDown,
  Telescope,
  Check,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./button";

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
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<"DeepFocus" | "Voyager" | "Explorer">("DeepFocus"); // DeepFocus: uses one engine, no tool calls (monitor how ai talks about you), just analysis, Voyager: uses multiple models, includes social analysis, checks your website
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        setValue("");
        adjustHeight(true);
      }
    }
  };

  const modes = [
    {
      key: "DeepFocus",
      caption: "Advanced brand analysis and reasoning",
    },
    {
      key: "Voyager",
      caption: "Extended brand analysis and reasoning with social sentiment",
    },
    {
        key: "Explorer",
        caption: "Compare your brands with competitors in your industry",
      },
  ];

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
              placeholder="Ask v0 a question..."
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
                className="group p-2 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1"
              >
                <Paperclip className="w-4 h-4 text-white" />
                <span className="text-xs text-zinc-400 hidden group-hover:inline transition-opacity">
                  Attach
                </span>
              </button>
              <DropdownMenu>
                <div className="inline-flex -space-x-px divide-x divide-primary-foreground/30 rounded-full shadow-sm shadow-black/5 rtl:space-x-reverse">
                  <Button
                    variant="outline"
                    className="rounded-none shadow-none first:rounded-s-full last:rounded-e-full focus-visible:z-10"
                  >
                    <Telescope
                      className="opacity-60"
                      size={14}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    {mode}
                  </Button>
                  <DropdownMenuTrigger>
                    <Button
                      variant="outline"
                      className="rounded-none shadow-none focus-visible:z-10 last:rounded-e-full"
                      size="icon"
                      aria-label="Options"
                    >
                      <ChevronDown
                        size={16}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                </div>
                <DropdownMenuContent className="p-2">
                  {modes.map((item) => (
                    <DropdownMenuItem key={item.key} className="cursor-pointer" onClick={() => setMode(item.key as "DeepFocus" | "Voyager" | "Explorer")}>
                      <div className="flex gap-2 items-center">
                        {item.key === mode && <Check className="w-4 h-4" />}
                        <div>
                          <h4 className="text-[14px]">{item.key}</h4>
                        <p className="text-white/70 text-[10px]">{item.caption}</p>

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
                className="px-2 py-1 rounded-lg text-sm text-zinc-400 transition-colors border border-dashed border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800 flex items-center justify-between gap-1"
              >
                <PlusIcon className="w-4 h-4" />
                Project
              </button>
              <button
                type="button"
                className={cn(
                  "px-1.5 py-1.5 rounded-lg text-sm transition-colors border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800 flex items-center justify-between gap-1",
                  value.trim() ? "bg-white text-black" : "text-zinc-400"
                )}
              >
                <ArrowUpIcon
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

        <div className="flex items-center justify-center gap-3 mt-4">
          <ActionButton
            icon={<ImageIcon className="w-4 h-4" />}
            label="Clone a Screenshot"
          />
          <ActionButton
            icon={<Figma className="w-4 h-4" />}
            label="Import from Figma"
          />
          <ActionButton
            icon={<FileUp className="w-4 h-4" />}
            label="Upload a Project"
          />
          <ActionButton
            icon={<MonitorIcon className="w-4 h-4" />}
            label="Landing Page"
          />
          <ActionButton
            icon={<CircleUserRound className="w-4 h-4" />}
            label="Sign Up Form"
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
      className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 rounded-full border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}
