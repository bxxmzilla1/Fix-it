-- Add admin access for bxxmzilla@gmail.com
-- This will find the user by email and add them to admin_users table

-- First, let's create a helper function to add admin by email
CREATE OR REPLACE FUNCTION add_admin_by_email(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find user ID by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email
  LIMIT 1;

  -- If user found, add to admin_users
  IF target_user_id IS NOT NULL THEN
    INSERT INTO admin_users (user_id)
    VALUES (target_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add the admin user
SELECT add_admin_by_email('bxxmzilla@gmail.com');

-- Verify the admin was added
SELECT 
  au.user_id,
  u.email,
  au.created_at as admin_since
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE u.email = 'bxxmzilla@gmail.com';

