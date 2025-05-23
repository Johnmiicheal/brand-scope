import { CheckoutButton } from '@/components/stripe/checkout-button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Check } from 'lucide-react';

interface PricingFeature {
  text: string;
}

interface PricingCardProps {
  name: string;
  description: string;
  price: string;
  priceId: string;
  userId: string;
  features: PricingFeature[];
  popular?: boolean;
}

export function PricingCard({
  name,
  description,
  price,
  priceId,
  userId,
  features,
  popular = false,
}: PricingCardProps) {
  return (
    <Card className={`w-full ${popular ? 'border-primary shadow-lg' : ''}`}>
      <CardHeader>
        {popular && (
          <div className="px-3 py-1 text-xs font-semibold text-white bg-primary rounded-full w-fit mb-2">
            Popular
          </div>
        )}
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="mt-2">
          <span className="text-3xl font-bold">{price}</span>
          {price !== 'Free' && <span className="text-sm ml-1">/month</span>}
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center">
              <Check className="h-4 w-4 mr-2 text-primary" />
              <span className="text-sm">{feature.text}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <CheckoutButton 
          priceId={priceId}
          userId={userId}
          buttonText={price === 'Free' ? 'Get Started' : 'Subscribe'}
          variant={popular ? 'default' : 'outline'}
        />
      </CardFooter>
    </Card>
  );
} 