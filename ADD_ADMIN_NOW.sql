-- Add admin access for bxxmzilla@gmail.com
-- Run this in Supabase SQL Editor

-- Method 1: Using the helper function (if it exists)
SELECT add_admin_by_email('bxxmzilla@gmail.com');

-- Method 2: Direct insert (if function doesn't exist)
-- First, get the user ID
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find user ID by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'bxxmzilla@gmail.com'
  LIMIT 1;

  -- If user found, add to admin_users
  IF target_user_id IS NOT NULL THEN
    INSERT INTO admin_users (user_id)
    VALUES (target_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Admin access granted to user: %', target_user_id;
  ELSE
    RAISE NOTICE 'User not found with email: bxxmzilla@gmail.com';
  END IF;
END $$;

-- Verify the admin was added
SELECT 
  au.user_id,
  u.email,
  au.created_at as admin_since
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE u.email = 'bxxmzilla@gmail.com';

