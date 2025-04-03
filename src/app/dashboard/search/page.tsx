"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { AIChatInterface } from "@/components/ui/ai-chat";


const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export default function AISearchPage() {

  return (
    <div className="h-full bg-gradient-to-b from-background to-zinc-900 text-white">
      <div className="relative">
        <div className="flex justify-between items-center px-5">
        <motion.div 
                variants={fadeIn}
                className="flex items-center gap-3"
              >
                <h1 className="text-2xl font-medium">Search Analysis</h1>
                <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full">
                  Beta
                </span>
              </motion.div>
              <motion.div 
                variants={fadeIn}
                className="flex items-center gap-4"
              >
                <Button variant="ghost" size="icon" className="text-zinc-400 rounded-full hover:text-white">
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
                    staggerChildren: 0.1
                  }
                }
              }}
              className="flex items-center justify-between"
            >
             
            </motion.div>

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
                    duration: 0.4
                  }
                }
              }}
              className="relative"
            >
              <AIChatInterface />
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
} 