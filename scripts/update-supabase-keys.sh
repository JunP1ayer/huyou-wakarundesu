#!/bin/bash

# ===========================================
# Supabase API Keys Update Script
# ===========================================
# Usage: ./scripts/update-supabase-keys.sh [ANON_KEY] [SERVICE_ROLE_KEY]

set -e

if [ $# -ne 2 ]; then
    echo "❌ Usage: $0 <ANON_KEY> <SERVICE_ROLE_KEY>"
    echo "📝 Example: $0 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'"
    exit 1
fi

ANON_KEY="$1"
SERVICE_ROLE_KEY="$2"

echo "🔄 Updating Supabase API keys in environment files..."

# Update .env
if [ -f ".env" ]; then
    sed -i.bak "s|\[CORRECT_ANON_KEY_FOR_zbsjqsqytjjlbpchpacl\]|$ANON_KEY|g" .env
    sed -i.bak "s|\[CORRECT_SERVICE_ROLE_KEY_FOR_zbsjqsqytjjlbpchpacl\]|$SERVICE_ROLE_KEY|g" .env
    echo "✅ Updated .env"
fi

# Update .env.local
if [ -f ".env.local" ]; then
    sed -i.bak "s|\[GET_FROM_SUPABASE_DASHBOARD_zbsjqsqytjjlbpchpacl\]|$ANON_KEY|g" .env.local
    sed -i.bak "s|\[GET_FROM_SUPABASE_DASHBOARD_zbsjqsqytjjlbpchpacl\]|$SERVICE_ROLE_KEY|g" .env.local
    echo "✅ Updated .env.local"
fi

# Update .env.production
if [ -f ".env.production" ]; then
    sed -i.bak "s|\[GET_FROM_SUPABASE_DASHBOARD_zbsjqsqytjjlbpchpacl\]|$ANON_KEY|g" .env.production
    sed -i.bak "s|\[GET_FROM_SUPABASE_DASHBOARD_zbsjqsqytjjlbpchpacl\]|$SERVICE_ROLE_KEY|g" .env.production
    echo "✅ Updated .env.production"
fi

# Update PRODUCTION_ENV_TEMPLATE_FINAL.env
if [ -f "PRODUCTION_ENV_TEMPLATE_FINAL.env" ]; then
    sed -i.bak "s|\[GET_FROM_SUPABASE_API_SETTINGS\]|$ANON_KEY|g" PRODUCTION_ENV_TEMPLATE_FINAL.env
    sed -i.bak "s|\[GET_FROM_SUPABASE_API_SETTINGS\]|$SERVICE_ROLE_KEY|g" PRODUCTION_ENV_TEMPLATE_FINAL.env
    echo "✅ Updated PRODUCTION_ENV_TEMPLATE_FINAL.env"
fi

echo ""
echo "🎯 Next steps:"
echo "1. Verify the keys in your files"
echo "2. Set these in Vercel environment variables:"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY"
echo "   SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY"
echo "3. Run: vercel --prod"
echo ""
echo "🔒 Security: Remove .env*.bak files after verification"
echo "rm -f .env*.bak"