/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useRef, useState } from "react";
import { Brand } from "@/lib/supabase/brands";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/loading-state";
import Stripe from "stripe";
import { useRouter } from "next/navigation";
import { UserSubscription } from "@/hooks/useAuth";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CloudUpload } from "lucide-react";
import Image from "next/image";
import { CheckoutButton } from "@/components/stripe/checkout-button";
import {
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
import { countries } from "@/lib/countries";

export default function OnboardingPage() {
  const router = useRouter();
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandWebsite, setBrandWebsite] = useState("");
  const [brandIndustry, setBrandIndustry] = useState("");
  const [brandLogo, setBrandLogo] = useState<File | null>(null);
  const [brandLogoPreview, setBrandLogoPreview] = useState<string | null>(null);
  const [brandLocation, setBrandLocation] = useState("");
  const [brandLanguage, setBrandLanguage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sessionKey, setSessionKey] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null
  );
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      setSubLoading(true);
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        setUser(null);
        setSubscription(null);
        setSubLoading(false);
        return;
      }

      if (!session) {
        if (window.location.pathname !== "/login") {
          router.push("/login");
        }
        setUser(null);
        setSubscription(null);
        setSubLoading(false);
      } else {
        setSessionKey(session.access_token || "");
        setUser(session.user);
        setSubLoading(false);
      }
    };
    checkAuth();
  }, []);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const INDUSTRIES = [
    "Aerospace",
    "Agriculture",
    "Automotive",
    "Banking",
    "Beauty",
    "Biotechnology",
    "Construction",
    "Consulting",
    "E-commerce",
    "Education",
    "Energy",
    "Entertainment",
    "Fashion",
    "Finance",
    "Food & Beverage",
    "Gaming",
    "Government",
    "Healthcare",
    "Insurance",
    "Legal",
    "Logistics",
    "Manufacturing",
    "Marketing",
    "Media",
    "Mining",
    "Music",
    "Non-Profit",
    "Pharmaceuticals",
    "Publishing",
    "Real Estate",
    "Retail",
    "Security",
    "Sports",
    "Technology",
    "Telecommunications",
    "Transportation",
    "Travel",
    "Utilities",
    "Other",
  ];
  // Plans configuration
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
        { name: "GPT 5", key: "gpt-5" },
        { name: "GPT 4o Web Search", key: "gpt-4o-search" },
        { name: "Claude 4.0 Sonnet", key: "claude-search" },
        { name: "Perplexity Sonar", key: "perplexity-sonar" },
        { name: "Gemini 2.5 Flash", key: "gemini-search" },
        { name: "Google AI Overview", key: "google-ai-overview" },
        { name: "Google AI Mode", key: "google-ai-mode" },
        { name: "DeepSeek v3", key: "deepseek-v3" },
        { name: "Grok 4", key: "grok-4" },
        { name: "Llama 4 Maverick", key: "llama-4-maverick" },
        { name: "Mistral Medium", key: "mistral-medium" },
        { name: "Ernie 4.5", key: "ernie-4.5" },
        { name: "Qwen 3.235B", key: "qwen-3-235b" },
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
        { name: "GPT 5", key: "gpt-5" },
        { name: "GPT 4o Web Search", key: "gpt-4o-search" },
        { name: "Claude 4.0 Sonnet", key: "claude-search" },
        { name: "Perplexity Sonar", key: "perplexity-sonar" },
        { name: "Gemini 2.5 Flash", key: "gemini-search" },
        { name: "Google AI Overview", key: "google-ai-overview" },
        { name: "Google AI Mode", key: "google-ai-mode" },
        { name: "DeepSeek v3", key: "deepseek-v3" },
        { name: "Grok 4", key: "grok-4" },
        { name: "Llama 4 Maverick", key: "llama-4-maverick" },
      ],
      searches: "900 Searches",
      monitoring: "300 Monitoring",
      frequency: "(Daily + Weekly)",
      recommended: false,
      product_id: "price_1RnivgR16g0cZkq3Re1ttVTu",
    },
  ];

  const handleNextStep = () => {
    setOnboardingStep((prev) => prev + 1);
  };

  const handleSkip = () => {
    if (onboardingStep === 0) {
      setSelectedPlan("free");
    }
    setOnboardingStep((prev) => prev + 1);
  };

  const handleCreateBrand = async () => {
    if (!brandName || !brandWebsite || !brandIndustry) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in to create a brand");
        setSubmitting(false);
        return;
      }

      let logoData = null;

      // Convert file to base64 if provided
      if (brandLogo) {
        logoData = brandLogoPreview;
      }

      // Create brand record
      const brandId = uuidv4();
      const { error } = await supabase
        .from("brand_project")
        .insert([
          {
            id: brandId,
            name: brandName,
            logo_url: logoData,
            website: brandWebsite,
            industry: brandIndustry,
            user_id: user.id,
            location: brandLocation,
            language: brandLanguage,
          },
        ])
        .select();

      if (error) {
        console.error("Error creating brand:", error);
        setSubmitting(false);
        return;
      }

      // Clear form
      setBrandName("");
      setBrandWebsite("");
      setBrandIndustry("");
      setBrandLogo(null);
      setBrandLogoPreview(null);

      // Trigger brand analysis
      await analyzeBrand(brandId);

      setSubmitting(false);
    } catch (error) {
      console.error("Error:", error);
      setSubmitting(false);
    }
  };

  const analyzeBrand = async (brandId: string) => {
    try {
      setIsAnalyzing(true);
      // Call the analysis API
      const response = await fetch(
        process.env.NEXT_PUBLIC_ANALYZE_BRAND as string,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionKey}`,
          },
          body: JSON.stringify({
            brandId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Brand analysis failed:", errorData);
        setIsAnalyzing(false);
        return;
      }
      toast.success("Brand analysis completed");
      setOnboardingStep((prev) => prev + 1);
      setIsAnalyzing(false);
    } catch (error) {
      console.error("Error analyzing brand:", error);
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBrandLogo(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setBrandLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setBrandLogo(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setBrandLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
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
    "llama-4-maverick": Meta.Color,
    "mistral-medium": Mistral.Color,
    "ernie-4.5": Baidu.Color,
    "qwen-3-235b": Qwen.Color,
    "kimi-k2": Kimi.Color,
    "gpt-5": OpenAI,
  };
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-7xl p-8 bg-transparent rounded-lg shadow-lg">
        <div className="flex flex-col items-center justify-center mb-16 w-full">
          <Image
            src="/icons/air-logo-light.png"
            alt="AI Rankia Logo"
            width={120}
            height={120}
            className="mb-5"
            draggable={false}
          />
        </div>
        <div className="flex justify-between mb-16">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  onboardingStep >= step - 1
                    ? "bg-blue-500 text-white"
                    : "bg-gray-800 text-gray-300"
                }`}
              >
                {step}
              </div>
              <span className="text-sm text-gray-400">
                {step === 1
                  ? "Your Brand"
                  : step === 2
                  ? "Select Plan"
                  : "Get Started"}
              </span>
            </div>
          ))}
        </div>

        {onboardingStep === 1 && (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-200 mb-2">
              Choose Your Plan
            </h2>
            <p className="text-gray-400 mb-18">
              Select the plan that best fits your needs
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-8">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`border border-neutral-900 rounded-lg p-4 transition-all duration-400 aspect-[9/14] hover:translate-y-[-5px] items-start flex flex-col gap-3 cursor-pointer relative ${
                    selectedPlan === plan.product_id
                      ? "!border-2 !border-blue-500"
                      : ""
                  } ${
                    plan.recommended
                      ? "bg-gradient-to-b from-background to-blue-500/50"
                      : ""
                  }`}
                  onClick={() => setSelectedPlan(plan?.product_id || "")}
                >
                  <div
                    className={`space-y-2  p-4 rounded-lg w-full flex flex-col items-start ${
                      plan.recommended ? "bg-blue-600" : "bg-zinc-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="text-md font-bold">{plan.name}</h3>
                      {plan.recommended && (
                        <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-xl">
                          POPULAR
                        </div>
                      )}
                    </div>
                    <p className="text-3xl font-bold mb-4">{plan.price}</p>
                  </div>
                  <div className="space-y-2 text-left">
                    <p className="flex items-center">
                      <Check className="w-5 h-5 text-blue-500 mr-2" />
                      {plan.credits}
                    </p>
                    <p className="flex items-center">
                      <Check className="w-5 h-5 text-blue-500 mr-2" />
                      Prompt Monitoring {plan.frequency}
                    </p>
                    {plan.features.map((feature, index) => (
                      <p key={index} className="flex items-center">
                        <Check className="w-5 h-5 text-blue-500 mr-2" />
                        {feature}
                      </p>
                    ))}
                    <li className="flex items-start gap-3 mt-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mt-2">
                          {plan.models.map((model, index) => {
                            const IconComponent = modelIcons[model.key];
                            return (
                              <div
                                key={index}
                                className="flex items-center gap-1 bg-neutral-800/30 px-2 py-1 rounded-md"
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
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setOnboardingStep(0)}
                disabled={isAnalyzing}
              >
                Back
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleNextStep}
                disabled={!selectedPlan}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {onboardingStep === 0 && (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-200 mb-2">
              Create your first brand
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              This helps us personalize your experience and you can attach your
              brand to your keyword analysis (optional)
            </p>

            {isAnalyzing ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-full max-w-3xl">
                  <h1 className="text-2xl font-bold mb-6 text-center">
                    Creating Brand Analysis
                  </h1>
                  <p className="text-muted-foreground mb-8 text-center">
                    Analyzing...
                  </p>
                  <LoadingState />
                </div>
              </div>
            ) : (
              <div className="max-w-md mx-auto mb-8 flex items-center justify-center">
                <div className="sm:max-w-[500px] border-accent">
                  <div className="space-y-4 w-full">
                    <div className="grid gap-6">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={brandName}
                          placeholder="Acme Corporation"
                          onChange={(e) => setBrandName(e.target.value)}
                          className="bg-zinc-800"
                          required
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={brandWebsite}
                          onChange={(e) => setBrandWebsite(e.target.value)}
                          className="bg-zinc-800"
                          placeholder="https://example.com"
                          required
                        />
                      </div>

                      <div className="flex gap-2 w-full">
                        <div className="grid gap-2 w-full">
                          <Label htmlFor="industry">Industry</Label>
                          <Select
                            value={brandIndustry}
                            onValueChange={setBrandIndustry}
                          >
                            <SelectTrigger className="bg-zinc-800 w-full">
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                            <SelectContent>
                              {INDUSTRIES.map((industry) => (
                                <SelectItem key={industry} value={industry}>
                                  {industry}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2 md:w-[300px]">
                          <Label htmlFor="language" className="">
                            Language
                          </Label>
                          <Select
                            value={brandLanguage}
                            onValueChange={(value) => setBrandLanguage(value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="es">Spanish</SelectItem>
                              <SelectItem value="fr">French</SelectItem>
                              <SelectItem value="de">German</SelectItem>
                              <SelectItem value="it">Italian</SelectItem>
                              <SelectItem value="pt">Portuguese</SelectItem>
                              <SelectItem value="ru">Russian</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-2 w-full">
                        <Label htmlFor="country">Country</Label>
                        <Select
                          value={brandLocation}
                          onValueChange={setBrandLocation}
                        >
                          <SelectTrigger className="bg-zinc-800 w-full">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Global">Global</SelectItem>
                            {countries.map((country) => (
                              <SelectItem
                                key={country.label}
                                value={country.label}
                              >
                                {country.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="logo">Logo</Label>
                        <div className="flex items-center gap-4">
                          <input
                            ref={fileInputRef}
                            id="logo"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />

                          {!brandLogoPreview ? (
                            <div
                              onClick={openFileDialog}
                              onDragEnter={handleDragEnter}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleFileDrop}
                              className={`
                      h-32 w-full rounded-md border-2 border-dashed 
                      flex flex-col items-center justify-center p-4 
                      cursor-pointer transition-all duration-200
                      ${
                        isDragging
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-zinc-700 bg-zinc-800 hover:border-zinc-500"
                      }
                    `}
                            >
                              <div className="flex flex-col items-center text-center">
                                <CloudUpload className="w-5 h-5 text-zinc-400 mb-2" />
                                <div className="font-medium text-sm mb-1">
                                  Click to upload
                                </div>
                                <div className="text-xs text-zinc-400">
                                  or drag and drop your logo here
                                </div>
                                <div className="text-[10px] text-zinc-500 mt-3">
                                  PNG, JPG or SVG (max 5MB)
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full flex flex-col items-center">
                              <div className="w-28 h-28 p-3 rounded-md overflow-hidden bg-zinc-700 flex items-center justify-center mb-3">
                                <Image
                                  src={brandLogoPreview}
                                  alt="Preview"
                                  width={50}
                                  height={50}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={openFileDialog}
                                className="mt-2"
                              >
                                <CloudUpload className="w-4 h-4 mr-2" />
                                Change Logo
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleCreateBrand}
                    disabled={submitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 mt-6"
                  >
                    {submitting ? "Creating..." : "Create Brand"}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-8">
              <div className="space-x-4">
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={isAnalyzing}
                >
                  Skip
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleNextStep}
                  disabled={isAnalyzing}
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        )}

        {onboardingStep === 2 && (
          <div className="text-center items-center flex flex-col">
            <h2 className="text-3xl font-bold text-gray-300 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-gray-500 mb-8 max-w-2xl mx-auto">
              You&apos;ve chosen the{" "}
              <span className="font-bold">
                {plans.find((p) => p.product_id === selectedPlan)?.name}
              </span>{" "}
              plan. You can always upgrade or change your plan later in
              settings.
            </p>

            <div className="max-w-md mx-auto flex gap-4">
              <CheckoutButton
                priceId={selectedPlan || ""}
                userId={user?.id || ""}
                buttonText="Continue to payments"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
