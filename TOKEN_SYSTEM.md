# Token System Setup

## Overview

The app now uses a tokenized system where each image generation costs **30 tokens**. Users start with **100 tokens** when they sign up.

## Database Setup

You need to run the SQL migration in your Supabase project to create the `user_tokens` table.

### Step 1: Access Supabase SQL Editor

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Migration

Copy and paste the contents of `supabase/migrations/001_create_user_tokens.sql` into the SQL editor and click **Run**.

This will:
- Create the `user_tokens` table
- Set up Row Level Security (RLS) policies
- Create a trigger to automatically give new users 100 tokens
- Set up automatic timestamp updates

### Step 3: Verify the Setup

1. Go to **Table Editor** → `user_tokens`
2. You should see the table with columns: `id`, `user_id`, `tokens`, `created_at`, `updated_at`
3. Test by creating a new user account - they should automatically get 100 tokens

## How It Works

### Token Flow

1. **User Signs Up**: Automatically receives 100 tokens
2. **User Generates Image**: 
   - System checks if user has ≥ 30 tokens
   - If yes: Deducts 30 tokens and generates image
   - If no: Returns error message
3. **Token Balance**: Displayed in header and before generation

### Token Costs

- **Image Generation**: 30 tokens per generation
- **Starting Balance**: 100 tokens (3 free generations)

## API Changes

### API Route: `/api/generate-fix`

**New Requirements:**
- Requires `userId` and `accessToken` in request body
- Checks token balance before generation
- Deducts tokens before processing
- Returns token information in response

**Request Body:**
```json
{
  "imageData": "base64...",
  "mimeType": "image/jpeg",
  "prompt": "Fix the wall",
  "userId": "user-uuid",
  "accessToken": "jwt-token"
}
```

**Response (Success):**
```json
{
  "image": "data:image/png;base64,...",
  "tokensUsed": 30,
  "remainingTokens": 70
}
```

**Response (Insufficient Tokens):**
```json
{
  "error": "Insufficient tokens",
  "balance": 20,
  "cost": 30,
  "message": "You need 30 tokens to generate an image. You have 20 tokens."
}
```

## Environment Variables

For the API route to work with Supabase, you need to add:

**Vercel Environment Variables:**
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (found in Project Settings → API)

**Note:** The service role key bypasses RLS and should only be used server-side. Never expose it in client code.

## Client-Side Features

### Token Display
- Token balance shown in header with coin icon
- Token cost displayed before generation
- Warning message if insufficient tokens
- Button disabled if not enough tokens

### Token Management
- Balance automatically refreshes after generation
- Real-time updates when tokens are deducted
- Error messages show exact token requirements

## Future Enhancements

Consider adding:
- **Token Purchase System**: Allow users to buy more tokens
- **Token Rewards**: Give tokens for referrals, daily login, etc.
- **Token History**: Track token usage and purchases
- **Admin Panel**: Manage token balances for users
- **Subscription Plans**: Unlimited tokens for premium users

## Troubleshooting

### Users Not Getting Starting Tokens

1. Check if the trigger function exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
2. Verify the function exists:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
   ```
3. Manually create token record:
   ```sql
   INSERT INTO user_tokens (user_id, tokens) 
   VALUES ('user-uuid', 100);
   ```

### Token Deduction Not Working

1. Check RLS policies are enabled:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'user_tokens';
   ```
2. Verify service role key is set in Vercel
3. Check API logs for errors

### Token Balance Not Updating

1. Check if `refreshTokenBalance()` is called after generation
2. Verify Supabase connection is working
3. Check browser console for errors

## Testing

1. **Create a test user** and verify they get 100 tokens
2. **Generate an image** and verify tokens decrease by 30
3. **Try with insufficient tokens** and verify error message
4. **Check token balance** updates correctly in UI

