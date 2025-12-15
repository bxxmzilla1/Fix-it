-- Simple SQL to add admin access for bxxmzilla@gmail.com
-- Run this in Supabase SQL Editor (SQL Editor, not Table Editor)

-- Step 1: Make sure admin_users table exists (should already exist if migration was run)
-- If you get an error, run migration 002_create_purchases.sql first

-- Step 2: Add the user as admin
INSERT INTO admin_users (user_id)
SELECT id
FROM auth.users
WHERE email = 'bxxmzilla@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Verify it worked
SELECT 
  au.user_id,
  u.email,
  au.created_at as admin_since
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE u.email = 'bxxmzilla@gmail.com';

-- If the SELECT returns a row, the admin was added successfully!
-- Refresh your app and you should see the Admin button

