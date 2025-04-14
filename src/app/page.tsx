/* eslint-disable react/no-unescaped-entities */
"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import BlurText from "@/components/fancy-web/blur-text";
import * as FramerMotion from "framer-motion";
import { GlowEffect } from "@/components/fancy-web/glow-effect";
import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import Image from "next/image";
import { IconMarquee } from "@/components/marquee";
import { BentoFeatures } from "@/components/fancy-web/bento-features";
import { VerticalCutReveal } from "@/components/fancy-web/vertical-cut-reveal";

const { motion } = FramerMotion;

export default function Home() {
  return (
    <div className="min-h-screen bg-background overflow-hidden px-4">
      <div className="max-w-[1920px] flex flex-col relative h-full items-center mx-auto">
        <header className="bg-background container mx-auto py-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">Brand Scope</span>
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/login" className="text-sm font-medium hover:underline">
              Log in
            </Link>
            <Link href="/signup">
              <Button variant="outline" size="sm">
                Sign up
              </Button>
            </Link>
          </div>
        </header>

        <main className="bg-background container mx-auto pt-16 pb-24">
          <section>
            <div className=" p-4 max-w-5xl space-y-6 text-center  mx-auto relative z-10  w-full pt-20 md:pt-0">
              <BlurText
                text="Get insights on how your brand performs in AI Search."
                delay={150}
                animateBy="words"
                direction="top"
                className="text-4xl md:text-7xl font-bold text-center"
              />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5, duration: 0.8 }}
                className="font-normal text-base text-neutral-300 max-w-2xl text-center mx-auto"
              >
                Using the latest and top AI models, we'll work with you on how
                to{" "}
                <strong>
                  expand your brand's reach and unlock millions of customers{" "}
                </strong>
                who are using AI to discover new products and brands
              </motion.p>
              <div className="relative w-fit mx-auto mt-8 cursor-pointer">
                <GlowEffect
                  colors={["#0D47A1", "#1976D2", "#42A5F5", "#90CAF9"]}
                  mode={"rotate"}
                  blur="soft"
                  duration={6}
                  scale={0.8}
                  className={"w-57 -ml-3"}
                />
                <button className="relative cursor-pointer inline-flex items-center gap-2 rounded-md bg-zinc-950 px-4 py-3 text-base font-medium text-zinc-50 outline outline-1 outline-[#fff2f21f]">
                  Analyse your Brand <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="relative w-full max-w-[1920px] mx-auto -mt-20">
              <Image
                src="/bs-hero-dash.png"
                width={2400}
                height={1350}
                alt="Brand Scope Dashboard"
                className="w-full relative"
              />
              <div
                className="absolute bottom-0 left-0 w-full h-42 pointer-events-none z-20"
                style={{
                  background:
                    "linear-gradient(to bottom, transparent, #0a0a0a)", // match background
                }}
              />
            </div>
          </section>

          {/* AI Models Marquee Section */}
          <section className="py-12 mt-8">
            <IconMarquee />
            <div className="text-center mb-6">
              <p className="text-neutral-400 max-w-2xl mx-auto">
                *We analyze your brand across{" "}
                <span className="font-regular italic font-['Instrument_Serif']">
                  all major AI platforms{" "}
                </span>
                to ensure comprehensive insights.*
              </p>
            </div>
          </section>
          <section className="relative">
            <BentoFeatures />
            <div className="w-full mx-auto h-full xs:text-2xl text-2xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-5xl flex flex-col items-center justify-center text-white/70 tracking-wide uppercase">
              <VerticalCutReveal
                splitBy="characters"
                staggerDuration={0.025}
                staggerFrom="first"
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 21,
                }}
              >
                {`TAKE THE FIRST STEP TO`}
              </VerticalCutReveal>
              <div className="flex items-center justify-center gap-2">
                <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 21,
                      delay: 1.2,
                    }}
                  >
                    <TrendingUp className="w-10 h-10"/>
                  </motion.span>
                <VerticalCutReveal
                  splitBy="characters"
                  staggerDuration={0.025}
                  staggerFrom="last"
                  reverse={true}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 21,
                    delay: 0.5,
                  }}
                >
                  {`ELEVATING YOUR`}
                </VerticalCutReveal>
              </div>
              <div className="flex items-center justify-center">
                <VerticalCutReveal
                  splitBy="characters"
                  staggerDuration={0.025}
                  staggerFrom="center"
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 21,
                    delay: 1.1,
                  }}
                >
                  {`BRAND'S PERFORMANCE `}
                </VerticalCutReveal>
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 21,
                    delay: 2.0,
                  }}
                >
                  <Sparkles className="w-10 h-10"/>
                </motion.span>
              </div>
              <div className="relative w-fit mx-auto mt-8 cursor-pointer">
                <GlowEffect
                  colors={["#0D47A1", "#1976D2", "#42A5F5", "#90CAF9"]}
                  mode={"rotate"}
                  blur="soft"
                  duration={3}
                  scale={0.7}
                  className="mt-1.5 -ml-8 w-61"
                />
                <button className="relative cursor-pointer inline-flex items-center gap-2 rounded-md bg-zinc-950 px-4 py-3 text-base font-medium text-zinc-50 outline outline-1 outline-[#fff2f21f]">
                  Start Analysis <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-border py-8"></footer>
      </div>
    </div>
  );
}
