# BeatBloom + Vercel Postgres Setup Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Vercel Account & Database

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "Storage" in the top menu
3. Click "Create Database"
4. Select **Postgres**
5. Name it: `beatbloom-db`
6. Select region closest to you
7. Click "Create"

### Step 2: Get Database Credentials

After creating the database:

1. Go to the `.env.local` tab in Vercel dashboard
2. **Copy all the environment variables** shown
3. Create a `.env.local` file in your project root
4. Paste all the variables

Your `.env.local` should look like:

```bash
POSTGRES_URL="postgres://default:xxxxx@xxxxx-pooler.us-east-1.postgres.vercel-storage.com/verceldb"
POSTGRES_PRISMA_URL="postgres://default:xxxxx@xxxxx-pooler.us-east-1.postgres.vercel-storage.com/verceldb?pgbouncer=true&connect_timeout=15"
POSTGRES_URL_NO_SSL="postgres://default:xxxxx@xxxxx-pooler.us-east-1.postgres.vercel-storage.com/verceldb"
POSTGRES_URL_NON_POOLING="postgres://default:xxxxx@xxxxx.us-east-1.postgres.vercel-storage.com/verceldb"
POSTGRES_USER="default"
POSTGRES_HOST="xxxxx-pooler.us-east-1.postgres.vercel-storage.com"
POSTGRES_PASSWORD="xxxxx"
POSTGRES_DATABASE="verceldb"
```

### Step 3: Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 4: Test the App

1. Open http://localhost:5173
2. Record a song
3. Generate lyrics
4. Create the song
5. Check "My songs" - it should be saved!

## ✅ What Changed?

- ✅ Switched from Supabase to Vercel Postgres
- ✅ Database auto-initializes on first run
- ✅ Songs stored as data URLs (works for files up to ~10MB)
- ✅ Free tier: 256MB storage, 60 compute hours/month
- ✅ No paused databases - always available!

## 📊 Vercel Postgres Free Tier Limits

- **Storage**: 256 MB
- **Compute**: 60 hours/month  
- **Rows**: ~10,000 songs (depending on audio size)
- **Always-on**: Database never pauses!

## 🎯 Database Schema

The app automatically creates this table:

```sql
CREATE TABLE songs (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  lyrics TEXT NOT NULL,
  music_description JSONB NOT NULL,
  album_art_url TEXT NOT NULL,
  audio_data_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)
```

## 🔧 Troubleshooting

### Error: "Cannot connect to database"

1. Make sure `.env.local` exists in project root
2. Check all POSTGRES_* variables are set
3. Restart dev server: `npm run dev`

### Error: "Table does not exist"

The app auto-creates the table on first run. If it fails:

1. Go to Vercel dashboard → Storage → Your database
2. Click "Query" tab
3. Run the SQL from the schema above manually

### Songs not saving?

1. Check browser console for errors
2. Verify database connection in Vercel dashboard
3. Check database size hasn't exceeded 256MB

### Audio files too large?

Current implementation stores audio as data URLs (base64) which are ~33% larger than the original file. For production:

- Consider using [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) for large files
- Or compress audio before storing
- Or store reference URLs to external storage

## 🚀 Deploying to Vercel

When you deploy to Vercel:

1. Push code to GitHub
2. Import project in Vercel
3. Vercel will **automatically** connect your database!
4. Environment variables are auto-configured
5. No additional setup needed!

## 💰 Cost Comparison

| Service | Free Tier | Paused? | Audio Storage |
|---------|-----------|---------|---------------|
| **Vercel Postgres** | 256MB, always-on | ❌ Never | Data URLs (in DB) |
| Supabase Free | 500MB, pauses after inactivity | ✅ Yes | Separate bucket |

## 📚 Learn More

- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
- [Vercel Blob for Large Files](https://vercel.com/docs/storage/vercel-blob)
- [@vercel/postgres SDK](https://vercel.com/docs/storage/vercel-postgres/sdk)

## 🎵 Happy Music Making!

Your BeatBloom app is now powered by Vercel Postgres - fast, reliable, and always available!
