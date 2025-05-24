import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from '@vercel/analytics/next';
import { ThemeProvider } from "@/components/theme-provider";
import NextTopLoader from "nextjs-toploader";


const inter = Inter({
  variable: "--font-inter-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Rankia - AI-Powered Brand Insights & SEO Analytics",
  description: "Optimize your brand's visibility in AI search results. Get insights from LLMs like DeepSeek, Llama, and xAI, and improve your ranking with data-driven recommendations.",
  openGraph: {
    title: "AI Rankia - AI-Powered Brand Insights & SEO Analytics",
    description: "Optimize your brand's visibility in AI search results.",
    url: "https://airankia.com",
    images: ["/bs-seo.png"],
    siteName: "AI Rankia",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Rankia - AI-Powered Brand Insights & SEO Analytics",
    description: "Optimize your brand's visibility in AI search results.",
    images: "/bs-seo.png",
  },
  icons: {
    icon: "/icons/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Optimize your brand's visibility in AI search results. Get insights from LLMs like DeepSeek, Llama, and xAI, and improve your ranking with data-driven recommendations." />
        <meta name="keywords" content="AI, Brand Insights, SEO, Analytics, AI Rankia, Brand" />
        <meta name="author" content="Johnmicheal Elijah" />
        <link rel="icon" href="/icons/favicon.png" />
        <link rel="apple-touch-icon" href="/icons/favicon.png" />
        <meta property="og:title" content="AI Rankia - AI-Powered Brand Insights & SEO Analytics" />
        <meta property="og:description" content="Optimize your brand's visibility in AI search results." />
        <meta property="og:url" content="https://airankia.com" />
        <meta property="og:image" content="/bs-seo.png" />
        <meta property="og:site_name" content="AI Rankia" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AI Rankia - AI-Powered Brand Insights & SEO Analytics" />
        <meta name="twitter:description" content="Optimize your brand's visibility in AI search results." />
        <meta name="twitter:image" content="/bs-seo.png" />
      </head>
      <body
        className={`${inter.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark">
        <NextTopLoader color="#7EBDF1" showSpinner={false} height={3} />
          <AuthProvider>
              {children}
              <Analytics />
              <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
