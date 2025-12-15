import { supabase } from '../lib/supabase';

const TOKEN_COST_PER_GENERATION = 30;

export interface TokenBalance {
  tokens: number;
  user_id: string;
}

/**
 * Get the current token balance for the authenticated user
 */
export const getTokenBalance = async (): Promise<number> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return 0; // Return 0 instead of throwing for unauthenticated users
    }

    const { data, error } = await supabase
      .from('user_tokens')
      .select('tokens')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // If no record exists, try to create one with default tokens
      if (error.code === 'PGRST116' || error.code === '42P01') {
        // PGRST116 = no rows returned, 42P01 = table doesn't exist
        try {
          const { data: newData, error: insertError } = await supabase
            .from('user_tokens')
            .insert({ user_id: user.id, tokens: 100 })
            .select('tokens')
            .single();

          if (insertError) {
            // Table might not exist yet - return default value
            console.warn('Token table may not exist yet. Run the migration:', insertError);
            return 100; // Return default for new users
          }
          return newData?.tokens || 100;
        } catch (insertErr) {
          // Table doesn't exist - return default
          console.warn('Token table not found. Please run the database migration.');
          return 100; // Default starting tokens
        }
      }
      // Other errors - return 0 to prevent blocking
      console.warn('Error fetching token balance:', error);
      return 100; // Return default instead of 0 to allow usage
    }

    return data?.tokens || 100;
  } catch (error) {
    // Any unexpected error - return default to prevent blocking
    console.warn('Error in getTokenBalance:', error);
    return 100; // Default starting tokens
  }
};

/**
 * Check if user has enough tokens for a generation
 */
export const hasEnoughTokens = async (): Promise<boolean> => {
  const balance = await getTokenBalance();
  return balance >= TOKEN_COST_PER_GENERATION;
};

/**
 * Deduct tokens after successful generation
 */
export const deductTokens = async (): Promise<{ success: boolean; newBalance: number; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, newBalance: 0, error: 'User not authenticated' };
    }

    // Get current balance
    const currentBalance = await getTokenBalance();
    
    if (currentBalance < TOKEN_COST_PER_GENERATION) {
      return { 
        success: false, 
        newBalance: currentBalance, 
        error: 'Insufficient tokens' 
      };
    }

    // Deduct tokens
    const newBalance = currentBalance - TOKEN_COST_PER_GENERATION;
    
    const { error } = await supabase
      .from('user_tokens')
      .update({ tokens: newBalance })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deducting tokens:', error);
      return { success: false, newBalance: currentBalance, error: error.message };
    }

    return { success: true, newBalance };
  } catch (error: any) {
    console.error('Error in deductTokens:', error);
    return { success: false, newBalance: 0, error: error.message };
  }
};

/**
 * Add tokens to user balance (for future use - purchasing tokens, rewards, etc.)
 */
export const addTokens = async (amount: number): Promise<{ success: boolean; newBalance: number; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, newBalance: 0, error: 'User not authenticated' };
    }

    const currentBalance = await getTokenBalance();
    const newBalance = currentBalance + amount;

    // Try to update first
    const { error: updateError } = await supabase
      .from('user_tokens')
      .update({ tokens: newBalance })
      .eq('user_id', user.id);

    if (updateError) {
      // If update fails (record doesn't exist), try to insert
      if (updateError.code === 'PGRST116' || updateError.code === '42P01') {
        const { data: insertData, error: insertError } = await supabase
          .from('user_tokens')
          .insert({ user_id: user.id, tokens: newBalance })
          .select('tokens')
          .single();

        if (insertError) {
          console.error('Error creating token record:', insertError);
          return { success: false, newBalance: currentBalance, error: insertError.message };
        }

        return { success: true, newBalance: insertData?.tokens || newBalance };
      }

      console.error('Error adding tokens:', updateError);
      return { success: false, newBalance: currentBalance, error: updateError.message };
    }

    return { success: true, newBalance };
  } catch (error: any) {
    console.error('Error in addTokens:', error);
    return { success: false, newBalance: 0, error: error.message };
  }
};

export { TOKEN_COST_PER_GENERATION };

