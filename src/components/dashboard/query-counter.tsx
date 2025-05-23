import { getConstraints } from "@/lib/constraints";
import Stripe from "stripe"


interface UserSubscription {
    id: string;
    user_id: string;
    subscription_plan_id: string;
    stripe_subscription_id: string;
    status: string;
    query_count: number;
    created_at: string;
    updated_at: string;
  }
  
interface QueryCounterProps {
    product: Stripe.Product | null;
    subscription: UserSubscription | null;
}

export const QueryCounter = ({ product, subscription }: QueryCounterProps) => {
    if (!product || !subscription) {
        return null;
    }

    const productName = product.name;
    const constraints = getConstraints(productName);
    const userCount = subscription.query_count

    return(
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between w-full">
                <div className="flex gap-1 items-center">
                    {[...Array(5)].map((_, index) => {
                        const percentage = (userCount / constraints.max_scheduled_queries) * 100;
                        const barFillPercentage = (percentage / 100) * 5;
                        const isActive = index < barFillPercentage;
                        
                        return (
                            <div
                                key={index}
                                className={`h-4 w-1 rounded-full transition-colors duration-200 ${
                                    isActive ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                            />
                        );
                    })}
                    <p className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                        {userCount} of {constraints.max_scheduled_queries} prompts used
                    </p>
                </div>
            </div>
        </div>
    )

}