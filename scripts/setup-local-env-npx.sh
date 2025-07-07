#!/bin/bash

# ===========================================
# Setup Local Environment for New PC (npx version)
# ===========================================
# Uses npx to avoid permission issues with global installs

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}⚙️  Setup Local ENV for New PC (npx version)${NC}"
echo "============================================="
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Step 1: Check tools
echo -e "${BLUE}1. Checking Tools${NC}"
echo "-----------------"

# Check Node.js
if ! command_exists node; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"

# Check npm
if ! command_exists npm; then
    echo -e "${RED}❌ npm not found. Please install npm.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm found: $(npm --version)${NC}"

# Check/test Vercel CLI (prefer npx to avoid permission issues)
echo -e "${YELLOW}Testing Vercel CLI access...${NC}"
if npx --yes vercel --version &> /dev/null; then
    echo -e "${GREEN}✅ Vercel CLI accessible via npx${NC}"
    VERCEL_CMD="npx vercel"
elif command_exists vercel; then
    echo -e "${GREEN}✅ Vercel CLI installed globally${NC}"
    VERCEL_CMD="vercel"
else
    echo -e "${RED}❌ Cannot access Vercel CLI${NC}"
    echo "Please install Node.js and npm first."
    exit 1
fi

echo ""

# Step 2: Check Vercel authentication
echo -e "${BLUE}2. Checking Vercel Authentication${NC}"
echo "----------------------------------"

if $VERCEL_CMD whoami &> /dev/null; then
    VERCEL_USER=$($VERCEL_CMD whoami 2>/dev/null)
    echo -e "${GREEN}✅ Logged in as: $VERCEL_USER${NC}"
else
    echo -e "${RED}❌ Not logged in to Vercel${NC}"
    echo ""
    echo -e "${YELLOW}Logging in to Vercel...${NC}"
    $VERCEL_CMD login
    
    if $VERCEL_CMD whoami &> /dev/null; then
        VERCEL_USER=$($VERCEL_CMD whoami 2>/dev/null)
        echo -e "${GREEN}✅ Successfully logged in as: $VERCEL_USER${NC}"
    else
        echo -e "${RED}❌ Login failed${NC}"
        exit 1
    fi
fi

echo ""

# Step 3: Check project directory
echo -e "${BLUE}3. Verifying Project Directory${NC}"
echo "------------------------------"

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Not in project root directory!${NC}"
    echo "Please run this script from the huyou-wakarundesu directory"
    exit 1
fi

# Check if it's the right project
if grep -q "fuyou-wakarundesu" package.json; then
    echo -e "${GREEN}✅ In huyou-wakarundesu project directory${NC}"
else
    echo -e "${YELLOW}⚠️  Project name doesn't match 'fuyou-wakarundesu'${NC}"
    echo "Continuing anyway..."
fi

echo ""

# Step 4: Pull ENV from Vercel
echo -e "${BLUE}4. Pulling ENV from Vercel${NC}"
echo "----------------------------"

# Backup existing .env.local if it exists
if [ -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  Backing up existing .env.local${NC}"
    cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)
    echo "Backup created: .env.local.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Pull environment variables
echo -e "${YELLOW}Pulling production environment variables...${NC}"
if $VERCEL_CMD env pull .env.local; then
    echo -e "${GREEN}✅ Environment variables pulled successfully${NC}"
else
    echo -e "${RED}❌ Failed to pull environment variables${NC}"
    echo ""
    echo "Possible issues:"
    echo "1. Not logged in: $VERCEL_CMD login"
    echo "2. No access to project: Check Vercel dashboard"
    echo "3. No environment variables set in Vercel project"
    exit 1
fi

echo ""

# Step 5: Validate required environment variables
echo -e "${BLUE}5. Validating Environment Variables${NC}"
echo "-----------------------------------"

MISSING_VARS=0
REQUIRED_VARS=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY")

