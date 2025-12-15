import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://oczaidmczhvdoqlktmfp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const TOKEN_COST = 30;

// Use service role key for server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, action } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (action === 'check') {
      // Check if user has enough tokens
      const { data, error } = await supabase
        .from('user_tokens')
        .select('tokens')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no record exists, create one
        if (error.code === 'PGRST116') {
          const { data: newData, error: insertError } = await supabase
            .from('user_tokens')
            .insert({ user_id: userId, tokens: 100 })
            .select('tokens')
            .single();

          if (insertError) {
            return res.status(500).json({ error: 'Failed to create token record' });
          }

          return res.status(200).json({
            hasEnough: (newData?.tokens || 0) >= TOKEN_COST,
            balance: newData?.tokens || 0,
            cost: TOKEN_COST
          });
        }
        return res.status(500).json({ error: 'Failed to check tokens' });
      }

      return res.status(200).json({
        hasEnough: (data?.tokens || 0) >= TOKEN_COST,
        balance: data?.tokens || 0,
        cost: TOKEN_COST
      });
    }

    if (action === 'deduct') {
      // Deduct tokens
      const { data: currentData, error: fetchError } = await supabase
        .from('user_tokens')
        .select('tokens')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        return res.status(500).json({ error: 'Failed to fetch token balance' });
      }

      const currentBalance = currentData?.tokens || 0;
      
      if (currentBalance < TOKEN_COST) {
        return res.status(400).json({ 
          error: 'Insufficient tokens',
          balance: currentBalance,
          cost: TOKEN_COST
        });
      }

      const newBalance = currentBalance - TOKEN_COST;

      const { data, error } = await supabase
        .from('user_tokens')
        .update({ tokens: newBalance })
        .eq('user_id', userId)
        .select('tokens')
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to deduct tokens' });
      }

      return res.status(200).json({
        success: true,
        balance: data?.tokens || 0,
        deducted: TOKEN_COST
      });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (error: any) {
    console.error('Error in token check:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

