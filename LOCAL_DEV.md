# BeatBloom - Local Development Guide

## 🚀 Running the App Locally

The app uses **Vercel Serverless Functions** for API routes, which require the Vercel CLI for local development.

### Quick Start

```bash
# Option 1: Use the built-in script
npm run dev:vercel

# Option 2: Run Vercel dev directly
vercel dev
```

The app will be available at **http://localhost:3000**

## ⚙️ How It Works

- **Frontend**: Built with React + Vite
- **API Routes**: Serverless functions in `/api` folder
- **Database**: Vercel Postgres
- **Dev Server**: Vercel CLI handles both frontend and API routes

## 🔧 Why Not `npm run dev`?

The regular `npm run dev` command only runs Vite, which serves the frontend but **cannot handle API routes**.

When you use `npm run dev`, you'll see these errors:
- ❌ `Failed to load resource: 404 (Not Found)` for `/api/init-db`
- ❌ `Failed to load resource: 404 (Not Found)` for `/api/songs`
- ❌ `SyntaxError: Unexpected token 'i', "import { s"...` (TypeScript files served as responses)

### Solution

Always use `npm run dev:vercel` or `vercel dev` for local development.

## 📝 Environment Variables

Make sure you have `.env.local` with your database credentials:

```bash
# Pull from Vercel (recommended)
vercel env pull .env.local

# Or copy from .env.development.local if you have it
```

## 🐛 Troubleshooting

### TypeScript Errors

You may see TypeScript errors in the terminal about `moduleResolution`. These can be safely ignored - the app will still work. The errors occur because:
- Frontend uses `moduleResolution: "bundler"` (for Vite)
- API routes use `moduleResolution: "node"` (for Vercel)

The app has separate `tsconfig.json` files to handle this:
- `/tsconfig.json` - Frontend configuration
- `/api/tsconfig.json` - API routes configuration

### Port Already in Use

If port 3000 is busy:

```bash
# Kill processes on port 3000
lsof -ti :3000 | xargs kill -9

# Or use a different port
vercel dev --listen 3001
```

### Database Connection Issues

```bash
# Pull latest environment variables
vercel env pull .env.local

# Check your Vercel Postgres connection
vercel postgres ls
```

## 🚀 Deployment

The app is configured for Vercel deployment:

```bash
# Deploy to production
vercel --prod

# Or push to GitHub (auto-deploys)
git push origin main
```

## 📚 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend**: Vercel Serverless Functions
- **Database**: Vercel Postgres
- **AI**: Google Gemini, Replicate
- **Hosting**: Vercel

## 💡 Tips

1. **Always use `vercel dev`** for local development
2. **Don't commit `.env.local`** - it contains secrets
3. **TypeScript errors can be ignored** - they don't affect functionality
4. **Test API routes** with curl or Postman:
   ```bash
   curl -X POST http://localhost:3000/api/init-db
   curl http://localhost:3000/api/songs
   ```

## 🎵 Happy Coding!

Need help? Check the [Vercel CLI docs](https://vercel.com/docs/cli) or [raise an issue](https://github.com/varunv-ux/BeatBloom/issues).
