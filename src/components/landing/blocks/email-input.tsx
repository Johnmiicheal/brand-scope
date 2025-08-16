/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { ChevronRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

// Personal email domains to block
const PERSONAL_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "aol.com",
  "protonmail.com",
  "yandex.com",
  "mail.com",
  "zoho.com",
  "tutanota.com",
  "fastmail.com",
  "live.com",
  "msn.com",
];

export default function EmailInput() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [validatedEmail, setValidatedEmail] = useState("");
  const [emailDomain, setEmailDomain] = useState("");
  const [brandWebsite, setBrandWebsite] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const isPersonalEmail = (email: string): boolean => {
    const domain = email.split("@")[1]?.toLowerCase();
    return PERSONAL_EMAIL_DOMAINS.includes(domain);
  };

  const extractDomain = (email: string): string => {
    const domain = email.split("@")[1];
    return domain ? `https://${domain}` : "";
  };

  const validateWorkEmail = (
    email: string
  ): { isValid: boolean; message?: string } => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return { isValid: false, message: "Please enter a valid email address" };
    }

    if (isPersonalEmail(email)) {
      return {
        isValid: false,
        message: "Please use your work email address (not gmail, yahoo, etc.)",
      };
    }

    return { isValid: true };
  };

  // Handle work email validation (step 0)
  const handleEmailValidation = () => {
    setIsValidating(true);
    const validation = validateWorkEmail(email);
    if (!validation.isValid) {
      toast.error(validation.message);
      setIsValidating(false);
      return;
    }

    // Extract domain and set up for next step
    const domain = extractDomain(email);
    setEmailDomain(domain);
    setValidatedEmail(email);
    setBrandWebsite(domain); // Pre-fill website with domain

    toast.success("Work email validated! Now let's create your account.");
    router.push(`/onboarding?email=${email}&domain=${domain}`);
    setIsValidating(false);
  };
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-2 mt-8 sm:border border-accent sm:bg-white/10 rounded-full sm:p-2">
        <Input
          placeholder="Enter your company email"
          type="email"
          className="w-96 h-12 md:h-14 rounded-full border-none bg-transparent text-center md:text-left"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button
          className="bg-blue-600 text-black rounded-full h-12 md:h-14 w-full md:w-auto px-6"
          onClick={handleEmailValidation}
          disabled={isValidating}
        >
          <span className="hidden md:inline">Get a free analysis</span>
          <span className="md:hidden">Get Analysis</span>
          {isValidating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </Button>
      </div>
      {isPersonalEmail(email) && (
        <p className="text-sm text-neutral-500/80 mt-3">
          Please use your work email address (not gmail, yahoo, etc.) or{" "}
          <Link href="/signup" className="text-blue-500 hover:text-blue-600">
            sign up
          </Link>
        </p>
      )}
    </div>
  );
}
