#!/bin/bash

# ===========================================
# Vercel Production Deployment Script
# ===========================================
# This script sets Vercel environment variables and deploys

set -e

echo "🚀 Setting up Vercel environment variables for production..."

# Check if .env file exists with real keys
if ! grep -q "eyJ" .env 2>/dev/null; then
    echo "❌ Error: .env file doesn't contain real Supabase keys (should start with 'eyJ')"
    echo "📝 Run: ./scripts/update-supabase-keys.sh <ANON_KEY> <SERVICE_ROLE_KEY> first"
    exit 1
fi

# Extract keys from .env file
ANON_KEY=$(grep "NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env | cut -d'=' -f2)
SERVICE_ROLE_KEY=$(grep "SUPABASE_SERVICE_ROLE_KEY=" .env | cut -d'=' -f2)
GOOGLE_CLIENT_ID=$(grep "GOOGLE_CLIENT_ID=" .env | cut -d'=' -f2)
GOOGLE_CLIENT_SECRET=$(grep "GOOGLE_CLIENT_SECRET=" .env | cut -d'=' -f2)

echo "🔧 Setting Vercel environment variables..."

# Set production environment variables in Vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "https://zbsjqsqytjjlbpchpacl.supabase.co"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "$ANON_KEY"
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "$SERVICE_ROLE_KEY"
vercel env add GOOGLE_CLIENT_ID production <<< "$GOOGLE_CLIENT_ID"
vercel env add GOOGLE_CLIENT_SECRET production <<< "$GOOGLE_CLIENT_SECRET"
vercel env add NEXT_PUBLIC_DEMO_MODE production <<< "false"
vercel env add NODE_ENV production <<< "production"
vercel env add NEXT_PUBLIC_APP_VERSION production <<< "1.1.0-production"

echo "✅ Environment variables set!"
echo ""
echo "🚀 Deploying to production..."

# Deploy to production
vercel --prod

echo ""
echo "🎯 Deployment complete!"
echo "🔗 Test URL: https://huyou-wakarundesu.vercel.app/login"
echo ""
echo "🧪 Test steps:"
echo "1. Open in incognito: https://huyou-wakarundesu.vercel.app/login"
echo "2. Click 'Google でログイン'"
echo "3. Complete Google OAuth"
echo "4. Verify redirect to dashboard"
echo "5. Check DevTools Console for errors"