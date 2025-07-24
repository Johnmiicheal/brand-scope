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
 * Updates credit usage for a user
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
    console.log(`💳 Updating credit usage: user=${userId}, credits=${credits}, type=${type}`);
    
    // All credit usage goes into query_count as per user requirements
    const columnToUpdate = 'query_count';
    
    // Get current usage
    const { data: currentSubscription, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select(`id, ${columnToUpdate}`)
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
            [columnToUpdate]: credits,
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

    // Update existing record
    const currentUsage = currentSubscription[columnToUpdate] || 0;
    const newUsage = currentUsage + credits;

    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        [columnToUpdate]: newUsage,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error(`❌ Error updating credit usage:`, updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`✅ Updated ${type} credits: ${currentUsage} → ${newUsage} for user ${userId}`);
    return { success: true };

  } catch (error) {
    console.error(`❌ Unexpected error updating credit usage:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Gets current credit usage for a user
 * @param userId - The user's ID
 * @returns Object with total query_count (includes both search and monitoring credits)
 */
export async function getCreditUsage(userId: string): Promise<{
  success: boolean;
  data?: { query_count: number; monitoring_count: number };
  error?: string;
}> {
  try {
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('query_count, monitoring_count')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No subscription record exists, return zero usage
        return {
          success: true,
          data: { query_count: 0, monitoring_count: 0 }
        };
      }
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        query_count: subscription.query_count || 0,
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