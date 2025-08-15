/* eslint-disable react/no-unescaped-entities */
import { Check } from "lucide-react";
import { Button } from "../ui/button";
import { AnimatePresence, motion as m } from "framer-motion";
import { useState } from "react";
import { plans } from "@/lib/utils";
import { Baidu, Claude, DeepMind, DeepSeek, Gemini, Grok, Kimi, MetaAI, Mistral, OpenAI, Perplexity, Qwen } from "@lobehub/icons";


export default function Pricing() {
    const [isYearly, setIsYearly] = useState(false);

    const formatPrice = (priceString: string) => {
        const numericPrice = parseInt(priceString.replace(/[^0-9]/g, ""));
        return isYearly ? numericPrice * 11 : numericPrice;
      };

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
    "grok-4": Grok,
    "llama-4-maverick": MetaAI.Color,
    "mistral-medium": Mistral.Color,
    "ernie-4.5": Baidu.Color,
    "qwen-3-235b": Qwen.Color,
    "kimi-k2": Kimi.Color,
    "gpt-5": OpenAI,
  };


    return (
        <section className="py-20 p-4">
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
    )
}