-- Quick SQL to add admin access for bxxmzilla@gmail.com
-- Run this in Supabase SQL Editor

-- Method 1: Direct insert (if you know the user ID)
-- Replace 'USER_ID_HERE' with the actual UUID from auth.users
-- INSERT INTO admin_users (user_id)
-- VALUES ('USER_ID_HERE')
-- ON CONFLICT (user_id) DO NOTHING;

-- Method 2: Using a subquery to find user by email
INSERT INTO admin_users (user_id)
SELECT id
FROM auth.users
WHERE email = 'bxxmzilla@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Verify the admin was added
SELECT 
  au.user_id,
  u.email,
  au.created_at as admin_since
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE u.email = 'bxxmzilla@gmail.com';

