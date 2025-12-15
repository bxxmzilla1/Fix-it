# Deployment Guide

## Quick Start

### 1. Generate PWA Icons

Before deploying, you need to generate the PWA icon files:

1. Open `public/generate-icons.html` in your browser
2. Click the download buttons to save:
   - `pwa-192x192.png`
   - `pwa-512x512.png`
3. Place both files in the `public/` directory

Alternatively, you can create your own icons:
- 192x192px PNG for standard icons
- 512x512px PNG for high-resolution icons
- Both should be square and represent your app

### 2. Set Up Environment Variables

Create a `.env.local` file (already in .gitignore):

```env
GEMINI_API_KEY=your_api_key_here
VITE_SUPABASE_URL=https://oczaidmczhvdoqlktmfp.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Note:** Supabase credentials are already configured in the code, but you can override them with environment variables.

### 3. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: PWA setup"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 4. Deploy to Vercel

#### Option A: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Add Environment Variables:
   - **Name**: `GEMINI_API_KEY` | **Value**: Your Gemini API key
   - **Name**: `VITE_SUPABASE_URL` | **Value**: `https://oczaidmczhvdoqlktmfp.supabase.co`
   - **Name**: `VITE_SUPABASE_ANON_KEY` | **Value**: Your Supabase anon key
6. Click "Deploy"

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts and add your environment variables
```

### 5. Verify PWA Features

After deployment:

1. Visit your deployed site
2. Open browser DevTools (F12)
3. Go to "Application" tab → "Service Workers"
4. Verify the service worker is registered
5. Check "Manifest" to see PWA configuration
6. Test "Add to Home Screen" on mobile devices

## Testing Locally

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Troubleshooting

### Icons not showing
- Ensure `pwa-192x192.png` and `pwa-512x512.png` exist in `public/`
- Clear browser cache and rebuild

### Service Worker not registering
- Check browser console for errors
- Ensure you're using HTTPS (required for PWA)
- Clear browser cache and reload

### Environment variables not working
- Verify `.env.local` exists (not committed to git)
- In Vercel: Check project settings → Environment Variables
- Rebuild after adding environment variables

## PWA Checklist

- ✅ Service Worker configured
- ✅ Web App Manifest created
- ✅ Icons generated (192x192, 512x512)
- ✅ Meta tags added to HTML
- ✅ HTTPS enabled (Vercel provides this)
- ✅ Responsive design
- ✅ Offline support via service worker

## Next Steps

- Customize app icons in `public/icon.svg`
- Update manifest colors in `vite.config.ts`
- Add more offline caching strategies if needed
- Test on various devices and browsers


