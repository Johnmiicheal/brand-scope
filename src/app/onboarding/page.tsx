/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useRef, useState } from "react";

import { Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { UserSubscription } from "@/hooks/useAuth";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
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
import { plans } from "@/lib/utils";
import { INDUSTRIES } from "@/lib/utils";
import ShinyText from "@/components/ui/shiny-text";
import { KeywordAnalysisResults } from "@/components/keywords/keyword-analysis-results";
import SubsCard from "@/components/fancy-web/subs-card";


type FormData = {
  businessBrief: string;
  keyword: string;
  website: string;
  language: string;
  location: string;
};

type KeywordData = {
  conversational_keyword: string;
  intent: string;
  google_seed_keyword: string;
  category: string;
  search_volume: number;
  competition_index: number;
  low_cpc: string;
  trend_6m: string;
  relevance_score: number;
};

type KeywordAnalysisResultsProps = {
  keywords: Record<string, KeywordData>;
  metadata: Array<{ language: string; country: string }>;
};

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");  
  const domain = searchParams.get("domain");
  const step = searchParams.get("step");
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [password, setPassword] = useState("");
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [keywordResults, setKeywordResults] =
    useState<KeywordAnalysisResultsProps | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [manualKeyword, setManualKeyword] = useState("");
  const [manualLanguage, setManualLanguage] = useState("");
  const [manualLocation, setManualLocation] = useState("");
  const [isManualAnalyzing, setIsManualAnalyzing] = useState(false);


  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Timer for analysis duration
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined = undefined;

    if (isAnalyzing || isManualAnalyzing) {
      interval = setInterval(() => {
        setElapsedSeconds((prevSeconds) => prevSeconds + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isAnalyzing, isManualAnalyzing]);

  const formatTime = (totalSeconds: number): string => {
    if (totalSeconds < 0) return "0s";
    if (totalSeconds === 0) return "0s";

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts: string[] = [];

    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) {
      if (seconds > 0 || (hours === 0 && minutes === 0)) {
        parts.push(`${seconds}s`);
      }
    }
    return parts.join(" ");
  };


  const [formData, setFormData] = useState<FormData>({
    businessBrief: "",
    keyword: "",
    website: "",
    language: "",
    location: "",
  });



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
        setUser(null);
        setSubscription(null);
        setSubLoading(false);
      } else {
        setSessionKey(session.access_token || "");
        setUser(session.user);
        // If user is logged in and still on step 0 or 1, move to step 2 (brand creation)
        if (onboardingStep === 0 ) {
          setOnboardingStep(1);
        }
        setSubLoading(false);
      }
    };
    checkAuth();
  }, [onboardingStep]);


  // Handle user registration (step 1)
  const handleUserRegistration = async () => {
    if (!email || !password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      setSubmitting(true);

      // Sign up with email confirmation disabled
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: undefined, // Skip email confirmation
          data: {
            full_name: email,
            user_type: "brand",
          },
        },
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        // Create user record
        const { error: userError } = await supabase.from("users").insert({
          id: authData.user.id,
          email: email,
          full_name: email,
          plan_type: "free",
          created_at: new Date().toISOString(),
          user_type: "brand",
        });

        if (userError) {
          console.error("Error creating user record:", userError);
        }

        setUser(authData.user);
        setSessionKey(authData.session?.access_token || "");
        setOnboardingStep(1); // Move to brand creation
        toast.success("Account created! Now let's set up your brand.");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextStep = () => {
    setOnboardingStep((prev) => prev + 1);
  };

  const handleSkip = () => {
    if (onboardingStep === 0) {
      setSelectedPlan("free");
    } else if (onboardingStep === 4) {
      // Skip payment step - redirect directly to dashboard
      router.push('/dashboard');
      return;
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
      setFormData({
        businessBrief: `${brandName} is a ${brandIndustry} brand that operates in the ${brandLocation} market.`,
        keyword: "",
        website: brandWebsite,
        language: brandLanguage,
        location: brandLocation,
      });

      if (error) {
        console.error("Error creating brand:", error);
        setSubmitting(false);
        return;
      }

      // Trigger brand analysis
      await handleKeywordAnalysis({
        businessBrief: `${brandName} is a ${brandIndustry} brand that operates in the ${brandLocation} market.`,
        keyword: "",
        website: brandWebsite,
        language: brandLanguage,
        location: brandLocation,
      });

      setSubmitting(false);
      // Clear form
      setBrandName("");
      setBrandWebsite("");
      setBrandIndustry("");
      setBrandLogo(null);
      setBrandLogoPreview(null);
    } catch (error) {
      console.error("Error:", error);
      setSubmitting(false);
    }
  };

  const handleKeywordAnalysis = async (formData: FormData) => {
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/keywords-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessBrief: formData.businessBrief.trim(),
          keyword: formData.keyword.trim(),
          website: formData.website.trim(),
          language: formData.language,
          user: user,
          location: formData.location.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(
          data.error || `Request failed with status ${response.status}`
        );
        return;
      }

      if (data.success && data.data) {
        setKeywordResults(data.data);
        toast.success(`Keyword analysis completed!`);
        setOnboardingStep(3); // Move to keywords step
      } else {
        toast.error("Invalid response format from analysis service");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      toast.error(errorMessage);
      console.error("Keyword analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualKeywordAnalysis = async () => {
    if (!manualKeyword.trim()) {
      toast.error("Please enter a keyword to analyze");
      return;
    }

    setIsManualAnalyzing(true);

    try {
      const response = await fetch("/api/keywords-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessBrief: "",
          keyword: manualKeyword.trim(),
          website: "",
          language: manualLanguage,
          user: user,
          location: manualLocation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(
          data.error || `Request failed with status ${response.status}`
        );
        return;
      }

      if (data.success && data.data) {
        setKeywordResults(data.data);
        toast.success(`Keyword analysis completed!`);
        // Stay on step 2 to show the keyword results - user will manually proceed
      } else {
        toast.error("Invalid response format from analysis service");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      toast.error(errorMessage);
      console.error("Keyword analysis error:", err);
    } finally {
      setIsManualAnalyzing(false);
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
          {[1, 2, 3, 4].map((step) => (
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
                  ? "Account"
                  : step === 2
                  ? "Brand"
                  : step === 3
                  ? "Keywords"
                  : "Payment"}
              </span>
            </div>
          ))}
        </div>

        {onboardingStep === 0 && (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-200 mb-2">
              Create Your Account
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Complete your registration to get started with your free analysis
            </p>

            <div className="max-w-md mx-auto mb-8">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="email-display">Email</Label>
                  <Input
                    id="email-display"
                    type="email"
                    value={email || ""}
                    disabled
                    className="bg-zinc-700 text-gray-300"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="full-name">Company Website</Label>
                  <Input
                    id="full-name"
                    type="text"
                    value={domain || ""}
                    placeholder="Acme Corporation"
                    disabled
                    className="bg-zinc-800"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    placeholder="Min 6 characters"
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-zinc-800"
                    required
                  />
                </div>
              </div>

              <Button
                onClick={handleUserRegistration}
                disabled={submitting || !password}
                className="w-full bg-blue-600 hover:bg-blue-700 mt-6"
              >
                {submitting ? "Creating Account..." : "Create Account"}
              </Button>
            </div>
          </div>
        )}

        {onboardingStep === 1 && (
          <div className="text-center">
            {!isAnalyzing && (
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-200 mb-2">
                  Create your first brand
                </h2>
                <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                  This helps us personalize your experience and you can attach
                  your brand to your keyword analysis (optional)
                </p>
              </div>
            )}

            {isAnalyzing ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-full items-center justify-center flex flex-col max-w-3xl">
                  <Image
                    src="/icons/air-icon-light.svg"
                    alt="Loading"
                    width={70}
                    height={70}
                    className="mb-6 animate-[spin_4s_linear_infinite]"
                  />
                  <h1 className="text-2xl font-bold mb-6 text-center">
                    Analysing your brand
                  </h1>
                  <p className="!text-[#b5b5b5a4] mb-3 max-w-lg mx-auto">
                    We are creating a collection of keywords that are relevant
                    to your brand to get you started.
                  </p>
                  <ShinyText
                    text="This will only take a few seconds..."
                    disabled={false}
                    speed={3}
                    className="font-medium text-sm"
                  />
                  <div className="text-xs text-gray-500 my-3 flex items-center bg-zinc-800/50 rounded-full p-2">
                    <Clock className="w-4 h-4 mr-2" />
                    {formatTime(elapsedSeconds)}
                  </div>
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
                        <p className="text-xs text-gray-500">
                          Pre-filled from your email domain
                        </p>
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

            <div className="flex justify-between mt-8">
              <Button
                variant="ghost"
                onClick={() => setOnboardingStep(1)}
                disabled={isAnalyzing}
              >
                ← Back
              </Button>
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={isAnalyzing}
              >
                Skip
              </Button>
            </div>
          </div>
        )}

        {onboardingStep === 2 && (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-200 mb-2">
              Select Keywords to Monitor
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Choose which keywords you&apos;d like to monitor from your
              analysis results
            </p>

            {keywordResults ? (
              <div className="max-w-4xl mx-auto">
                <div className="mb-8 items-center justify-center flex flex-col">
                  <h3 className="text-xl font-semibold mb-4">
                    Analysis Results
                  </h3>

                  <KeywordAnalysisResults
                    keywords={keywordResults.keywords}
                    metadata={keywordResults.metadata}
                    limit={10}
                  />
                </div>

                <div className="flex gap-4 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setOnboardingStep(2)}
                  >
                    ← Back
                  </Button>
                  <Button
                    onClick={() => setOnboardingStep(4)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-400 mb-6">
                  Since you skipped brand creation, you can manually enter a keyword to analyze
                </p>
                
                {!isManualAnalyzing ? (
                  <div className="max-w-md mx-auto mb-8">
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="manual-keyword">Enter a keyword to analyze</Label>
                        <Input
                          id="manual-keyword"
                          type="text"
                          value={manualKeyword}
                          onChange={(e) => setManualKeyword(e.target.value)}
                          placeholder="e.g., digital marketing, AI tools, fitness apps"
                          className="bg-zinc-800"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleManualKeywordAnalysis();
                            }
                          }}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="manual-language">Language</Label>
                        <Select
                          value={manualLanguage}
                          onValueChange={(value) => setManualLanguage(value)}
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
                      <div className="grid gap-2">
                        <Label htmlFor="manual-location">Location</Label>
                        <Input
                          id="manual-location"
                          type="text"
                          value={manualLocation}
                          onChange={(e) => setManualLocation(e.target.value)}
                          placeholder="e.g., United States, Mexico"
                          className="bg-zinc-800"
                        />
                      </div>
                    </div>
                    
                    
                    <Button
                      onClick={handleManualKeywordAnalysis}
                      disabled={!manualKeyword.trim()}
                      className="w-full bg-blue-600 hover:bg-blue-700 mt-6"
                    >
                      Analyze Keyword
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center min-h-[300px]">
                    <div className="w-full items-center justify-center flex flex-col max-w-3xl">
                      <Image
                        src="/icons/air-icon-light.svg"
                        alt="Loading"
                        width={70}
                        height={70}
                        className="mb-6 animate-[spin_4s_linear_infinite]"
                      />
                      <h1 className="text-2xl font-bold mb-6 text-center">
                        Analyzing &quot;{manualKeyword}&quot;
                      </h1>
                      <p className="!text-[#b5b5b5a4] mb-3 max-w-lg mx-auto">
                        We are finding relevant keywords and analyzing their potential for your use case.
                      </p>
                      <ShinyText
                        text="This will only take a few seconds..."
                        disabled={false}
                        speed={3}
                        className="font-medium text-sm"
                      />
                      <div className="text-xs text-gray-500 my-3 flex items-center bg-zinc-800/50 rounded-full p-2">
                        <Clock className="w-4 h-4 mr-2" />
                        {formatTime(elapsedSeconds)}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-center gap-5 mt-6">
                  <Button
                    onClick={() => setOnboardingStep(1)}
                    variant="outline"
                    disabled={isManualAnalyzing}
                  >
                    Go Back
                  </Button>
                  <Button
                    onClick={() => setOnboardingStep(3)}
                    variant="outline"
                    className="rounded-full"
                    disabled={isManualAnalyzing}
                  >
                    Skip to Plan Selection
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {onboardingStep === 3 && (
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
                onClick={() => setOnboardingStep(2)}
                disabled={isAnalyzing}
              >
                Back
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setOnboardingStep(4)}
                disabled={!selectedPlan}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {onboardingStep === 4 && (
          <div className="text-center items-center flex flex-col">
            <h2 className="text-3xl font-bold text-gray-300 mb-4">
              Setup Monitoring & Payment
            </h2>
            <p className="text-gray-500 mb-4 max-w-2xl mx-auto">
              Complete your setup and view your monitored keywords by activating your subscription.
            </p>
            
           

            <div className="mb-8">
              <SubsCard
                title={
                  plans.find((p) => p.product_id === selectedPlan)?.name || ""
                }
                description={
                  plans.find((p) => p.product_id === selectedPlan)
                    ?.description || ""
                }
                price={
                  plans.find((p) => p.product_id === selectedPlan)?.price || ""
                }
              />
              <p className="text-gray-500 my-6">
                You&apos;ve chosen the{" "}
                <span className="font-bold">
                  {plans.find((p) => p.product_id === selectedPlan)?.name}
                </span>{" "}
                plan. You can always upgrade or change your plan later in
                settings.
              </p>
            </div>
            <div className="bg-zinc-800/30 border border-zinc-800 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">What you get with a subscription:</h4>
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-400 text-start">
                <div className="space-y-1">
                  <div>• Ongoing keyword monitoring and alerts</div>
                  <div>• Advanced brand analysis and insights</div>
                  <div>• Competitor tracking and analysis</div>
                </div>
                <div className="space-y-1">
                  <div>• Access to premium AI models</div>
                  <div>• Priority support and updates</div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                <strong>Skip payment?</strong> You can explore the dashboard with limited access and upgrade anytime from settings.
              </p>
            </div>

            <div className="max-w-md mx-auto flex gap-4">
              <Button variant="outline" className="rounded-full" onClick={() => setOnboardingStep(3)}>Change Plan</Button>
              <CheckoutButton
                priceId={selectedPlan || ""}
                userId={user?.id || ""}
                buttonText="Complete Payment & Access Dashboard"
              />
            </div>
            
            <div className="mt-6">
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="text-gray-400 hover:text-gray-200"
              >
                Skip for now - View dashboard with limited access
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
