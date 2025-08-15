import Image from "next/image";
import { motion } from "framer-motion";
import { Input } from "../ui/input";
import { ChevronRight, CircleUserRound, Sparkles, Menu } from "lucide-react";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Hero({ isAuthenticated }: { isAuthenticated: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const navLinks = [
    {
      label: "Features",
      href: "/#features",
    },
    {
      label: "Platform",
      href: "/#platform",
    },
    {
      label: "Pricing",
      href: "/#pricing",
    },
    {
      label: "FAQ",
      href: "/#faq",
    },
    {
      label: "Request",
      href: "/request",
    },
  ];
  return (
    <div className="flex flex-col items-center justify-center bg-[url('/assets/air-bg-hero.webp')] bg-cover bg-center bg-no-repeat overflow-hidden h-[100vh]">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center fixed top-0 z-50 w-full">
        <div className="flex items-center gap-2">
          <Image
            src="/icons/air-landing.svg"
            alt="AI Rankia Logo"
            width={120}
            height={120}
            className="w-20 h-20 md:w-[120px] md:h-[120px]"
          />
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-12">
            {navLinks.map((link) => (
              <Link href={link.href} key={link.label}>
                <span className="text-sm font-medium hover:text-blue-400 transition-colors">{link.label}</span>
              </Link>
            ))}
          </div>
          <div className="flex gap-4 items-center">
            {isAuthenticated ? (
              <Link href="/dashboard" className="text-sm font-medium">
                <Button variant="outline" size="sm">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login" className="text-sm font-medium">
                  <Button className="bg-white text-black rounded-lg" size="sm">
                    <CircleUserRound className="w-4 h-4" />
                    Sign in
                  </Button>
                </Link>
                <Link href="/onboarding">
                  <Button
                    className="bg-blue-600 text-black rounded-lg"
                    size="sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    Get Analysis
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-2">
          {!isAuthenticated && (
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-white">
                <CircleUserRound className="w-4 h-4" />
              </Button>
            </Link>
          )}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="text-white">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-black/95 border-gray-800">
              <div className="flex flex-col gap-6 mt-8 p-4">
                {navLinks.map((link) => (
                  <Link 
                    href={link.href} 
                    key={link.label}
                    onClick={() => setIsSheetOpen(false)}
                    className="text-white text-lg font-medium hover:text-blue-400 transition-colors py-2"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-4 mt-6">
                  {isAuthenticated ? (
                    <Link href="/dashboard" onClick={() => setIsSheetOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setIsSheetOpen(false)}>
                        <Button className="bg-white text-black rounded-lg w-full">
                          <CircleUserRound className="w-4 h-4" />
                          Sign in
                        </Button>
                      </Link>
                      <Link href="/onboarding" onClick={() => setIsSheetOpen(false)}>
                        <Button className="bg-blue-600 text-white rounded-lg w-full">
                          <Sparkles className="w-4 h-4" />
                          Get Analysis
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <div className="container mx-auto flex flex-col items-center justify-center gap-5 mt-[120px] md:mt-[200px] px-4">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-[4.5rem] font-bold bricolage text-center leading-tight"
        >
          Your brand. Every AI. Every Search
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

        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-2 mt-8 sm:border border-accent sm:bg-white/10 rounded-full sm:p-2">
          <Input
            placeholder="Enter your company email"
            className="w-96 h-12 md:h-14 rounded-full border-none bg-transparent text-center md:text-left"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button 
            className="bg-blue-600 text-black rounded-full h-12 md:h-14 w-full md:w-auto px-6" 
            onClick={() => router.push("/onboarding?email=" + email)}
          >
            <span className="hidden md:inline">Get a free analysis</span>
            <span className="md:hidden">Get Analysis</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Image
          src="/assets/hero-image.png"
          alt="Hero Image"
          width={1920}
          height={1080}
          className="w-full h-auto object-contain translate-y-[80px] md:translate-y-[160px] border border-[#1a1a1a] max-w-6xl"
        />
      </div>
    </div>
  );
}
