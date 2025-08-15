"use client";
import { motion } from "framer-motion";
import { Input } from "../ui/input";
import { ChevronRight} from "lucide-react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Request() {
    const router = useRouter();
    const [email, setEmail] = useState("");
  return (
    <div className="flex flex-col items-center justify-center bg-[url('/assets/air-bg-foot.webp')] bg-cover bg-center bg-no-repeat overflow-hidden">
      <div className="container mx-auto flex flex-col items-center justify-center gap-5 py-12 md:py-20 px-4">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1}}
          transition={{ duration: 0.5 }}
          className="text-2xl md:text-[3rem] font-bold bricolage text-center max-w-xl leading-tight"
        >
         AI Search is moving fast, don&apos;t get left behind.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-center max-w-xl px-4"
        >
            Monitor mentions and performance across the world&apos;s most-used AI
            platforms
        </motion.p>

        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-2 mt-8 sm:border border-accent sm:bg-white/10 rounded-lg sm:rounded-full p-2">
          <Input
            placeholder="Enter your company email"
            className="w-96 h-12 md:h-14 rounded-full border-none bg-transparent text-center md:text-left"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button 
            className="bg-purple-600 hover:bg-purple-500 text-black rounded-full h-12 md:h-14 w-full md:w-auto px-6" 
            onClick={() => router.push("/onboarding?email=" + email)}
          >
            <span className="hidden md:inline">Get a free analysis</span>
            <span className="md:hidden">Get Analysis</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
