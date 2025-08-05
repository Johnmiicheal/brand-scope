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
 * Add pay-as-you-go credits to a user's account
 */
export async function addPaygCredits(
  userId: string,
  credits: number
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`💰 Adding ${credits} pay-as-you-go credits for user ${userId}`);
    
    // Get current subscription
    const { data: currentSubscription, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('id, payg_credits')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // No subscription record exists, create one
        const { error: insertError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            status: 'active',
            payg_credits: credits,
            query_count: 0,
          });

        if (insertError) {
          console.error(`❌ Error creating subscription record:`, insertError);
          return { success: false, error: insertError.message };
        }
        
        console.log(`✅ Created subscription record with ${credits} pay-as-you-go credits`);
        return { success: true };
      } else {
        console.error(`❌ Error fetching subscription:`, fetchError);
        return { success: false, error: fetchError.message };
      }
    }

    // Update existing record
    const currentPaygCredits = currentSubscription.payg_credits || 0;
    const newPaygCredits = currentPaygCredits + credits;

    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({ payg_credits: newPaygCredits })
      .eq('user_id', userId);

    if (updateError) {
      console.error(`❌ Error updating pay-as-you-go credits:`, updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`✅ Added ${credits} pay-as-you-go credits. Total: ${newPaygCredits}`);
    return { success: true };
    
  } catch (error) {
    console.error(`💥 Exception adding pay-as-you-go credits:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get available credits (subscription + pay-as-you-go)
 */
export async function getAvailableCredits(userId: string): Promise<{
  subscriptionCredits: number;
  paygCredits: number;
  totalAvailable: number;
  subscriptionUsed: number;
  subscriptionMax: number;
}> {
  try {
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('query_count, payg_credits, price_id')
      .eq('user_id', userId)
      .single();

    if (error) {
      return {
        subscriptionCredits: 0,
        paygCredits: 0,
        totalAvailable: 0,
        subscriptionUsed: 0,
        subscriptionMax: 0,
      };
    }

    // Get subscription plan details
    const { getConstraints } = await import('./constraints');
    const userConstraints = getConstraints('pro'); // Default to pro, update with actual plan logic
    
    const subscriptionUsed = subscription.query_count || 0;
    const subscriptionMax = userConstraints.max_credits;
    const subscriptionRemaining = Math.max(0, subscriptionMax - subscriptionUsed);
    const paygCredits = subscription.payg_credits || 0;

    return {
      subscriptionCredits: subscriptionRemaining,
      paygCredits,
      totalAvailable: subscriptionRemaining + paygCredits,
      subscriptionUsed,
      subscriptionMax,
    };
  } catch (error) {
    console.error('Error getting available credits:', error);
    return {
      subscriptionCredits: 0,
      paygCredits: 0,
      totalAvailable: 0,
      subscriptionUsed: 0,
      subscriptionMax: 0,
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