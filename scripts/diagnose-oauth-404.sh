#!/bin/bash

# ===========================================
# Google OAuth 404 Diagnostic Script
# ===========================================
# Diagnoses common causes of 404 after Google login

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Google OAuth 404 Diagnostic Tool${NC}"
echo "======================================"
echo ""

# Function to check file existence
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $description exists${NC}"
        return 0
    else
        echo -e "${RED}❌ $description missing${NC}"
        return 1
    fi
}

# Function to check environment variable
check_env_var() {
    local var_name=$1
    local file=$2
    
    if grep -q "^$var_name=" "$file" 2>/dev/null; then
        local value=$(grep "^$var_name=" "$file" | cut -d'=' -f2)
        if [[ "$value" == *"___"* ]] || [[ "$value" == *"your-"* ]] || [ -z "$value" ]; then
            echo -e "${RED}❌ $var_name is not configured (placeholder value)${NC}"
            return 1
        else
            # Mask sensitive values
            if [[ "$var_name" == *"KEY"* ]] || [[ "$var_name" == *"SECRET"* ]]; then
                echo -e "${GREEN}✅ $var_name is set (value hidden)${NC}"
            else
                echo -e "${GREEN}✅ $var_name = ${value:0:30}...${NC}"
            fi
            return 0
        fi
    else
        echo -e "${RED}❌ $var_name is not set${NC}"
        return 1
    fi
}

# Function to extract Supabase project ref from URL
get_supabase_ref() {
    local url=$1
    echo "$url" | sed -n 's/https:\/\/\([^.]*\)\.supabase\.co/\1/p'
}

# 1. Check environment files
echo -e "${BLUE}1. Checking Environment Files${NC}"
echo "------------------------------"

ENV_FILE=".env.local"
ENV_EXISTS=false

if check_file "$ENV_FILE" "Local environment file (.env.local)"; then
    ENV_EXISTS=true
elif check_file ".env" "Environment file (.env)"; then
    ENV_FILE=".env"
    ENV_EXISTS=true
    echo -e "${YELLOW}⚠️  Using .env instead of .env.local${NC}"
fi

if [ "$ENV_EXISTS" = false ]; then
    echo -e "${RED}❌ No environment file found!${NC}"
    echo ""
    echo -e "${YELLOW}Fix: Create .env.local from .env.example:${NC}"
    echo "cp .env.example .env.local"
    echo "# Then edit .env.local with your Supabase credentials"
    exit 1
fi
echo ""

# 2. Check required environment variables
echo -e "${BLUE}2. Checking Environment Variables${NC}"
echo "---------------------------------"

MISSING_VARS=0
check_env_var "NEXT_PUBLIC_SUPABASE_URL" "$ENV_FILE" || ((MISSING_VARS++))
check_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$ENV_FILE" || ((MISSING_VARS++))

if [ $MISSING_VARS -gt 0 ]; then
    echo ""
    echo -e "${RED}❌ Missing or invalid environment variables!${NC}"
    echo -e "${YELLOW}Fix: Update $ENV_FILE with values from Supabase Dashboard${NC}"
fi
echo ""

# 3. Extract and display Supabase configuration
echo -e "${BLUE}3. Supabase Configuration${NC}"
echo "-------------------------"

if [ "$ENV_EXISTS" = true ]; then
    SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2)
    if [ -n "$SUPABASE_URL" ] && [[ "$SUPABASE_URL" != *"___"* ]]; then
        PROJECT_REF=$(get_supabase_ref "$SUPABASE_URL")
        echo -e "Project Reference: ${GREEN}$PROJECT_REF${NC}"
        echo -e "Project URL: ${GREEN}$SUPABASE_URL${NC}"
        echo ""
        echo -e "${YELLOW}Required Google OAuth Redirect URI:${NC}"
        echo "https://$PROJECT_REF.supabase.co/auth/v1/callback"
    fi