check_env_var() {
    local var_name=$1
    local required=${2:-true}
    
    if grep -q "^$var_name=" .env.local 2>/dev/null; then
        local value=$(grep "^$var_name=" .env.local | cut -d'=' -f2 | tr -d '"' | tr -d "'")
        
        if [[ -n "$value" ]] && [[ "$value" != *"___"* ]] && [[ "$value" != "your-"* ]] && [[ "$value" != "undefined" ]]; then
            if [[ "$var_name" == *"KEY"* ]] || [[ "$var_name" == *"SECRET"* ]]; then
                echo -e "${GREEN}✅ $var_name is set (value hidden)${NC}"
            else
                echo -e "${GREEN}✅ $var_name = ${value:0:50}...${NC}"
            fi
            return 0
        else
            if [ "$required" = true ]; then
                echo -e "${RED}❌ $var_name is empty or placeholder${NC}"
                ((MISSING_VARS++))
            else
                echo -e "${YELLOW}ℹ️  $var_name is empty (optional)${NC}"
            fi
            return 1
        fi
    else
        if [ "$required" = true ]; then
            echo -e "${RED}❌ $var_name is missing${NC}"
            ((MISSING_VARS++))
        else
            echo -e "${YELLOW}ℹ️  $var_name not set (optional)${NC}"
        fi
        return 1
    fi
}

# Check required variables
for var in "${REQUIRED_VARS[@]}"; do
    check_env_var "$var"
done

# Check optional variables
check_env_var "NEXT_PUBLIC_SITE_URL" false
check_env_var "OPENAI_API_KEY" false

if [ $MISSING_VARS -gt 0 ]; then
    echo ""
    echo -e "${RED}❌ $MISSING_VARS required environment variable(s) missing!${NC}"
    echo ""
    echo "To fix this:"
    echo "1. Go to https://vercel.com/dashboard"
    echo "2. Select your project"
    echo "3. Go to Settings → Environment Variables"
    echo "4. Ensure these variables are set:"
    for var in "${REQUIRED_VARS[@]}"; do
        echo "   - $var"
    done
    echo "5. Re-run this script"
    exit 1
fi

echo ""

# Step 6: Install dependencies if needed
echo -e "${BLUE}6. Installing Dependencies${NC}"
echo "--------------------------"

if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

echo ""

# Step 7: Extract Supabase configuration info
echo -e "${BLUE}7. Supabase Configuration${NC}"
echo "-------------------------"

SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env.local | cut -d'=' -f2 | tr -d '"' | tr -d "'")
PROJECT_REF=$(echo "$SUPABASE_URL" | sed -n 's/.*https:\/\/\([^.]*\)\.supabase\.co.*/\1/p')

if [ -n "$PROJECT_REF" ]; then
    echo -e "${GREEN}✅ Supabase Project: $PROJECT_REF${NC}"
    echo -e "${GREEN}✅ Supabase URL: $SUPABASE_URL${NC}"
    
    echo ""
    echo -e "${YELLOW}Required Supabase configurations:${NC}"
    echo "Dashboard: https://supabase.com/dashboard/project/$PROJECT_REF/auth/url-configuration"
    echo ""
    echo "1. Site URL should include: http://localhost:3000"
    echo "2. Redirect URLs should include: http://localhost:3000/**"
    echo "3. Google OAuth provider should be enabled"
else
    echo -e "${RED}❌ Could not extract Supabase project reference${NC}"
    echo "Please check NEXT_PUBLIC_SUPABASE_URL format"
fi

echo ""

# Step 8: Success message and next steps
echo -e "${GREEN}🎉 Local environment setup complete!${NC}"
echo ""
echo -e "${BLUE}📊 Summary:${NC}"
echo "✅ Vercel CLI accessible (using: $VERCEL_CMD)"
echo "✅ Environment variables pulled from production"
echo "✅ Required keys validated"
echo "✅ Dependencies installed"
echo ""
echo -e "${BLUE}🚀 Next steps:${NC}"
echo "1. Configure browser cookies (see QUICK_GUIDE.md)"
echo "2. Start dev server: npm run dev"
echo "3. Open: http://localhost:3000/login"
echo "4. Test Google OAuth login"
echo ""
echo -e "${BLUE}🧪 Optional: Run automated tests${NC}"
echo "node scripts/test-local-oauth.mjs"
echo ""
echo -e "${YELLOW}💡 If OAuth fails:${NC}"
echo "- Clear browser cookies for localhost:3000"
echo "- Allow third-party cookies for supabase.co"
echo "- Check Supabase redirect URLs configuration"