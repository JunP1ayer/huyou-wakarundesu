#!/bin/bash

# ===========================================
# Simple THRESHOLD_FALLBACK Environment Setup
# ===========================================
# Sets up environment variables without requiring jq

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Simple THRESHOLD_FALLBACK Environment Setup${NC}"
echo "=============================================="

# Generate the THRESHOLD_FALLBACK JSON (minified)
THRESHOLD_FALLBACK='{"fuyou_103":{"key":"fuyou_103","kind":"tax","year":2024,"yen":1030000,"label":"配偶者控除（103万円の壁）","is_active":true},"fuyou_106":{"key":"fuyou_106","kind":"social","year":2024,"yen":1060000,"label":"社会保険加入義務（106万円の壁）","is_active":true},"fuyou_130":{"key":"fuyou_130","kind":"social","year":2024,"yen":1300000,"label":"社会保険扶養除外（130万円の壁）","is_active":true},"fuyou_150":{"key":"fuyou_150","kind":"tax","year":2024,"yen":1500000,"label":"配偶者特別控除上限（150万円の壁）","is_active":true}}'

echo -e "${BLUE}📋 Generated THRESHOLD_FALLBACK configuration${NC}"
echo "Length: ${#THRESHOLD_FALLBACK} characters"
echo ""

echo -e "${BLUE}🔧 Setting up Vercel environment variables...${NC}"
echo ""

# Check if vercel is available
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Please install it first:${NC}"
    echo "npm install -g vercel"
    exit 1
fi

# Set environment variables
echo -e "${YELLOW}Setting THRESHOLD_FALLBACK...${NC}"
echo "$THRESHOLD_FALLBACK" | vercel env add THRESHOLD_FALLBACK production

echo -e "${YELLOW}Setting NEXT_PUBLIC_APP_VERSION...${NC}"
echo "v2.1.0" | vercel env add NEXT_PUBLIC_APP_VERSION production

echo -e "${YELLOW}Setting THRESHOLD_SYSTEM_ENABLED...${NC}"
echo "true" | vercel env add THRESHOLD_SYSTEM_ENABLED production

echo -e "${GREEN}✅ Environment variables configured successfully!${NC}"
echo ""

echo -e "${BLUE}🔍 Verifying configuration...${NC}"
echo "Run the following command to verify:"
echo "vercel env ls production | grep -E '(THRESHOLD|VERSION)'"
echo ""

echo -e "${BLUE}📋 Manual verification commands:${NC}"
echo ""
echo "# Check environment variables"
echo "vercel env ls production"
echo ""
echo "# Test threshold API after deployment"
echo "curl -s https://huyou-wakarundesu.vercel.app/api/health | grep -E '(healthy|mode)'"
echo ""
echo "# Test threshold retrieval"
echo "curl -s https://huyou-wakarundesu.vercel.app/api/thresholds/2024"
echo ""

echo -e "${GREEN}🎉 Environment setup completed!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Deploy the application: vercel --prod"
echo "2. Test the health endpoint"
echo "3. Verify threshold calculations"
echo "4. Test admin interface"