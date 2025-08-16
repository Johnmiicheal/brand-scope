"use client";
import { motion } from "framer-motion";
import EmailInput from "./blocks/email-input";

export default function Request() {
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
        <EmailInput />
      </div>
    </div>
  );
}
