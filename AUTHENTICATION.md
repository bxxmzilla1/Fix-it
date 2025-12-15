# Authentication Setup

## Overview

Your FixIt AI app now includes user authentication powered by Supabase. Users must sign up or sign in before they can use the app.

## Features

- ✅ **Sign Up** - New users can create accounts
- ✅ **Sign In** - Existing users can sign in with email/password
- ✅ **Sign Out** - Users can sign out from the app
- ✅ **Protected Routes** - App content is only accessible to authenticated users
- ✅ **Session Management** - Automatic session handling and persistence
- ✅ **Email Verification** - New users receive verification emails (if enabled in Supabase)

## How It Works

1. **Unauthenticated Users:**
   - See a welcome screen with sign in/sign up form
   - Cannot access the main app features
   - Must create an account or sign in

2. **Authenticated Users:**
   - See the full app interface
   - Can upload images and generate fixes
   - See their email in the header
   - Can sign out at any time

## Supabase Configuration

Your Supabase project is already configured:
- **Project URL:** `https://oczaidmczhvdoqlktmfp.supabase.co`
- **Anon Key:** Configured (stored securely)

## Environment Variables

The Supabase credentials are hardcoded in `lib/supabase.ts` as fallbacks, but you can override them with environment variables:

```env
VITE_SUPABASE_URL=https://oczaidmczhvdoqlktmfp.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Supabase Dashboard Setup

To manage users and authentication settings:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Users** to see registered users
4. Configure authentication settings:
   - **Email Auth:** Already enabled by default
   - **Email Templates:** Customize verification emails
   - **Auth Providers:** Add social logins (Google, GitHub, etc.) if desired

## User Management

### Viewing Users
- Go to Supabase Dashboard → Authentication → Users
- See all registered users, their emails, and account status

### Email Verification
- By default, Supabase sends verification emails
- Users can sign in even without verifying (configurable)
- To require email verification:
  1. Go to Authentication → Settings
  2. Enable "Confirm email" requirement

## Security Features

- ✅ Passwords are hashed and stored securely
- ✅ Sessions are managed by Supabase
- ✅ JWT tokens for authentication
- ✅ Automatic token refresh
- ✅ Secure cookie handling

## Customization

### Change Auth Flow
Edit `components/AuthForm.tsx` to customize:
- Form fields
- Validation rules
- Error messages
- Success messages

### Add Social Login
1. In Supabase Dashboard → Authentication → Providers
2. Enable providers (Google, GitHub, etc.)
3. Add OAuth credentials
4. Update `AuthForm.tsx` to include social login buttons

### Customize User Profile
- Add user profile fields in Supabase
- Create a profile table
- Update `AuthContext.tsx` to fetch user profile data

## Troubleshooting

### Users Can't Sign Up
- Check Supabase Dashboard → Authentication → Settings
- Verify email auth is enabled
- Check email confirmation settings

### Users Can't Sign In
- Verify email/password are correct
- Check Supabase Dashboard for error logs
- Ensure user account exists

### Session Not Persisting
- Check browser console for errors
- Verify Supabase URL and keys are correct
- Check network tab for failed requests

## Next Steps

Consider adding:
- User profiles with saved images
- Usage tracking per user
- Rate limiting per user
- Social login options
- Password reset functionality
- User preferences/settings

