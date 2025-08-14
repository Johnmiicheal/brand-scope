/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import BlurText from "@/components/fancy-web/blur-text";
import { GlowEffect } from "@/components/fancy-web/glow-effect";
import {
  ArrowRight,
  Check,
  Search,
  Target,
  Sparkles,
  Globe,
  ScanFace,
  UserSearch,
  ChevronRight,
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
import { SparklesCore } from "@/components/fancy-web/sparkles";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion as m, AnimatePresence } from "framer-motion";
import {
  AiStudio,
  Claude,
  DeepMind,
  DeepSeek,
  Gemini,
  Grok,
  Meta,
  Mistral,
  OpenAI,
  Perplexity,
  Qwen,
  Baidu,
  Kimi,
} from "@lobehub/icons";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
      } else {
        setIsAuthenticated(true);
      }
    };
    checkUser();
  }, []);

  const modelIcons: Record<
    string,
    React.ComponentType<{ className?: string }>
  > = {
    "gpt-4o-search": OpenAI,
    "claude-search": Claude.Color,
    "perplexity-sonar": Perplexity,
    "gemini-search": Gemini.Color,
    "google-ai-mode": DeepMind.Color,
    "google-ai-overview": Gemini.Color,
    "deepseek-v3": DeepSeek.Color,
    "gpt-4.1-nano": OpenAI,
    "grok-3-mini": Grok,
    "llama-4-maverick": Meta.Color,
    "mistral-medium": Mistral.Color,
    "ernie-4.5": Baidu.Color,
    "qwen-3-235b": Qwen.Color,
    "kimi-k2": Kimi.Color,
    "gpt-5": OpenAI,
  };

  const plans = [
    {
      id: "pro",
      name: "Pro Plan",
      description: "Get Started with essential AI Analysis.",
      price: "$89",
      features: [
        "Country Monitoring",
        "Company Research",
        "SEO Keyword Analysis",
        "Native AI Search",
      ],
      models: [
        { name: "GPT 4o Web Search", key: "gpt-4o-search" },
        { name: "Claude 4.0 Sonnet", key: "claude-search" },
        { name: "Perplexity Sonar", key: "perplexity-sonar" },
        { name: "Gemini 2.5 Flash", key: "gemini-search" },
        { name: "Google AI Overview", key: "google-ai-overview" },
        { name: "Google AI Mode", key: "google-ai-mode" },
      ],
      credits: "2250 Credits",
      searches: "30 Searches",
      monitoring: "10 Monitoring",
      frequency: "(Weekly only)",
      recommended: false,
      product_id: "price_1RniuTR16g0cZkq31HV8wnRh",
    },
    {
      id: "plus",
      name: "Plus Plan",
      description: "Scale your insights and monitoring.",
      price: "$249",
      features: [
        "Country Monitoring",
        "Company Research",
        "SEO Keyword Analysis",
        "Native AI Search",
      ],
      credits: "7200 Credits",
      models: [
        { name: "GPT 4o Web Search", key: "gpt-4o-search" },
        { name: "Claude 4.0 Sonnet", key: "claude-search" },
        { name: "Perplexity Sonar", key: "perplexity-sonar" },
        { name: "Gemini 2.5 Flash", key: "gemini-search" },
        { name: "Google AI Overview", key: "google-ai-overview" },
        { name: "Google AI Mode", key: "google-ai-mode" },
      ],
      searches: "300 Searches",
      monitoring: "100 Monitoring",
      frequency: "(Daily + Weekly)",
      recommended: true,
      product_id: "price_1Rniv8R16g0cZkq37mTSXDfo",
    },
    {
      id: "premium",
      name: "Premium Plan",
      description: "For comprehensive insights and monitoring.",
      price: "$699",
      features: [
        "Country Monitoring",
        "Company Research",
        "SEO Keyword Analysis",
        "Native AI Search",
      ],
      credits: "27000 Credits",
      models: [
        { name: "GPT 4o Web Search", key: "gpt-4o-search" },
        { name: "Claude 4.0 Sonnet", key: "claude-search" },
        { name: "Perplexity Sonar", key: "perplexity-sonar" },
        { name: "Gemini 2.5 Flash", key: "gemini-search" },
        { name: "Google AI Overview", key: "google-ai-overview" },
        { name: "Google AI Mode", key: "google-ai-mode" },
        { name: "DeepSeek v3", key: "deepseek-v3" },
        { name: "GPT 4.1 Nano", key: "gpt-4.1-nano" },
        { name: "Grok 3 Mini", key: "grok-3-mini" },
        { name: "Llama 4 Maverick", key: "llama-4-maverick" },
      ],
      searches: "900 Searches",
      monitoring: "300 Monitoring",
      frequency: "(Daily + Weekly)",
      recommended: false,
      product_id: "price_1RnivgR16g0cZkq3Re1ttVTu",
    },
  ];

  const formatPrice = (priceString: string) => {
    const numericPrice = parseInt(priceString.replace(/[^0-9]/g, ""));
    return isYearly ? numericPrice * 11 : numericPrice;
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden px-4">
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative pb-20"
      >
        <div className="max-w-[1684px] border-x border-b p-2 border-dashed flex flex-col relative h-full items-center mx-auto">
          <header className="bg-background container mx-auto py-6 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Image
                src="/icons/air-logo-light.png"
                alt="AI Rankia Logo"
                width={120}
                height={120}
              />
            </div>
            <div className="flex gap-4 items-center">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="text-sm font-medium hover:underline"
                >
                  <Button variant="outline" size="sm">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-medium hover:underline"
                  >
                    Log in
                  </Link>
                  <Link href="/onboarding">
                    <Button variant="outline" size="sm">
                      Sign up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </header>

          <main className="bg-background container mx-auto space-y-30 pt-16 pb-24 w-full">
            <section>
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative mx-auto max-w-5xl space-y-5 px-4 sm:px-6 lg:px-8 pt-10 pb-20 sm:pb-24 text-center"
              >
                <BlurText
                  text="Get insights on how your brand performs in AI Search."
                  delay={150}
                  animateBy="words"
                  direction="top"
                  className="text-4xl md:text-7xl font-bold text-center"
                />
                <m.p
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
                </m.p>
                <div className="relative w-fit mx-auto mt-8 cursor-pointer">
                  <GlowEffect
                    colors={["#0D47A1", "#1976D2", "#42A5F5", "#90CAF9", "#7B1FA2", "#E91E63"]}
                    mode={"rotate"}
                    blur="soft"
                    duration={6}
                    scale={0.85}
                    className={"w-57 -ml-3 rounded-full"}
                  />
                  <button
                    onClick={() => window.location.assign("/onboarding")}
                    className="rounded-full relative cursor-pointer inline-flex items-center gap-2 bg-zinc-950 px-4 py-3 text-base font-medium text-zinc-50 outline outline-1 outline-[#fff2f21f]"
                  >
                    Analyse your Brand <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </m.div>
              <div className="relative w-full max-w-[1920px] mx-auto -mt-30">
                <Image
                  src="/air-dash.png"
                  width={2400}
                  height={1350}
                  alt="AI Rankia Dashboard"
                  className="w-full relative"
                />
                <div
                  className="absolute bottom-0 left-0 w-full h-50 pointer-events-none z-20"
                  style={{
                    background:
                      "linear-gradient(to bottom, transparent,oklch(0 0 0))", // match background
                  }}
                />
              </div>
            </section>

            {/* AI Models Marquee Section */}
            <section className=" -mt-8">
              <IconMarquee />
              <div className="text-center mb-6 mt-4">
                <p className="text-neutral-400 max-w-2xl mx-auto text-sm">
                  *We analyze your brand across all major AI Search Engines to
                  ensure comprehensive insights.*
                </p>
              </div>
            </section>

            <section className="relative">
              <BentoFeatures />
              <div className="border-x border-dashed w-7xl h-12 mx-auto -mt-15"></div>
              <PixelCard
                variant="blue"
                className="max-w-7xl mx-auto w-full h-[450px] flex flex-col items-center justify-center"
              >
                <div className="absolute w-full py-8 mx-auto xs:text-2xl text-2xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-5xl flex flex-col items-center justify-center text-white tracking-wide uppercase">
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
                    {`MARKETING PERFORMANCE `}
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
                    <button
                      onClick={() => window.location.assign("/login")}
                      className="relative cursor-pointer inline-flex items-center gap-2 rounded-md bg-zinc-950 px-4 py-3 text-base font-medium text-zinc-50 outline outline-1 outline-[#fff2f21f]"
                    >
                      Start Analysis <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </PixelCard>
            </section>

            {/* Why Choose Us Section */}
            <section className="py-20 flex flex-col items-center mx-auto">
              <div className="px-8 py-10">
                <h4 className="text-3xl lg:text-5xl lg:leading-tight max-w-5xl mx-auto text-center tracking-tight font-medium text-black dark:text-white">
                  Analyze. Monitor. Stay Ahead
                </h4>

                <p className="text-sm lg:text-base max-w-5xl my-4 mx-auto text-neutral-500 text-center font-normal dark:text-neutral-300">
                  AI Rankia doesn't just analyze, it illuminates. Discover
                  untapped opportunities in keyword optimization, competitive
                  positioning, and market trends before your competitors do.
                  Make strategic decisions with clarity, not uncertainty.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 max-w-7xl mx-auto">
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
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
                </m.div>
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
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
                </m.div>
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <SpotlightCard>
                    <Target className="h-10 w-10 mb-4 text-blue-400" />
                    <h3 className="text-xl font-semibold mb-2">
                      Actionable Strategies
                    </h3>
                    <p className="text-neutral-400 text-sm">
                      Get clear recommendations to improve visibility and
                      optimize for AI discovery.
                    </p>
                  </SpotlightCard>
                </m.div>
              </div>
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="border-x border-dashed mx-auto justify-center flex w-7xl"
              >
                <Image
                  src="/mask-ship-new.png"
                  width={800}
                  height={1080}
                  alt="AI Rankia"
                  className="opacity-70"
                />
              </m.div>
              <div className="grid grid-cols-1 md:grid-cols-3 max-w-7xl mx-auto">
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <SpotlightCard>
                    <Search className="h-10 w-10 mb-4 text-blue-400" />
                    <h3 className="text-xl font-semibold mb-2">
                      Optimize for AI Search
                    </h3>
                    <p className="text-neutral-400 text-sm">
                      Ensure your brand appears prominently when users search
                      via AI assistants and chatbots.
                    </p>
                  </SpotlightCard>
                </m.div>
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <SpotlightCard className="border-x-0">
                    <ScanFace className="h-10 w-10 mb-4 text-blue-400" />
                    <h3 className="text-xl font-semibold mb-2">
                      Track Brand Perception
                    </h3>
                    <p className="text-neutral-400 text-sm">
                      Monitor sentiment and understand how different AI models
                      portray your brand image.
                    </p>
                  </SpotlightCard>
                </m.div>
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <SpotlightCard>
                    <UserSearch className="h-10 w-10 mb-4 text-blue-400" />
                    <h3 className="text-xl font-semibold mb-2">
                      Analyze Competitors
                    </h3>
                    <p className="text-neutral-400 text-sm">
                      Gain insights into competitor strategies and identify
                      opportunities in the AI landscape
                    </p>
                  </SpotlightCard>
                </m.div>
              </div>
            </section>

            {/* Sleek Pricing Section */}
            <section className="py-20">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
                Pricing Plans
              </h2>
              <p className="text-neutral-400 text-center max-w-xl mx-auto mb-8">
                Choose the plan that scales with your brand's AI visibility
                needs.
              </p>

              <div className="flex items-center justify-center gap-3 mb-12">
                <span
                  className={`text-sm ${
                    !isYearly ? "text-white" : "text-neutral-400"
                  }`}
                >
                  Monthly
                </span>
                <button
                  onClick={() => setIsYearly(!isYearly)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isYearly ? "bg-blue-600" : "bg-neutral-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isYearly ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span
                  className={`text-sm ${
                    isYearly ? "text-white" : "text-neutral-400"
                  }`}
                >
                  Yearly
                  <span className="ml-1 text-xs text-blue-400">
                    (Save 8.3%)
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-px max-w-7xl mx-auto border border-muted">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`${
                      plan.recommended
                        ? "bg-gradient-to-br from-background to-blue-900/50 ring-2 ring-blue-600/40"
                        : "bg-zinc-950"
                    } p-6 relative flex flex-col justify-between border`}
                  >
                    {plan.recommended && (
                      <span className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-semibold px-3 py-1">
                        Popular
                      </span>
                    )}
                    <div>
                      <h3 className="text-xl font-semibold mb-1">
                        {plan.name}
                      </h3>
                      <p className="text-neutral-300 text-sm mb-6">
                        {plan.description}
                      </p>
                      <div className="mb-6">
                        <AnimatePresence mode="wait">
                          <m.div
                            key={isYearly ? "yearly" : "monthly"}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="flex items-baseline"
                          >
                            <p className="text-3xl font-bold">
                              ${formatPrice(plan.price)}
                              <span className="text-base font-normal text-neutral-400">
                                /{isYearly ? "yr" : "mo"}
                              </span>
                            </p>
                          </m.div>
                        </AnimatePresence>
                      </div>
                      <ul className="space-y-3 text-sm text-neutral-200 mb-8">
                        <li className="flex items-center gap-3">
                          <Check className="h-4 w-4 text-green-400 flex-shrink-0" />{" "}
                          {plan.credits}
                        </li>
                        <li className="flex items-center gap-3">
                          <Check className="h-4 w-4 text-green-400 flex-shrink-0" />{" "}
                          Prompt Monitoring {plan.frequency}
                        </li>
                        <li className="flex items-center gap-3">
                          <Check className="h-4 w-4 text-green-400 flex-shrink-0" />{" "}
                          {plan.features[0]}
                        </li>
                        <li className="flex items-center gap-3">
                          <Check className="h-4 w-4 text-green-400 flex-shrink-0" />{" "}
                          {plan.features[1]}
                        </li>
                        <li className="flex items-center gap-3">
                          <Check className="h-4 w-4 text-green-400 flex-shrink-0" />{" "}
                          {plan.features[2]}
                        </li>
                        <li className="flex items-center gap-3">
                          <Check className="h-4 w-4 text-green-400 flex-shrink-0" />{" "}
                          {plan.features[3]}
                        </li>

                        {/* AI Models Section */}
                        <li className="flex items-start gap-3 mt-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap gap-2 mt-2">
                              {plan.models.map((model, index) => {
                                const IconComponent = modelIcons[model.key];
                                return (
                                  <div
                                    key={index}
                                    className="flex items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded-md"
                                  >
                                    {IconComponent && (
                                      <IconComponent className="h-3 w-3" />
                                    )}
                                    <span className="text-xs text-neutral-300">
                                      {model.name}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </li>
                      </ul>
                    </div>
                    <Button
                      className={`w-full mt-6 ${
                        plan.recommended
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30"
                          : "bg-neutral-800 hover:bg-neutral-700"
                      }`}
                    >
                      Choose {plan.name}
                    </Button>
                  </div>
                ))}
              </div>

              {/* Enterprise Plan Section */}
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }} // Slightly later delay
                viewport={{ once: true }}
                className="max-w-7xl mx-auto mt-6 bg-zinc-950 p-8 border flex flex-col md:flex-row items-center justify-between"
              >
                <div className="md:w-2/3 mb-6 md:mb-0">
                  <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
                  <p className="text-neutral-400 text-sm mb-4">
                    Tailored solutions for large organizations with
                    comprehensive AI brand analysis needs across multiple
                    markets and products.
                  </p>
                  <ul className="space-y-2 text-sm text-neutral-300 columns-1">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-400 flex-shrink-0" />{" "}
                      Analyze your prompts across all top AI Models
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-400 flex-shrink-0" />{" "}
                      Detailed Keyword Overview and Insights
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-400 flex-shrink-0" />{" "}
                      Competitor Intelligence Suite
                    </li>
                  </ul>
                </div>
                <div className="md:w-1/3 text-center md:text-right">
                  <p className="text-3xl font-bold mb-4">Custom</p>
                  <Button variant="outline" className="w-full md:w-auto">
                    Contact Sales
                  </Button>
                </div>
              </m.div>
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
                      accurately represented and easily discoverable by AI
                      models like ChatGPT, Gemini, Claude, etc., which are
                      increasingly used for information discovery.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2" className="">
                    <AccordionTrigger className="text-left hover:no-underline text-base md:text-lg">
                      How does AI Rankia analyze my brand?
                    </AccordionTrigger>
                    <AccordionContent className="text-neutral-400 text-sm md:text-base">
                      We use multiple leading AI models to simulate user queries
                      related to your brand and industry. We analyze the
                      responses for visibility, sentiment, accuracy, and
                      competitive positioning.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3" className="">
                    <AccordionTrigger className="text-left hover:no-underline text-base md:text-lg">
                      Which AI platforms do you cover?
                    </AccordionTrigger>
                    <AccordionContent className="text-neutral-400 text-sm md:text-base">
                      We cover all major platforms including those from OpenAI,
                      Google, Anthropic, Meta, Mistral, Perplexity, and more.
                      Our platform support is constantly expanding.
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
            <section className="pt-20 text-center relative overflow-hidden w-full">
              <div className=" w-full bg-background flex flex-col items-center justify-center overflow-hidden rounded-md">
                <h1 className="md:text-7xl text-3xl lg:text-9xl font-bold text-center text-white/50 relative z-20">
                  AI Rankia
                </h1>
                <div className="w-[40rem] h-40 relative">
                  {/* Gradients */}
                  <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm" />
                  <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4" />
                  <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] w-1/4 blur-sm" />
                  <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px w-1/4" />

                  {/* Core component */}
                  <SparklesCore
                    background="transparent"
                    minSize={0.4}
                    maxSize={1}
                    particleDensity={1200}
                    className="w-full h-full"
                    particleColor="#FFFFFF"
                  />

                  {/* Radial Gradient to prevent sharp edges */}
                  <div className="absolute inset-0 w-full h-full bg-background [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]"></div>
                </div>
              </div>
            </section>
          </main>

          {/* Sleek Minimalistic Footer */}
          <footer className="w-full border-t  py-6">
            <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-neutral-500">
              <span>
                &copy; {new Date().getFullYear()} AI Rankia. All rights
                reserved.
              </span>
              <div className="flex space-x-4 mt-4 md:mt-0">
                <Link href="/privacy-policy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <Link href="#" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </m.div>
    </div>
  );
}
