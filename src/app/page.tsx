/* eslint-disable react/no-unescaped-entities */
"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Spotlight } from "@/components/fancy-web/spotlight";
import BlurText from "@/components/fancy-web/blur-text";
import * as FramerMotion from "framer-motion";
import { GlowEffect } from "@/components/fancy-web/glow-effect";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

const { motion } = FramerMotion;

export default function Home() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <div className="max-w-[1920px] flex flex-col relative h-full items-center mx-auto">
        <Spotlight />
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
                <button className="relative inline-flex items-center gap-2 rounded-md bg-zinc-950 px-4 py-3 text-base font-medium text-zinc-50 outline outline-1 outline-[#fff2f21f]">
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
        </main>

        <footer className="border-t border-border py-8"></footer>
      </div>
    </div>
  );
}
