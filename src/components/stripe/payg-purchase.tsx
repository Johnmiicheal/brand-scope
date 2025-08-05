"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Zap, ShoppingCart, Loader2 } from "lucide-react";
import { getPaygPackages, getCustomCreditPricing, calculateCustomCreditPrice } from "@/lib/constraints";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface PaygPurchaseProps {
  className?: string;
  onPurchaseComplete?: () => void;
}

export function PaygPurchase({ className }: PaygPurchaseProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [customCredits, setCustomCredits] = useState<number | string>("");
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const packages = getPaygPackages();
  const customPricing = getCustomCreditPricing();

  const handlePackagePurchase = async (packageId: string) => {
    if (!user) {
      toast.error("Please log in to purchase credits");
      return;
    }

    setLoading(true);
    setSelectedPackage(packageId);

    try {
      const response = await fetch("/api/stripe/payg-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageId,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start checkout");
    } finally {
      setLoading(false);
      setSelectedPackage(null);
    }
  };

  const handleCustomPurchase = async () => {
    if (!user) {
      toast.error("Please log in to purchase credits");
      return;
    }

    const credits = parseInt(customCredits.toString());
    
    if (isNaN(credits) || credits < customPricing.min_credits || credits > customPricing.max_credits) {
      toast.error(`Please enter a number between ${customPricing.min_credits} and ${customPricing.max_credits}`);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/stripe/payg-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customCredits: credits,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

  const customPrice = typeof customCredits === 'number' && customCredits > 0 
    ? calculateCustomCreditPrice(customCredits) / 100 
    : 0;

  return (
    <div className={className}>
      <div className="grid gap-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold">Buy Additional Credits</h2>
          </div>
          <p className="text-muted-foreground">
            Top up your account with pay-as-you-go credits when you need them most
          </p>
        </div>

        {/* Package Options */}
        <div className="grid md:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <Card 
              key={pkg.id} 
              className={`relative cursor-pointer transition-all hover:shadow-lg ${
                pkg.badge ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
              }`}
              onClick={() => !loading && handlePackagePurchase(pkg.id)}
            >
              {pkg.badge && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-3 py-1">
                    {pkg.badge}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                <CardDescription>{pkg.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="text-center space-y-4">
                <div>
                  <div className="text-3xl font-bold">{pkg.credits}</div>
                  <div className="text-sm text-muted-foreground">credits</div>
                </div>
                
                <div className="text-2xl font-bold text-green-600">
                  ${(pkg.price / 100).toFixed(2)}
                </div>
                
                <div className="text-xs text-muted-foreground">
                  ${((pkg.price / 100) / pkg.credits).toFixed(3)} per credit
                </div>
                
                <Button 
                  className="w-full" 
                  disabled={loading}
                  variant={pkg.badge ? "default" : "outline"}
                >
                  {loading && selectedPackage === pkg.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Buy Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Custom Credit Option */}
        {customPricing.enabled && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Custom Credit Amount
              </CardTitle>
              <CardDescription>
                Choose your exact credit amount (${customPricing.price_per_credit} per credit)
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder={`Enter credits (${customPricing.min_credits}-${customPricing.max_credits})`}
                    value={customCredits}
                    onChange={(e) => setCustomCredits(e.target.value)}
                    min={customPricing.min_credits}
                    max={customPricing.max_credits}
                    disabled={loading}
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Min: {customPricing.min_credits} • Max: {customPricing.max_credits}
                  </div>
                </div>
                
                <div className="sm:w-32 text-center">
                  <div className="text-lg font-bold text-green-600">
                    {customPrice > 0 ? `$${customPrice.toFixed(2)}` : '$0.00'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Price
                  </div>
                </div>
                
                <Button 
                  onClick={handleCustomPurchase}
                  disabled={loading || !customCredits || customPrice <= 0}
                  className="sm:w-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Buy {customCredits} Credits
                    </>
                  )}
                </Button>
              </div>
              
              {typeof customCredits === 'number' && customCredits > 0 && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  <strong>{customCredits} credits</strong> at{' '}
                  <strong>${customPricing.price_per_credit}</strong> per credit = {' '}
                  <strong className="text-green-600">${customPrice.toFixed(2)}</strong>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Pay-as-you-go Credits
                </p>
                <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Credits are used before your subscription credits</li>
                  <li>• Credits never expire</li>
                  <li>• Instant top-up when you need it</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}