#!/bin/bash

# ====================================================
# 扶養わかるんです - Zero-to-Dev Setup Script
# ====================================================
# Automated environment setup for new developers
# Supports: macOS, Ubuntu, Windows/WSL, GitHub Codespaces

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 扶養わかるんです - Zero-to-Dev Setup${NC}"
echo "========================================"
echo ""

# Function to log with timestamp
log() {
    echo -e "[$(date '+%H:%M:%S')] $1"
}

# Function to check command existence
command_exists() {
    command -v "$1" &> /dev/null
}

# Function to check if we're in the right directory
check_project_directory() {
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ Error: Not in project root directory${NC}"
        echo "Please run this script from the huyou-wakarundesu directory"
        exit 1
    fi
    
    if ! grep -q "fuyou-wakarundesu" package.json; then
        echo -e "${YELLOW}⚠️  Warning: This doesn't appear to be the fuyou-wakarundesu project${NC}"
        echo "Continuing anyway..."
    fi
}

# Function to install Node.js dependencies
install_dependencies() {
    log "${BLUE}📦 Installing Node.js dependencies...${NC}"
    
    if [ ! -d "node_modules" ]; then
        if command_exists npm; then
            npm install
        elif command_exists yarn; then
            yarn install
        else
            echo -e "${RED}❌ Neither npm nor yarn found. Please install Node.js first.${NC}"
            exit 1
        fi
        log "${GREEN}✅ Dependencies installed${NC}"
    else
        log "${GREEN}✅ Dependencies already installed${NC}"
    fi
}

# Function to setup environment variables via Vercel
setup_env_via_vercel() {
    log "${BLUE}🔧 Setting up environment variables via Vercel...${NC}"
    
    # Check if Vercel token is available
    if [ -n "$VERCEL_TOKEN" ]; then
        log "${GREEN}✅ VERCEL_TOKEN found in environment${NC}"
        
        # Try to pull environment variables
        if npx vercel env pull .env.local --token="$VERCEL_TOKEN" 2>/dev/null; then
            log "${GREEN}✅ Environment variables pulled from Vercel${NC}"
            
            # Add NEXT_PUBLIC_SITE_URL if missing
            if ! grep -q "NEXT_PUBLIC_SITE_URL" .env.local; then
                echo "NEXT_PUBLIC_SITE_URL=http://localhost:3000" >> .env.local
                log "${GREEN}✅ Added NEXT_PUBLIC_SITE_URL for local development${NC}"
            fi
            
            return 0
        else
            log "${YELLOW}⚠️  Failed to pull from Vercel (project not linked or token invalid)${NC}"
        fi
    else
        log "${YELLOW}⚠️  VERCEL_TOKEN not found in environment${NC}"
    fi
    
    # Try without token (if user is already logged in)
    if command_exists vercel || command_exists npx; then
        log "${YELLOW}Trying to pull without token (using existing auth)...${NC}"
        
        if npx vercel env pull .env.local 2>/dev/null; then
            log "${GREEN}✅ Environment variables pulled from Vercel${NC}"
            
            # Add NEXT_PUBLIC_SITE_URL if missing
            if ! grep -q "NEXT_PUBLIC_SITE_URL" .env.local; then
                echo "NEXT_PUBLIC_SITE_URL=http://localhost:3000" >> .env.local
                log "${GREEN}✅ Added NEXT_PUBLIC_SITE_URL for local development${NC}"
            fi
            
            return 0
        else
            log "${YELLOW}⚠️  Could not pull from Vercel${NC}"
        fi
    fi
    
    return 1
}

