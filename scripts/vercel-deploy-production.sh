#!/bin/bash

# ===========================================
# Vercel Production Deployment Script (npx version)
# ===========================================
# This script sets Vercel environment variables and deploys using npx

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Setting up Vercel environment variables for production...${NC}"

# Check if .env file exists with real keys
if ! grep -q "eyJ" .env 2>/dev/null; then
    echo -e "${RED}❌ Error: .env file doesn't contain real Supabase keys (should start with 'eyJ')${NC}"
    echo -e "${YELLOW}📝 Supabase keys should be updated in .env file first${NC}"
    exit 1
fi

# Extract keys from .env file
SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL=" .env | cut -d'=' -f2)
ANON_KEY=$(grep "NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env | cut -d'=' -f2)
SERVICE_ROLE_KEY=$(grep "SUPABASE_SERVICE_ROLE_KEY=" .env | cut -d'=' -f2)
GOOGLE_CLIENT_ID=$(grep "GOOGLE_CLIENT_ID=" .env | cut -d'=' -f2)
GOOGLE_CLIENT_SECRET=$(grep "GOOGLE_CLIENT_SECRET=" .env | cut -d'=' -f2)

echo -e "${GREEN}✅ Keys extracted from .env:${NC}"
echo "- Supabase URL: $SUPABASE_URL"
echo "- Anon Key: ${ANON_KEY:0:20}..."
echo "- Service Role Key: ${SERVICE_ROLE_KEY:0:20}..."
echo ""

# Check Vercel authentication
echo -e "${BLUE}🔑 Checking Vercel authentication...${NC}"
if npx vercel whoami &> /dev/null; then
    VERCEL_USER=$(npx vercel whoami 2>/dev/null)
    echo -e "${GREEN}✅ Logged in as: $VERCEL_USER${NC}"
else
    echo -e "${YELLOW}⚠️  Not logged in to Vercel. Logging in...${NC}"
    npx vercel login
fi

echo ""
echo -e "${BLUE}🔧 Setting Vercel environment variables...${NC}"

# Function to set environment variable
set_env_var() {
    local var_name=$1
    local var_value=$2
    
    echo -e "${YELLOW}Setting $var_name...${NC}"
    echo "$var_value" | npx vercel env add "$var_name" production
}

# Set production environment variables in Vercel
set_env_var "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL"
set_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$ANON_KEY"
set_env_var "SUPABASE_SERVICE_ROLE_KEY" "$SERVICE_ROLE_KEY"
set_env_var "GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_ID"
set_env_var "GOOGLE_CLIENT_SECRET" "$GOOGLE_CLIENT_SECRET"
set_env_var "NEXT_PUBLIC_DEMO_MODE" "false"
set_env_var "NODE_ENV" "production"
set_env_var "NEXT_PUBLIC_APP_VERSION" "1.1.0-production"

echo ""
echo -e "${GREEN}✅ Environment variables set!${NC}"
echo ""
echo -e "${BLUE}🚀 Deploying to production...${NC}"

# Deploy to production
if npx vercel --prod; then
    echo ""
    echo -e "${GREEN}🎯 Deployment complete!${NC}"
    echo -e "${BLUE}🔗 Production URL: https://huyou-wakarundesu.vercel.app${NC}"
    echo ""
    echo -e "${YELLOW}🧪 Ready for E2E testing:${NC}"
    echo "1. Login page: https://huyou-wakarundesu.vercel.app/login"
    echo "2. Expected flow: Google OAuth → Dashboard"
    
    # Save deployment info for testing
    echo "$(date)" > /tmp/deployment-timestamp.txt
    echo "https://huyou-wakarundesu.vercel.app" > /tmp/deployment-url.txt
    
    exit 0
else
    echo ""
    echo -e "${RED}❌ Deployment failed!${NC}"
    exit 1
fi