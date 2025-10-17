# BeatBloom Local Development Setup with Neon

## Quick Setup (5 minutes)

Since you're running locally (not deployed on Vercel), we'll use **Neon** directly - it's free and works great for local development!

### Step 1: Create a Free Neon Database

1. Go to **https://neon.tech**
2. Sign up/login (free account)
3. Click "Create a project"
4. Name it: `beatbloom`
5. Select region closest to you
6. Click "Create Project"

### Step 2: Get Your Connection String

After creating the project:

1. You'll see a **connection string** on the dashboard
2. Look for "Connection string" section
3. Copy the string that looks like:
   ```
   postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Step 3: Update Your .env.local

Replace the contents of your `.env.local` file with:

```bash
# Neon Database Connection
POSTGRES_URL="postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Optional: API Keys (already hardcoded in the app for now)
# VITE_GEMINI_API_KEY="your-key"
# VITE_REPLICATE_API_TOKEN="your-token"
```

**Important**: Replace the `POSTGRES_URL` value with YOUR actual connection string from Neon!

### Step 4: Restart Your Dev Server

```bash
npm run dev
```

### Step 5: Test It!

1. Open http://localhost:5173
2. Record a song
3. Generate lyrics
4. Create the song
5. Check "My songs" - it should be saved! 🎉

## ✅ What Happens Automatically

When you restart the server, the app will:
- ✅ Connect to your Neon database
- ✅ Auto-create the `songs` table
- ✅ Be ready to save and load songs!

## 🆓 Neon Free Tier

- **Storage**: 512 MB (plenty for testing!)
- **Compute**: Always available
- **No pausing**: Database stays active
- **Perfect for**: Local development and testing

## 🐛 Troubleshooting

If you get connection errors:

1. Check the connection string is correct in `.env.local`
2. Make sure it starts with `postgresql://`
3. Restart the dev server
4. Check Neon dashboard to ensure database is active

## 🚀 Later: Deploy to Vercel

When you're ready to deploy:

1. Push your code to GitHub
2. Import project in Vercel
3. In Vercel, create a Postgres database
4. Vercel will auto-connect it
5. Your app will work in production!

---

**That's it! Much simpler for local development.** 🎵
