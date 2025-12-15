import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  email: string;
  created_at: string;
  tokens?: number;
}

export interface Purchase {
  id: string;
  user_id: string;
  package_name: string;
  tokens_amount: number;
  bonus_tokens: number;
  total_tokens: number;
  price: number;
  currency: string;
  payment_status: string;
  created_at: string;
  user_email?: string;
}

export interface RevenueStats {
  total_revenue: number;
  total_purchases: number;
  total_tokens_sold: number;
}

/**
 * Check if current user is an admin
 */
export const isAdmin = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    return !error && !!data;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Get all registered users
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    // Try to get users from the database function
    const { data, error } = await supabase.rpc('get_all_users');

    if (error) {
      console.warn('get_all_users function not available, using fallback:', error);
      // Fallback: Get users from user_tokens table
      const { data: tokenData, error: tokenError } = await supabase
        .from('user_tokens')
        .select('user_id, tokens, created_at');

      if (tokenError) {
        console.error('Error fetching users:', tokenError);
        return [];
      }

      // Return users with their token data
      // Note: Email will be shown as "User" since we can't access auth.users directly
      return (tokenData || []).map(t => ({
        id: t.user_id,
        email: `User ${t.user_id.substring(0, 8)}`, // Fallback display
        created_at: t.created_at || new Date().toISOString(),
        tokens: t.tokens || 0,
      }));
    }

    return (data || []).map(u => ({
      id: u.id,
      email: u.email || `User ${u.id.substring(0, 8)}`,
      created_at: u.created_at || new Date().toISOString(),
      tokens: u.tokens || 0,
    }));
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return [];
  }
};

/**
 * Get revenue statistics for a date range
 */
export const getRevenue = async (
  startDate: Date,
  endDate: Date
): Promise<RevenueStats> => {
  try {
    const { data, error } = await supabase.rpc('get_revenue', {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    });

    if (error) {
      console.error('Error fetching revenue:', error);
      // Fallback: Calculate manually
      const { data: purchases } = await supabase
        .from('purchases')
        .select('price, total_tokens')
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
        .eq('payment_status', 'completed');

      const totalRevenue = (purchases || []).reduce((sum, p) => sum + Number(p.price), 0);
      const totalTokens = (purchases || []).reduce((sum, p) => sum + p.total_tokens, 0);

      return {
        total_revenue: totalRevenue,
        total_purchases: purchases?.length || 0,
        total_tokens_sold: totalTokens,
      };
    }

    return {
      total_revenue: Number(data?.[0]?.total_revenue || 0),
      total_purchases: Number(data?.[0]?.total_purchases || 0),
      total_tokens_sold: Number(data?.[0]?.total_tokens_sold || 0),
    };
  } catch (error) {
    console.error('Error in getRevenue:', error);
    return {
      total_revenue: 0,
      total_purchases: 0,
      total_tokens_sold: 0,
    };
  }
};

/**
 * Get purchase history with real-time updates
 */
export const getPurchaseHistory = async (date?: Date): Promise<Purchase[]> => {
  try {
    const query = supabase
      .from('purchases')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching purchase history:', error);
      return [];
    }

    return (data || []).map(p => ({
      id: p.id,
      user_id: p.user_id,
      package_name: p.package_name,
      tokens_amount: p.tokens_amount,
      bonus_tokens: p.bonus_tokens || 0,
      total_tokens: p.total_tokens,
      price: Number(p.price),
      currency: p.currency || 'USD',
      payment_status: p.payment_status,
      created_at: p.created_at,
    }));
  } catch (error) {
    console.error('Error in getPurchaseHistory:', error);
    return [];
  }
};

/**
 * Subscribe to real-time purchase updates
 */
export const subscribeToPurchases = (
  callback: (purchase: Purchase) => void,
  date?: Date
) => {
  const channel = supabase
    .channel('purchases-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'purchases',
      },
      (payload) => {
        const purchase = payload.new as any;
        const purchaseDate = new Date(purchase.created_at);
        const filterDate = date || new Date();

        // Only call callback if it's for today or no date filter
        if (!date || purchaseDate.toDateString() === filterDate.toDateString()) {
          callback({
            id: purchase.id,
            user_id: purchase.user_id,
            package_name: purchase.package_name,
            tokens_amount: purchase.tokens_amount,
            bonus_tokens: purchase.bonus_tokens || 0,
            total_tokens: purchase.total_tokens,
            price: Number(purchase.price),
            currency: purchase.currency || 'USD',
            payment_status: purchase.payment_status,
            created_at: purchase.created_at,
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Record a purchase transaction
 */
export const recordPurchase = async (
  packageName: string,
  tokensAmount: number,
  bonusTokens: number,
  totalTokens: number,
  price: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase.from('purchases').insert({
      user_id: user.id,
      package_name: packageName,
      tokens_amount: tokensAmount,
      bonus_tokens: bonusTokens,
      total_tokens: totalTokens,
      price: price,
      currency: 'USD',
      payment_status: 'completed',
    });

    if (error) {
      console.error('Error recording purchase:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in recordPurchase:', error);
    return { success: false, error: error.message };
  }
};

