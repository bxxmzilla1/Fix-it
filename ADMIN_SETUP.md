# Admin Panel Setup Guide

## Overview

The admin panel provides real-time analytics and user management for your FixIt AI app. It includes:
- User list with token balances
- Revenue analytics (daily, weekly, monthly)
- Real-time purchase history
- All data updates in real-time from Supabase

## Database Setup

### Step 1: Run Migrations

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor**
4. Run the migrations in order:
   - `supabase/migrations/001_create_user_tokens.sql` (if not already run)
   - `supabase/migrations/002_create_purchases.sql`

### Step 2: Make Yourself an Admin

After running the migrations, you need to add your user ID to the `admin_users` table:

1. Get your user ID:
   - Sign in to your app
   - Open browser DevTools → Console
   - Run: `(await supabase.auth.getUser()).data.user.id`
   - Copy the UUID

2. Add yourself as admin:
   - Go to Supabase Dashboard → SQL Editor
   - Run this query (replace `YOUR_USER_ID` with your actual UUID):

```sql
INSERT INTO admin_users (user_id)
VALUES ('YOUR_USER_ID')
ON CONFLICT (user_id) DO NOTHING;
```

3. Verify admin access:
   - Refresh your app
   - You should now see the "Admin" button in the header
   - Click it to access the admin panel

## Admin Panel Features

### User Management
- View all registered users
- See each user's token balance
- User IDs and email addresses

### Revenue Analytics
- **Daily Revenue**: Today's total revenue, purchases, and tokens sold
- **Weekly Revenue**: Last 7 days statistics
- **Monthly Revenue**: Last 30 days statistics

### Purchase History
- Real-time list of today's purchases
- Shows package name, price, tokens, and timestamp
- Updates automatically when new purchases occur

## Real-Time Updates

The admin panel uses Supabase real-time subscriptions to automatically update:
- Purchase history when new purchases are made
- Revenue statistics (refresh button available)
- User list (refresh button available)

## Security

- Only users in the `admin_users` table can access the admin panel
- Row Level Security (RLS) policies protect all data
- Admin check happens on both client and server side

## Adding More Admins

To add additional admins, run this SQL query:

```sql
INSERT INTO admin_users (user_id)
VALUES ('USER_ID_HERE')
ON CONFLICT (user_id) DO NOTHING;
```

## Troubleshooting

### "Access Denied" Message
- Verify your user ID is in the `admin_users` table
- Check that you're signed in with the correct account
- Refresh the page after adding yourself as admin

### No Data Showing
- Ensure the migrations have been run
- Check that purchases are being recorded (see `purchases` table)
- Verify RLS policies are correctly set up

### Real-Time Not Working
- Check Supabase project settings → Database → Replication
- Ensure real-time is enabled for the `purchases` table
- Check browser console for connection errors

## Database Functions

The admin panel uses these database functions:

1. **get_revenue(start_date, end_date)**: Calculates revenue statistics
2. **get_all_users()**: Returns all users with their token balances

These functions are created automatically when you run the migration.

## Next Steps

Consider adding:
- User search and filtering
- Export data to CSV
- More detailed analytics charts
- User activity logs
- Token balance management
- Purchase refund functionality

