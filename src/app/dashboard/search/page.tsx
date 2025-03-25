"use client";

import { useState } from "react";
import { useChat, Message } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ArrowRight, Settings, Sparkles, Brain, Zap, Bot, Cpu } from "lucide-react";
import { AIChatInterface } from "@/components/ui/ai-chat";

const AVAILABLE_MODELS = [
  { id: "gpt-4", name: "GPT-4", description: "Most capable model", icon: Sparkles },
  { id: "gpt-3.5", name: "GPT-3.5", description: "Fast and efficient", icon: Zap },
  { id: "claude-3", name: "Claude 3", description: "Advanced reasoning", icon: Brain },
  { id: "llama-3", name: "Llama 3", description: "Open source power", icon: Bot },
  { id: "deepseek", name: "DeepSeek", description: "Specialized analysis", icon: Cpu },
];

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export default function AISearchPage() {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const { toast } = useToast();
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/search",
    headers: {
      "x-user-id": "user-id", // Replace with actual user ID
    },
    body: {
      models: selectedModels,
      brandId: "brand-id", // Replace with actual brand ID
    },
  });

  const handleModelToggle = (modelId: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId]
    );
  };

  const getModelString = () => {
    if (selectedModels.length === 0) return "gpt-3.5";
    if (selectedModels.length === 1) return selectedModels[0];
    return selectedModels.join("+");
  };

  return (
    <div className="h-full bg-gradient-to-b from-background to-zinc-900 text-white">
      <div className="relative">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Header */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={fadeIn}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-medium">Brand Analysis</h1>
                <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full">
                  Beta
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                  <Settings className="h-5 w-5" />
                </Button>
              </div>
            </motion.div>

            {/* Search Input */}
            <motion.form
              initial="initial"
              animate="animate"
              variants={fadeIn}
              onSubmit={handleSubmit}
              className="relative"
            >
            <AIChatInterface />
            </motion.form>

            {/* Model Selection */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={fadeIn}
              className="grid grid-cols-2 gap-4"
            >
              {AVAILABLE_MODELS.map((model) => {
                const Icon = model.icon;
                return (
                  <Card
                    key={model.id}
                    onClick={() => handleModelToggle(model.id)}
                    className={`p-4 cursor-pointer transition-all bg-zinc-900/50 border-zinc-800 
                      hover:border-zinc-700 hover:bg-zinc-900
                      ${
                        selectedModels.includes(model.id)
                          ? "border-blue-500 bg-blue-500/10"
                          : ""
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-zinc-800">
                        <Icon className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-medium">{model.name}</h3>
                        <p className="text-sm text-zinc-400">{model.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </motion.div>

            {/* Chat Messages */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={fadeIn}
              className="space-y-6"
            >
              {messages.map((message: Message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-6 rounded-2xl backdrop-blur-sm ${
                    message.role === "assistant"
                      ? "bg-zinc-900/50 border border-zinc-800"
                      : "bg-blue-500/10 border border-blue-500/20"
                  }`}
                >
                  <div className="prose prose-invert max-w-none">
                    <p className="text-lg leading-relaxed">{message.content}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
} 