/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion as m } from "framer-motion";
import Hero from "@/components/landing/hero";
import Features from "@/components/landing/features";
import Pricing from "@/components/landing/pricing";
import Platform from "@/components/landing/platform";
import Request from "@/components/landing/request";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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


  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative pb-20"
      >
        <div className="flex flex-col relative h-full items-center mx-auto">
          <main className="bg-background mx-auto space-y-30 w-full">
            <Hero isAuthenticated={isAuthenticated} />
            <Features />
            <Platform />
            <Pricing />

            {/* Sleek Pricing Section */}

            {/* FAQ Section */}
            <section className="py-20 px-4">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                Frequently Asked Questions
              </h2>
              <div className="max-w-3xl mx-auto">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1" className="">
                    <AccordionTrigger className="text-left hover:no-underline text-base md:text-lg">
                      What is AI Search Engine Optimization (AI SEO)?
                    </AccordionTrigger>
                    <AccordionContent className="text-neutral-400 text-sm md:text-base">
                      AI SEO is the practice of optimizing your brand's content
                      to be accurately represented and easily discoverable by AI
                      models like ChatGPT, Gemini, and Claude. These models are
                      increasingly used for information discovery, making AI SEO
                      crucial for maintaining brand visibility.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2" className="">
                    <AccordionTrigger className="text-left hover:no-underline text-base md:text-lg">
                      How does AI SEO differ from traditional SEO?
                    </AccordionTrigger>
                    <AccordionContent className="text-neutral-400 text-sm md:text-base">
                      Unlike traditional SEO, which focuses on optimizing for
                      search engines like Google, AI SEO targets AI models that
                      provide direct answers to user queries. This involves
                      ensuring your content is structured and relevant for
                      AI-driven platforms.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3" className="">
                    <AccordionTrigger className="text-left hover:no-underline text-base md:text-lg">
                      Why is AI SEO important for my brand?
                    </AccordionTrigger>
                    <AccordionContent className="text-neutral-400 text-sm md:text-base">
                      As AI models become more prevalent in search, ensuring
                      your brand is visible and accurately represented in AI
                      responses is essential. AI SEO helps you maintain a
                      competitive edge by optimizing your content for these
                      emerging platforms.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4" className="">
                    <AccordionTrigger className="text-left hover:no-underline text-base md:text-lg">
                      How can AI SEO improve my brand's visibility?
                    </AccordionTrigger>
                    <AccordionContent className="text-neutral-400 text-sm md:text-base">
                      By optimizing your content for AI models, you can increase
                      the likelihood of your brand being mentioned in
                      AI-generated responses. This can lead to greater brand
                      awareness and engagement from users who rely on AI for
                      information.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-5" className="">
                    <AccordionTrigger className="text-left hover:no-underline text-base md:text-lg">
                      What strategies are used in AI SEO?
                    </AccordionTrigger>
                    <AccordionContent className="text-neutral-400 text-sm md:text-base">
                      AI SEO strategies include optimizing content for natural
                      language processing, using structured data to enhance AI
                      understanding, and analyzing AI-generated responses to
                      refine content for better visibility.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-6" className="">
                    <AccordionTrigger className="text-left hover:no-underline text-base md:text-lg">
                      How do AI models evaluate my brand's content?
                    </AccordionTrigger>
                    <AccordionContent className="text-neutral-400 text-sm md:text-base">
                      AI models evaluate content based on relevance, accuracy,
                      and user engagement. They use natural language processing
                      to understand context and sentiment, making it important
                      to create content that aligns with these criteria.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-7" className="">
                    <AccordionTrigger className="text-left hover:no-underline text-base md:text-lg">
                      Can AI SEO help me track my competitors?
                    </AccordionTrigger>
                    <AccordionContent className="text-neutral-400 text-sm md:text-base">
                      Yes, AI SEO tools can analyze how competitors are
                      performing in AI search results. This provides valuable
                      insights into their strategies and visibility, allowing
                      you to adjust your approach to stay competitive.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </section>

            <Request />
          </main>

          {/* Sleek Minimalistic Footer */}
          <footer className="w-full border-t  py-6">
            <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-neutral-500">
              <span>
                &copy; {new Date().getFullYear()} AI Rankia. All rights
                reserved.
              </span>
              <div className="flex space-x-4 mt-4 md:mt-0">
                <Link
                  href="/privacy-policy"
                  className="hover:text-white transition-colors"
                >
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
