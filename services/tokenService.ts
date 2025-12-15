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
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_tokens')
      .select('tokens')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // If no record exists, create one with default tokens
      if (error.code === 'PGRST116') {
        const { data: newData, error: insertError } = await supabase
          .from('user_tokens')
          .insert({ user_id: user.id, tokens: 100 })
          .select('tokens')
          .single();

        if (insertError) {
          console.error('Error creating token record:', insertError);
          return 0;
        }
        return newData?.tokens || 0;
      }
      console.error('Error fetching token balance:', error);
      return 0;
    }

    return data?.tokens || 0;
  } catch (error) {
    console.error('Error in getTokenBalance:', error);
    return 0;
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

    const { error } = await supabase
      .from('user_tokens')
      .update({ tokens: newBalance })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error adding tokens:', error);
      return { success: false, newBalance: currentBalance, error: error.message };
    }

    return { success: true, newBalance };
  } catch (error: any) {
    console.error('Error in addTokens:', error);
    return { success: false, newBalance: 0, error: error.message };
  }
};

export { TOKEN_COST_PER_GENERATION };

