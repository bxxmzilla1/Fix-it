<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# FixIt AI - Construction Repair Visualizer

A Progressive Web App (PWA) that uses AI to visualize construction repairs and room cleanups. Upload a photo, describe what needs to be fixed, and see the AI-generated result.

View your app in AI Studio: https://ai.studio/apps/drive/13PZlodUxkvDtcRzuy7ntMz8oTrqygdse

## Features

- 📱 **Progressive Web App** - Installable on mobile and desktop
- 🎨 **AI-Powered Visualizations** - Generate before/after images
- 📸 **Easy Photo Upload** - Camera or file upload support
- 🔄 **Offline Support** - Works offline with service workers
- ⚡ **Fast & Responsive** - Optimized for all devices
- 🔒 **Secure** - API keys are kept server-side, never exposed to clients
- 👤 **User Authentication** - Sign up and sign in with Supabase

## Run Locally

**Prerequisites:** Node.js (v18 or higher)

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd fixit-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   VITE_SUPABASE_URL=https://oczaidmczhvdoqlktmfp.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```
   
   **Note:** The Supabase credentials are already configured in the code, but you can override them with environment variables if needed.

4. Run the development server:

   **Option A: Using Vercel CLI (Recommended for API routes)**
   ```bash
   # Install Vercel CLI if you haven't
   npm i -g vercel
   
   # Run Vercel dev server (handles API routes)
   vercel dev
   ```

   **Option B: Using Vite only (API routes won't work locally)**
   ```bash
   npm run dev
   ```
   Note: For local API testing, use Option A or deploy to Vercel.

5. Open your browser and navigate to `http://localhost:3000` (or the port shown)

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and sign in
3. Click "New Project" and import your GitHub repository
4. Add your environment variable:
   - Name: `GEMINI_API_KEY`
   - Value: Your Gemini API key
5. Click "Deploy"

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Add environment variables in Vercel dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add `GEMINI_API_KEY` with your API key

### Option 3: Deploy via GitHub Actions (Optional)

The project is configured with `vercel.json` for automatic deployments when you push to GitHub.

## PWA Features

This app is configured as a Progressive Web App with:

- **Service Worker** - Enables offline functionality and caching
- **Web App Manifest** - Allows installation on devices
- **Responsive Design** - Works on mobile, tablet, and desktop
- **App Icons** - Custom icons for home screen installation

### Installing the PWA

**On Mobile (iOS/Android):**
1. Open the app in your browser
2. Look for "Add to Home Screen" or "Install App" prompt
3. Follow the on-screen instructions

**On Desktop (Chrome/Edge):**
1. Open the app in your browser
2. Click the install icon in the address bar
3. Or go to Settings → Apps → Install this site as an app

## Project Structure

```
fixit-ai/
├── api/                 # Serverless API routes (secure backend)
│   └── generate-fix.ts  # Gemini API endpoint (keeps API key secure)
├── public/              # Static assets and PWA icons
├── components/          # React components
├── services/            # Client-side API services
├── App.tsx              # Main app component
├── index.html           # HTML entry point
├── vite.config.ts       # Vite configuration
├── vercel.json          # Vercel deployment config
└── package.json         # Dependencies
```

## Security

**Important:** Your Gemini API key is now **secure** and **never exposed** to users:
- ✅ API key is stored server-side only (in Vercel environment variables)
- ✅ All Gemini API calls go through `/api/generate-fix` serverless function
- ✅ Client-side code never sees or contains the API key
- ✅ API key is excluded from the client bundle

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Your Google Gemini API key (server-side only) | Yes |
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

**Note:** For Vercel deployment, add these as environment variables in your project settings.

## Technologies Used

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Vite PWA Plugin** - PWA functionality
- **Tailwind CSS** - Styling
- **Google Gemini AI** - Image generation
- **Lucide React** - Icons

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
