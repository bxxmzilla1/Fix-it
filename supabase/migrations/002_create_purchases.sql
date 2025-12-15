-- Create purchases table to track token pack purchases
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_name TEXT NOT NULL,
  tokens_amount INTEGER NOT NULL,
  bonus_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own purchases
CREATE POLICY "Users can view their own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: System can insert purchases (for admin tracking)
-- Note: In production, this should be done server-side with service role key
CREATE POLICY "Users can insert their own purchases"
  ON purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all purchases
-- You'll need to create an admin_users table or add an is_admin flag to user_tokens
-- For now, we'll use a simple approach with a config table
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view admin_users table
CREATE POLICY "Admins can view admin users"
  ON admin_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- Policy: Only admins can insert admin users (you'll need to do this manually with service role)
-- For now, we'll allow users to check if they're admin
CREATE POLICY "Users can check if they are admin"
  ON admin_users FOR SELECT
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(DATE(created_at));

-- Function to get revenue for a date range
CREATE OR REPLACE FUNCTION get_revenue(start_date TIMESTAMP WITH TIME ZONE, end_date TIMESTAMP WITH TIME ZONE)
RETURNS TABLE (
  total_revenue DECIMAL(10, 2),
  total_purchases BIGINT,
  total_tokens_sold BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(price), 0)::DECIMAL(10, 2) as total_revenue,
    COUNT(*)::BIGINT as total_purchases,
    COALESCE(SUM(total_tokens), 0)::BIGINT as total_tokens_sold
  FROM purchases
  WHERE created_at >= start_date 
    AND created_at < end_date
    AND payment_status = 'completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all users (for admin)
-- Note: This is a simplified version. In production, you might want to use a view or materialized view
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  tokens INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT,
    u.created_at,
    COALESCE(ut.tokens, 0)::INTEGER as tokens
  FROM auth.users u
  LEFT JOIN user_tokens ut ON u.id = ut.user_id
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