# Function to setup environment manually
setup_env_manually() {
    log "${BLUE}📝 Setting up environment manually...${NC}"
    
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.local.template" ]; then
            cp .env.local.template .env.local
            log "${GREEN}✅ Created .env.local from template${NC}"
            echo ""
            echo -e "${YELLOW}📋 Manual setup required:${NC}"
            echo "1. Edit .env.local and replace placeholder values with real credentials"
            echo "2. Get Supabase credentials from: https://supabase.com/dashboard"
            echo "3. See .env.local.template for detailed instructions"
            echo ""
        else
            echo -e "${RED}❌ No .env.local.template found${NC}"
            echo "Please create .env.local manually with required environment variables"
            exit 1
        fi
    else
        log "${GREEN}✅ .env.local already exists${NC}"
    fi
}

# Function to validate environment variables
validate_environment() {
    log "${BLUE}🔍 Validating environment variables...${NC}"
    
    if [ ! -f ".env.local" ]; then
        echo -e "${RED}❌ .env.local not found${NC}"
        return 1
    fi
    
    # Required variables
    local required_vars=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "NEXT_PUBLIC_SITE_URL")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" .env.local || grep -q "^$var=.*YOUR_.*" .env.local; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        log "${GREEN}✅ All required environment variables are set${NC}"
        return 0
    else
        echo -e "${RED}❌ Missing or invalid environment variables:${NC}"
        for var in "${missing_vars[@]}"; do
            echo -e "   ${RED}• $var${NC}"
        done
        echo ""
        echo -e "${YELLOW}📋 Next steps:${NC}"
        echo "1. Edit .env.local and set the missing variables"
        echo "2. Run: npm run verify-env to check your configuration"
        echo "3. See .env.local.template for setup instructions"
        return 1
    fi
}

# Function to provide final instructions
show_final_instructions() {
    echo ""
    log "${GREEN}🎉 Setup completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}🚀 Ready to start development:${NC}"
    echo ""
    echo "  npm run dev"
    echo ""
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo "1. Open: http://localhost:3000"
    echo "2. Test: Google OAuth login"
    echo "3. Verify: Dashboard functionality"
    echo ""
    echo -e "${BLUE}🔧 Useful commands:${NC}"
    echo "• npm run verify-env  - Check environment configuration"
    echo "• npm run test        - Run unit tests"
    echo "• npm run lint        - Check code quality"
    echo ""
}

# Function to show troubleshooting info
show_troubleshooting() {
    echo ""
    echo -e "${YELLOW}🔧 Troubleshooting:${NC}"
    echo ""
    echo -e "${YELLOW}Environment setup failed?${NC}"
    echo "• Check that you have Node.js 18+ installed"
    echo "• Ensure you have access to the Vercel project"
    echo "• Try manual setup with: cp .env.local.template .env.local"
    echo ""
    echo -e "${YELLOW}Need Vercel access?${NC}"
    echo "• Ask the project maintainer for access"
    echo "• Or set up your own Supabase project for development"
    echo ""
    echo -e "${YELLOW}Still having issues?${NC}"
    echo "• Check README.md for detailed setup instructions"
    echo "• Run: node scripts/verify-env.js for diagnostics"
    echo "• Create an issue on GitHub"
    echo ""
}

# Main setup flow
main() {
    local start_time=$(date +%s)
    
    log "${BLUE}Starting automated setup...${NC}"
    
    # Step 1: Verify we're in the right place
    check_project_directory
    
    # Step 2: Install dependencies
    install_dependencies
    
    # Step 3: Setup environment variables
    if setup_env_via_vercel; then
        log "${GREEN}✅ Environment setup via Vercel successful${NC}"
    else
        log "${YELLOW}⚠️  Vercel setup failed, falling back to manual setup${NC}"
        setup_env_manually
    fi
    
    # Step 4: Validate environment
    if validate_environment; then
        show_final_instructions
        
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        echo -e "${GREEN}⏱️  Setup completed in ${duration} seconds${NC}"
    else
        show_troubleshooting
        echo -e "${YELLOW}⚠️  Setup completed with warnings${NC}"
        echo -e "${YELLOW}Please fix the environment issues above before running 'npm run dev'${NC}"
        exit 1
    fi
}

# Run setup
main "$@"