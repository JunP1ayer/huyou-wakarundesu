#!/bin/bash

# ===========================================
# New PC Quick Setup Script
# ===========================================
# Sets up development environment on a new machine in <1 minute

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}⚙️  New PC Setup Script for huyou-wakarundesu${NC}"
echo "=============================================="
echo ""

# Function to check command existence
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅ $1 is installed${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 is not installed${NC}"
        return 1
    fi
}

# Function to check npm package
check_npm_global() {
    if npm list -g $1 &> /dev/null; then
        echo -e "${GREEN}✅ $1 is installed globally${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 is not installed globally${NC}"
        return 1
    fi
}

# Step 1: Check prerequisites
echo -e "${BLUE}1. Checking Prerequisites${NC}"
echo "-------------------------"

# Check Node.js
if check_command node; then
    NODE_VERSION=$(node --version)
    echo "   Version: $NODE_VERSION"
else
    echo -e "${RED}Please install Node.js first!${NC}"
    exit 1
fi

# Check npm
check_command npm || exit 1

# Check git
check_command git || exit 1

echo ""

# Step 2: Install Vercel CLI if needed
echo -e "${BLUE}2. Checking Vercel CLI${NC}"
echo "----------------------"

if ! check_command vercel; then
    echo -e "${YELLOW}Installing Vercel CLI...${NC}"
    npm install -g vercel
    
    if check_command vercel; then
        echo -e "${GREEN}✅ Vercel CLI installed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to install Vercel CLI${NC}"
        echo "Try: sudo npm install -g vercel"
        exit 1
    fi
fi

echo ""

# Step 3: Vercel Login
echo -e "${BLUE}3. Vercel Authentication${NC}"
echo "------------------------"

# Check if already logged in
if vercel whoami &> /dev/null; then
    VERCEL_USER=$(vercel whoami 2>/dev/null)
    echo -e "${GREEN}✅ Already logged in as: $VERCEL_USER${NC}"
else
    echo -e "${YELLOW}Please login to Vercel:${NC}"
    vercel login
fi

echo ""

# Step 4: Pull environment variables
echo -e "${BLUE}4. Pulling Environment Variables${NC}"
echo "--------------------------------"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Not in project root directory!${NC}"
    echo "Please run this script from the huyou-wakarundesu directory"
    exit 1
fi

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local already exists${NC}"
    echo -n "Overwrite? (y/N): "
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env.local"
    else
        echo "Backing up existing .env.local to .env.local.backup"
        cp .env.local .env.local.backup
        echo -e "${YELLOW}Pulling production environment variables...${NC}"
        vercel env pull .env.local
    fi
else
    echo -e "${YELLOW}Pulling production environment variables...${NC}"
    vercel env pull .env.local
fi

echo ""

# Step 5: Verify required environment variables
echo -e "${BLUE}5. Verifying Environment Variables${NC}"
echo "----------------------------------"

MISSING_VARS=0

# Check required variables
check_env_var() {
    local var_name=$1
    if grep -q "^$var_name=" .env.local 2>/dev/null; then
        local value=$(grep "^$var_name=" .env.local | cut -d'=' -f2)
        if [[ -n "$value" ]] && [[ "$value" != *"___"* ]] && [[ "$value" != "your-"* ]]; then
            echo -e "${GREEN}✅ $var_name is set${NC}"
            return 0
        fi
    fi
    echo -e "${RED}❌ $var_name is missing or invalid${NC}"
    ((MISSING_VARS++))
    return 1
}

check_env_var "NEXT_PUBLIC_SUPABASE_URL"
check_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY"

# Optional check for NEXT_PUBLIC_SITE_URL (not always required)
if grep -q "^NEXT_PUBLIC_SITE_URL=" .env.local 2>/dev/null; then
    check_env_var "NEXT_PUBLIC_SITE_URL"
else
    echo -e "${YELLOW}ℹ️  NEXT_PUBLIC_SITE_URL not set (using dynamic origin)${NC}"
fi

if [ $MISSING_VARS -gt 0 ]; then
    echo ""
    echo -e "${RED}❌ Some required environment variables are missing!${NC}"
    echo "Please check your Vercel project settings"
    exit 1
fi

echo ""

# Step 6: Install dependencies
echo -e "${BLUE}6. Installing Dependencies${NC}"
echo "--------------------------"

if [ -f "package-lock.json" ]; then
    echo "Installing dependencies with npm ci..."
    npm ci
else
    echo "Installing dependencies with npm install..."
    npm install
fi

echo ""

# Step 7: Browser configuration reminder
echo -e "${BLUE}7. Browser Configuration${NC}"
echo "------------------------"

echo -e "${YELLOW}Important browser settings:${NC}"
echo "1. Allow third-party cookies:"
echo "   - Chrome: Settings → Privacy → Cookies → Allow all"
echo "   - OR add exception for [*.]supabase.co"
echo ""
echo "2. Clear existing cookies:"
echo "   - Clear cookies for localhost:3000"
echo "   - Clear cookies for *.supabase.co"
echo ""

# Step 8: Start development server
echo -e "${BLUE}8. Starting Development Server${NC}"
echo "------------------------------"

echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "To start the development server:"
echo -e "${YELLOW}npm run dev${NC}"
echo ""
echo "Then open: http://localhost:3000/login"
echo ""
echo -e "${BLUE}Quick test checklist:${NC}"
echo "1. ✓ npm run dev"
echo "2. ✓ Open http://localhost:3000/login"
echo "3. ✓ Click 'Googleでログイン'"
echo "4. ✓ Complete Google OAuth"
echo "5. ✓ Should redirect to /dashboard"
echo ""
echo -e "${GREEN}🎉 Setup completed in under 1 minute!${NC}"