fi
echo ""

# 4. Check auth routes
echo -e "${BLUE}4. Checking Auth Routes${NC}"
echo "-----------------------"

check_file "app/auth/callback/page.tsx" "Auth callback page" || check_file "app/auth/callback/route.ts" "Auth callback route"
check_file "app/login/page.tsx" "Login page" || check_file "app/(auth)/login/page.tsx" "Login page"
check_file "app/dashboard/page.tsx" "Dashboard page" || check_file "app/(dashboard)/dashboard/page.tsx" "Dashboard page"
echo ""

# 5. Check localhost configuration
echo -e "${BLUE}5. Local Development Configuration${NC}"
echo "----------------------------------"

echo "Development URL: http://localhost:3000"
echo "Auth callback URL: http://localhost:3000/auth/callback"
echo ""
echo -e "${YELLOW}Required Supabase Dashboard Settings:${NC}"
echo "1. Authentication → URL Configuration → Site URL:"
echo "   - Development: http://localhost:3000"
echo "   - Production: https://your-domain.vercel.app"
echo ""
echo "2. Authentication → URL Configuration → Redirect URLs:"
echo "   - http://localhost:3000/**"
echo "   - https://your-domain.vercel.app/**"
echo ""

# 6. Browser diagnostics
echo -e "${BLUE}6. Browser Diagnostics${NC}"
echo "----------------------"

echo -e "${YELLOW}Check these browser settings on the NEW PC:${NC}"
echo ""
echo "1. Third-party cookies:"
echo "   - Chrome: Settings → Privacy → Cookies → Allow all cookies"
echo "   - Or add exception for: [*.]supabase.co"
echo ""
echo "2. Clear browser data:"
echo "   - Clear cookies for localhost:3000"
echo "   - Clear cookies for *.supabase.co"
echo ""
echo "3. Extensions:"
echo "   - Disable ad blockers temporarily"
echo "   - Disable privacy extensions"
echo ""

# 7. Generate diagnostic report
REPORT_FILE="/tmp/oauth_diagnostic_$(date +%Y%m%d_%H%M%S).txt"
cat > "$REPORT_FILE" << EOF
OAuth 404 Diagnostic Report
Generated: $(date)

Environment File: $ENV_FILE
Missing Variables: $MISSING_VARS

Checklist for NEW PC:
[ ] .env.local exists with correct values
[ ] NEXT_PUBLIC_SUPABASE_URL is set
[ ] NEXT_PUBLIC_SUPABASE_ANON_KEY is set
[ ] Browser allows third-party cookies
[ ] No ad blockers interfering

Common Fixes:
1. Copy .env.local from OLD PC to NEW PC
2. Clear all cookies and try again
3. Check Supabase Dashboard redirect URLs
4. Verify Google Cloud Console OAuth settings

Debug URLs to test:
- Direct callback: http://localhost:3000/auth/callback
- Login page: http://localhost:3000/login
- Dashboard: http://localhost:3000/dashboard
EOF

echo -e "${BLUE}7. Summary${NC}"
echo "----------"

if [ $MISSING_VARS -eq 0 ] && [ "$ENV_EXISTS" = true ]; then
    echo -e "${GREEN}✅ Environment configuration looks correct${NC}"
    echo ""
    echo -e "${YELLOW}Most likely causes:${NC}"
    echo "1. Browser blocking third-party cookies"
    echo "2. Supabase redirect URLs not configured for localhost"
    echo "3. Different Supabase project between PCs"
else
    echo -e "${RED}❌ Environment configuration issues found${NC}"
    echo ""
    echo -e "${YELLOW}Required actions:${NC}"
    echo "1. Copy .env.local from OLD PC to NEW PC"
    echo "2. Or create new .env.local with correct Supabase credentials"
fi

echo ""
echo -e "${BLUE}Diagnostic report saved to: $REPORT_FILE${NC}"