"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PaygPurchase } from "@/components/stripe/payg-purchase";
import { CreditUsageProgress } from "@/components/dashboard/credit-usage-progress";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getConstraints } from "@/lib/constraints";


export default function CreditsPage() {
  const { subscription, product } = useAuth();

  const constraints = product ? getConstraints(product.name) : null;
  const usedCredits = subscription?.query_count || 0;
  const maxCredits = constraints?.max_credits || 0;
  const paygCredits = subscription?.payg_credits || 0;
  const subscriptionCreditsRemaining = Math.max(0, maxCredits - usedCredits);
  const totalAvailableCredits = subscriptionCreditsRemaining + paygCredits;

  return (
    <div className="mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Credit Management</h1>
          <p className="text-muted-foreground">
            Manage your subscription and pay-as-you-go credits
          </p>
        </div>
      </div>

      <div className=" gap-6">
        {/* Left Column - Current Usage */}
        <div className="lg:col-span-1 space-y-6">
          {/* Current Usage Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Current Usage
              </CardTitle>
              <CardDescription>
                Your credit usage this billing period
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CreditUsageProgress className="border rounded-lg p-4" />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Subscription</div>
                  <div className="text-muted-foreground">
                    {subscriptionCreditsRemaining.toLocaleString()} remaining
                  </div>
                </div>
                
                {paygCredits > 0 && (
                  <div>
                    <div className="font-medium flex items-center gap-1">
                      Pay-as-you-go
                      <Badge variant="secondary" className="text-xs">
                        Premium
                      </Badge>
                    </div>
                    <div className="text-blue-600 font-medium">
                      {paygCredits.toLocaleString()} available
                    </div>
                  </div>
                )}
              </div>

              {product && (
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Plan:</span>
                    <Badge variant="outline">{product.name}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Monthly Limit:</span>
                    <span className="font-medium">{maxCredits.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Purchase Options */}
        <div className="lg:col-span-2 mt-10">
          <PaygPurchase />
        </div>
      </div>

      {/* Low Credits Warning */}
      {totalAvailableCredits < 100 && (
        <Card className="mt-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-orange-500" />
              <div>
                <div className="font-medium text-orange-900 dark:text-orange-100">
                  Running Low on Credits
                </div>
                <div className="text-sm text-orange-700 dark:text-orange-300">
                  You have {totalAvailableCredits} credits remaining. Consider purchasing additional 
                  credits to avoid interruption to your queries.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}