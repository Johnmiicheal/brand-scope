"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { AIChatInterface } from "@/components/ui/ai-chat";
import { useAuth } from "@/hooks/useAuth";

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export default function AISearchPage() {
  const { user, session, product, subscription, isLoading } = useAuth();
  return (
    <div className="h-full text-white">
      <div className="relative">
        <div className="flex justify-between items-center px-5">
          <span>
            <motion.div variants={fadeIn} className="flex items-center gap-3">
              <h1 className="text-2xl font-medium">Search Analysis</h1>
              <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full">
                Beta
              </span>
            </motion.div>
            <p className="text-xs text-white/30">Research how AI search engines respond to your queries and analyze the results.</p>
          </span>
          <motion.div variants={fadeIn} className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 rounded-full hover:text-white"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Header */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={{
                initial: { opacity: 0 },
                animate: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}
              className="flex items-center justify-between"
            ></motion.div>

            {/* Search Input */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={{
                initial: { opacity: 0 },
                animate: {
                  opacity: 1,
                  transition: {
                    delay: 0.2,
                    duration: 0.4,
                  },
                },
              }}
              className="relative"
            >
              <AIChatInterface user={user} session={session} product={product} subscription={subscription} isLoading={isLoading} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
