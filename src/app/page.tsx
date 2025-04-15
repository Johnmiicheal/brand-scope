/* eslint-disable react/no-unescaped-entities */
"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import BlurText from "@/components/fancy-web/blur-text";
import * as FramerMotion from "framer-motion";
import { GlowEffect } from "@/components/fancy-web/glow-effect";
import {
  ArrowRight,
  Check,
  Search,
  Target,
  TrendingUp,
  Users,
  Sparkles,
  Globe,
} from "lucide-react";
import Image from "next/image";
import { IconMarquee } from "@/components/marquee";
import { BentoFeatures } from "@/components/fancy-web/bento-features";
import { VerticalCutReveal } from "@/components/fancy-web/vertical-cut-reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import SpotlightCard from "@/components/fancy-web/spotlight-card";
import PixelCard from "@/components/fancy-web/pixel-card";

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

        <main className="bg-background container mx-auto space-y-30 pt-16 pb-24 w-full">
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
          <section className=" -mt-8">
            <IconMarquee />
            <div className="text-center mb-6 mt-4">
              <p className="text-neutral-400 max-w-2xl mx-auto text-sm">
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
            <div className="border-x border-dashed w-7xl h-12 mx-auto -mt-15"></div>
            <PixelCard variant="blue" className="max-w-7xl mx-auto w-full h-[450px] flex flex-col items-center justify-center">
              <div className="absolute w-full py-8 mx-auto xs:text-2xl text-2xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-5xl flex flex-col items-center justify-center text-white tracking-wide uppercase" >
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
            </PixelCard>
          </section>

          {/* Why Choose Us Section */}
          <section className="py-20">
            <div className="px-8">
              <h4 className="text-3xl lg:text-5xl lg:leading-tight max-w-5xl mx-auto text-center tracking-tight font-medium text-black dark:text-white">
                Analyze. Monitor. Stay Ahead
              </h4>

              <p className="text-sm lg:text-base max-w-5xl my-4 mx-auto text-neutral-500 text-center font-normal dark:text-neutral-300">
              BrandScope doesn't just analyze, it illuminates. Discover untapped opportunities in brand perception, competitive positioning, and market trends before your competitors do. Make strategic decisions with clarity, not uncertainty.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <SpotlightCard>
                  <Sparkles className="h-10 w-10 mb-4 text-blue-400" />
                  <h3 className="text-xl font-semibold mb-2">
                    AI-Native Insights
                  </h3>
                  <p className="text-neutral-400 text-sm">
                    Understand exactly how AI models see your brand, not just
                    traditional search engines.
                  </p>
                </SpotlightCard>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <SpotlightCard className="border-x-0">
                  <Globe className="h-10 w-10 mb-4 text-blue-400" />
                  <h3 className="text-xl font-semibold mb-2">
                    Multi-Platform Coverage
                  </h3>
                  <p className="text-neutral-400 text-sm">
                    Analyze performance across all major AI platforms for a
                    complete picture.
                  </p>
                </SpotlightCard>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <SpotlightCard>
                  <Target className="h-10 w-10 mb-4 text-blue-400" />
                  <h3 className="text-xl font-semibold mb-2">
                    Actionable Strategies
                  </h3>
                  <p className="text-neutral-400 text-sm">
                    Get clear recommendations to improve visibility and optimize
                    for AI discovery.
                  </p>
                </SpotlightCard>
              </motion.div>
            </div>
          </section>

          {/* How It Helps Section */}
          <section className="py-20 bg-zinc-950 max-w-4xl mx-auto border ">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              How Brand Scope Helps You Thrive
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto px-4">
              <div className="flex items-start gap-4">
                <div className="bg-blue-500/10 p-3 rounded-full">
                  <Search className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Optimize for AI Search
                  </h3>
                  <p className="text-neutral-400 text-sm">
                    Ensure your brand appears prominently when users search via
                    AI assistants and chatbots.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-blue-500/10 p-3 rounded-full">
                  <TrendingUp className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Track Brand Perception
                  </h3>
                  <p className="text-neutral-400 text-sm">
                    Monitor sentiment and understand how different AI models
                    portray your brand image.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-blue-500/10 p-3 rounded-full">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Analyze Competitors
                  </h3>
                  <p className="text-neutral-400 text-sm">
                    Gain insights into competitor strategies and identify
                    opportunities in the AI landscape.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing Section */}
          <section className="py-20">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Simple, Transparent Pricing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Pricing Card 1: Starter */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="bg-zinc-900/50 p-8 border  flex flex-col"
              >
                <h3 className="text-xl font-semibold mb-2">Starter</h3>
                <p className="text-neutral-400 text-sm mb-4">
                  Ideal for individuals & small teams.
                </p>
                <p className="text-4xl font-bold mb-6">
                  $49
                  <span className="text-lg font-normal text-neutral-400">
                    /mo
                  </span>
                </p>
                <ul className="space-y-2 text-sm text-neutral-300 mb-8 flex-grow">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" /> Basic
                    Brand Analysis
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" /> 1 AI
                    Platform
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" /> Limited
                    Competitor Tracking
                  </li>
                </ul>
                <Button variant="outline" className="w-full mt-auto">
                  Get Started
                </Button>
              </motion.div>

              {/* Pricing Card 2: Pro (Highlight) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-zinc-900/80 p-8 border border-blue-500 relative flex flex-col ring-2 ring-blue-500/50"
              >
                <span className="absolute top-0 right-4 -mt-3 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </span>
                <h3 className="text-xl font-semibold mb-2">Pro</h3>
                <p className="text-neutral-400 text-sm mb-4">
                  Perfect for growing businesses.
                </p>
                <p className="text-4xl font-bold mb-6">
                  $149
                  <span className="text-lg font-normal text-neutral-400">
                    /mo
                  </span>
                </p>
                <ul className="space-y-2 text-sm text-neutral-300 mb-8 flex-grow">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />{" "}
                    Comprehensive Analysis
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" /> 5 AI
                    Platforms
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" /> Full
                    Competitor Tracking
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" /> Sentiment
                    Analysis
                  </li>
                </ul>
                <Button className="w-full mt-auto bg-blue-600 hover:bg-blue-700 text-white">
                  Choose Pro
                </Button>
              </motion.div>

              {/* Pricing Card 3: Enterprise */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
                className="bg-zinc-900/50 p-8 border  flex flex-col"
              >
                <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
                <p className="text-neutral-400 text-sm mb-4">
                  Tailored for large organizations.
                </p>
                <p className="text-4xl font-bold mb-6">Custom</p>
                <ul className="space-y-2 text-sm text-neutral-300 mb-8 flex-grow">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" /> All Pro
                    Features
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" /> All AI
                    Platforms
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" /> API Access
                    & Integrations
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" /> Dedicated
                    Support
                  </li>
                </ul>
                <Button variant="outline" className="w-full mt-auto">
                  Contact Sales
                </Button>
              </motion.div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-20">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="">
                  <AccordionTrigger className="text-left hover:no-underline text-base md:text-lg">
                    What is AI Search Optimization?
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-400 text-sm md:text-base">
                    It's the process of ensuring your brand and content are
                    accurately represented and easily discoverable by AI models
                    like ChatGPT, Gemini, Claude, etc., which are increasingly
                    used for information discovery.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="">
                  <AccordionTrigger className="text-left hover:no-underline text-base md:text-lg">
                    How does Brand Scope analyze my brand?
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-400 text-sm md:text-base">
                    We use multiple leading AI models to simulate user queries
                    related to your brand and industry. We analyze the responses
                    for visibility, sentiment, accuracy, and competitive
                    positioning.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="">
                  <AccordionTrigger className="text-left hover:no-underline text-base md:text-lg">
                    Which AI platforms do you cover?
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-400 text-sm md:text-base">
                    We cover all major platforms including those from OpenAI,
                    Google, Anthropic, Meta, Mistral, Perplexity, and more. Our
                    platform support is constantly expanding.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4" className="">
                  <AccordionTrigger className="text-left hover:no-underline text-base md:text-lg">
                    Can I track my competitors?
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-400 text-sm md:text-base">
                    Yes, depending on your plan, you can track how your
                    competitors are performing in AI search results and gain
                    valuable insights into their strategies and visibility.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="py-20 text-center relative overflow-hidden">
            <div className="absolute inset-0 z-0">
              {/* Optional: Add a subtle background pattern or effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/10 blur-3xl"></div>
            </div>
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Ready to See Your Brand Through AI's Eyes?
              </h2>
              <p className="text-neutral-300 text-lg mb-8">
                Sign up today and start optimizing your brand for the future of
                search.
              </p>
              <div className="relative w-fit mx-auto cursor-pointer">
                <GlowEffect
                  colors={["#6366F1", "#8B5CF6", "#EC4899"]}
                  mode={"rotate"}
                  blur="medium"
                  duration={4}
                  scale={0.9}
                  className={"w-57 -ml-3"}
                />
                <button className="relative cursor-pointer inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-shadow">
                  Start Your Free Analysis <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </section>
        </main>

        {/* Footer Section */}
        <footer className="border-t  py-12 w-full container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <span className="text-xl font-bold mb-4 block">Brand Scope</span>
              <p className="text-sm text-neutral-400">
                Understand and optimize your brand's presence in the age of AI.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-neutral-400 hover:text-white">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-neutral-400 hover:text-white">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-neutral-400 hover:text-white">
                    How it Works
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-neutral-400 hover:text-white">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-neutral-400 hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-neutral-400 hover:text-white">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-neutral-400 hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-neutral-400 hover:text-white">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t  text-center text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} Brand Scope. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}
