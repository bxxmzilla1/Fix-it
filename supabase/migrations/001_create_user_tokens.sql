-- Create user_tokens table to track token balance for each user
CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tokens INTEGER NOT NULL DEFAULT 100, -- Starting tokens for new users
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own tokens
CREATE POLICY "Users can view their own tokens"
  ON user_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own tokens (for deducting)
CREATE POLICY "Users can update their own tokens"
  ON user_tokens FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: System can insert tokens for new users
CREATE POLICY "Users can insert their own tokens"
  ON user_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to automatically create token record when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_tokens (user_id, tokens)
  VALUES (NEW.id, 100); -- Give new users 100 starting tokens
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create token record on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER update_user_tokens_updated_at
  BEFORE UPDATE ON user_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

