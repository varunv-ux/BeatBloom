#!/bin/bash

echo "🎵 BeatBloom + Vercel Postgres Setup"
echo "===================================="
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "✅ .env.local file found"
else
    echo "❌ .env.local file not found!"
    echo ""
    echo "📝 Follow these steps:"
    echo "1. Go to https://vercel.com/dashboard"
    echo "2. Click 'Storage' → 'Create Database' → 'Postgres'"
    echo "3. Name it 'beatbloom-db' and create"
    echo "4. Copy all environment variables from the '.env.local' tab"
    echo "5. Create a .env.local file in this directory and paste them"
    echo ""
    echo "See VERCEL_SETUP.md for detailed instructions"
    exit 1
fi

echo "🔍 Checking for required environment variables..."

# Check for POSTGRES_URL
if grep -q "POSTGRES_URL=" .env.local; then
    echo "✅ POSTGRES_URL found"
else
    echo "❌ POSTGRES_URL not found in .env.local"
    exit 1
fi

echo ""
echo "✅ All checks passed!"
echo ""
echo "🚀 Starting development server..."
echo ""

npm run dev
