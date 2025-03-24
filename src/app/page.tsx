import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bot, Fingerprint, BarChart3, LineChart, Twitter, GitCompare } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="container mx-auto py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Fingerprint className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">Brand Scope</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="text-sm font-medium hover:underline">Log in</Link>
          <Link href="/signup">
            <Button variant="outline" size="sm">Sign up</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto pt-16 pb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Optimize your brand for <span className="text-primary">AI search results</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Brand Scope helps you monitor and improve your brand's visibility in AI search results across DeepSeek, Llama, xAI and more.
            </p>
            <div className="flex gap-4 mt-4">
              <Link href="/signup">
                <Button size="lg">Get Started</Button>
              </Link>
              <Button variant="outline" size="lg">Learn More</Button>
            </div>
          </div>
          <div className="relative h-[400px] bg-muted rounded-xl overflow-hidden border border-border flex items-center justify-center">
            <Bot className="h-32 w-32 text-primary/20" />
          </div>
        </div>

        <div className="mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Powerful AI-Driven Brand Analytics</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card border border-border p-6 rounded-xl">
              <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">AI Ranking Analysis</h3>
              <p className="text-muted-foreground">Track how your brand performs in AI search results and get actionable insights.</p>
            </div>
            
            <div className="bg-card border border-border p-6 rounded-xl">
              <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                <LineChart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Keyword Opportunities</h3>
              <p className="text-muted-foreground">Discover high-impact keywords that can boost your brand's visibility in AI results.</p>
            </div>
            
            <div className="bg-card border border-border p-6 rounded-xl">
              <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                <Twitter className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Social Media Analysis</h3>
              <p className="text-muted-foreground">Monitor brand mentions on X (Twitter) and analyze sentiment across conversations.</p>
            </div>
            
            <div className="bg-card border border-border p-6 rounded-xl">
              <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                <GitCompare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Competitor Benchmarking</h3>
              <p className="text-muted-foreground">See how your brand stacks up against competitors in AI search results.</p>
            </div>
            
            <div className="bg-card border border-border p-6 rounded-xl">
              <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">AI-Powered Recommendations</h3>
              <p className="text-muted-foreground">Get tailored suggestions to improve your brand's AI visibility and impact.</p>
            </div>
            
            <div className="bg-card border border-border p-6 rounded-xl flex items-center justify-center">
              <Link href="/signup">
                <Button variant="outline" className="gap-2">
                  <span>Try it Now</span>
                  <span className="text-xs opacity-70">Free tier available</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-border py-8">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-primary" />
            <span className="font-medium">Brand Scope</span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            © 2023 Brand Scope. All rights reserved.
          </div>
          
          <div className="flex gap-6 text-sm">
            <Link href="#" className="hover:text-primary">Privacy</Link>
            <Link href="#" className="hover:text-primary">Terms</Link>
            <Link href="#" className="hover:text-primary">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
