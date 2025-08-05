import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
);

/**
 * Updates credit usage, consuming pay-as-you-go credits first, then subscription credits
 * @param userId - The user's ID
 * @param credits - Number of credits to add
 * @param type - Type of usage: 'query' for search queries, 'monitoring' for scheduled monitoring
 */
export async function updateCreditUsage(
  userId: string,
  credits: number,
  type: 'query' | 'monitoring'
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`💳 Updating credit usage (with PAYG): user=${userId}, credits=${credits}, type=${type}`);
    
    // Get current subscription and pay-as-you-go credits
    const { data: currentSubscription, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('id, query_count, payg_credits, price_id')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // No subscription record exists, create one
        console.log(`📝 Creating new subscription record for user ${userId}`);
        const { error: insertError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            status: 'active',
            query_count: credits,
            payg_credits: 0,
          });

        if (insertError) {
          console.error(`❌ Error creating subscription record:`, insertError);
          return { success: false, error: insertError.message };
        }
        
        console.log(`✅ Created subscription record with ${credits} ${type} credits for user ${userId}`);
        return { success: true };
      } else {
        console.error(`❌ Error fetching subscription:`, fetchError);
        return { success: false, error: fetchError.message };
      }
    }

    const currentUsage = currentSubscription.query_count || 0;
    const currentPaygCredits = currentSubscription.payg_credits || 0;
    
    // Calculate how many credits to deduct from pay-as-you-go vs subscription
    const paygCreditsToUse = Math.min(credits, currentPaygCredits);
    const subscriptionCreditsToUse = credits - paygCreditsToUse;
    
    const newPaygCredits = currentPaygCredits - paygCreditsToUse;
    const newUsage = currentUsage + subscriptionCreditsToUse;

    console.log(`💰 Credit breakdown:`, {
      requested: credits,
      paygCreditsAvailable: currentPaygCredits,
      paygCreditsToUse,
      subscriptionCreditsToUse,
      newPaygCredits,
      newUsage
    });

    // Update both fields
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({ 
        query_count: newUsage,
        payg_credits: newPaygCredits
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error(`❌ Error updating credits:`, updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`✅ Updated credits successfully. PAYG: ${newPaygCredits}, Usage: ${newUsage}`);
    return { success: true };
    
  } catch (error) {
    console.error(`💥 Exception updating credits:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if user has enough credits (subscription + pay-as-you-go)
 */
export async function checkAvailableCredits(
  userId: string,
  creditsRequired: number
): Promise<{ 
  hasEnoughCredits: boolean; 
  availableCredits: number;
  subscriptionCredits: number;
  paygCredits: number;
  error?: string;
}> {
  try {
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('query_count, payg_credits, price_id')
      .eq('user_id', userId)
      .single();

    if (error) {
      return {
        hasEnoughCredits: false,
        availableCredits: 0,
        subscriptionCredits: 0,
        paygCredits: 0,
        error: error.message,
      };
    }

    // Get subscription plan constraints
    const { getConstraints } = await import('./constraints');
    const userConstraints = getConstraints('pro'); // Update with actual plan detection
    
    const currentUsage = subscription.query_count || 0;
    const subscriptionCreditsRemaining = Math.max(0, userConstraints.max_credits - currentUsage);
    const paygCredits = subscription.payg_credits || 0;
    const totalAvailable = subscriptionCreditsRemaining + paygCredits;

    return {
      hasEnoughCredits: totalAvailable >= creditsRequired,
      availableCredits: totalAvailable,
      subscriptionCredits: subscriptionCreditsRemaining,
      paygCredits,
    };
    
  } catch (error) {
    console.error('Error checking available credits:', error);
    return {
      hasEnoughCredits: false,
      availableCredits: 0,
      subscriptionCredits: 0,
      paygCredits: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Gets current credit usage for a user
 * @param userId - The user's ID
 * @returns Object with total query_count and payg_credits
 */
export async function getCreditUsage(userId: string): Promise<{
  success: boolean;
  data?: { query_count: number; payg_credits: number; monitoring_count: number };
  error?: string;
}> {
  try {
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('query_count, payg_credits, monitoring_count')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No subscription record exists, return zero usage
        return {
          success: true,
          data: { query_count: 0, payg_credits: 0, monitoring_count: 0 }
        };
      }
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        query_count: subscription.query_count || 0,
        payg_credits: subscription.payg_credits || 0,
        monitoring_count: subscription.monitoring_count || 0, // Keep for backward compatibility
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}