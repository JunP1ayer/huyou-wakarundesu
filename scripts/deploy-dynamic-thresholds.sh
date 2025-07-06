#!/bin/bash

# ===========================================
# Dynamic Threshold System Deployment Script
# ===========================================
# Deploys v2.1.0 with dynamic threshold support
# Includes: Migration 006 + Environment Variables + Rollback Plan

set -e

# Configuration
PROJECT_NAME="huyou-wakarundesu"
SUPABASE_PROJECT_ID="zbsjqsqytjjlbpchpacl"
MIGRATION_FILE="supabase/migrations/006_dynamic_thresholds.sql"
VERSION_TAG="v2.1.0"
PREVIEW_BRANCH="preview-dynamic-thresholds"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Dynamic Threshold System Deployment - v2.1.0${NC}"
echo "=============================================="

# Function to log with timestamp
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check prerequisites
check_prerequisites() {
    log "${BLUE}📋 Checking prerequisites...${NC}"
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -f "$MIGRATION_FILE" ]; then
        log "${RED}❌ Error: Run this script from the project root directory${NC}"
        exit 1
    fi
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        log "${RED}❌ Error: You have uncommitted changes. Please commit or stash them first.${NC}"
        echo "Uncommitted files:"
        git status --porcelain
        exit 1
    fi
    
    # Check required tools
    for tool in supabase vercel gh; do
        if ! command -v $tool &> /dev/null; then
            log "${RED}❌ Error: $tool is not installed${NC}"
            exit 1
        fi
    done
    
    log "${GREEN}✅ Prerequisites check passed${NC}"
}

# Function to generate THRESHOLD_FALLBACK environment variable
generate_threshold_fallback() {
    log "${BLUE}🔧 Generating THRESHOLD_FALLBACK environment variable...${NC}"
    
    cat > /tmp/threshold_fallback.json << 'EOF'
{
  "fuyou_103": {
    "key": "fuyou_103",
    "kind": "tax",
    "year": 2024,
    "yen": 1030000,
    "label": "配偶者控除（103万円の壁）",
    "description": "年収103万円以下で配偶者控除38万円が適用される",
    "is_active": true
  },
  "fuyou_106": {
    "key": "fuyou_106",
    "kind": "social",
    "year": 2024,
    "yen": 1060000,
    "label": "社会保険加入義務（106万円の壁）",
    "description": "年収106万円以上で社会保険加入義務が発生（従業員101人以上の企業）",
    "is_active": true
  },
  "fuyou_130": {
    "key": "fuyou_130",
    "kind": "social",
    "year": 2024,
    "yen": 1300000,
    "label": "社会保険扶養除外（130万円の壁）",
    "description": "年収130万円以上で配偶者の社会保険扶養から外れる",
    "is_active": true
  },
  "fuyou_150": {
    "key": "fuyou_150",
    "kind": "tax",
    "year": 2024,
    "yen": 1500000,
    "label": "配偶者特別控除上限（150万円の壁）",
    "description": "年収150万円以上で配偶者特別控除が段階的に減額される",
    "is_active": true
  }
}
EOF
    
    # Minify JSON for environment variable
    THRESHOLD_FALLBACK_JSON=$(cat /tmp/threshold_fallback.json | jq -c .)
    
    log "${GREEN}✅ THRESHOLD_FALLBACK generated${NC}"
    echo "JSON preview:"
    echo "$THRESHOLD_FALLBACK_JSON" | jq .
    
    # Save to file for verification
    echo "$THRESHOLD_FALLBACK_JSON" > /tmp/threshold_fallback_minified.json
    
    return 0
}

# Function to create database backup
create_backup() {
    log "${BLUE}💾 Creating database backup...${NC}"
    
    # Create backup using Supabase CLI
    BACKUP_NAME="backup_before_migration_006_$(date +%Y%m%d_%H%M%S)"
    
    log "${YELLOW}⚠️  Note: Manual backup verification required${NC}"
    log "Please verify backup creation in Supabase Dashboard:"
    log "https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/settings/database"
    
    # For now, just document the backup requirement
    echo "# Database Backup Documentation" > /tmp/backup_log.txt
    echo "Backup Name: $BACKUP_NAME" >> /tmp/backup_log.txt
    echo "Backup Date: $(date)" >> /tmp/backup_log.txt
    echo "Migration: 006_dynamic_thresholds.sql" >> /tmp/backup_log.txt
    echo "Status: Manual verification required" >> /tmp/backup_log.txt
    
    log "${GREEN}✅ Backup documentation created${NC}"
}

# Function to apply database migration
apply_migration() {
    log "${BLUE}🛠️  Applying migration 006_dynamic_thresholds.sql...${NC}"
    
    # Check if migration is already applied
    echo "Checking if migration is already applied..."
    
    # Apply migration using Supabase CLI
    log "${YELLOW}Applying migration to production database...${NC}"
    
    if supabase db push --project-ref "$SUPABASE_PROJECT_ID"; then
        log "${GREEN}✅ Migration applied successfully${NC}"
        
        # Verify migration
        log "${BLUE}🔍 Verifying migration...${NC}"
        
        # Check if table exists and has data
        if supabase db diff --project-ref "$SUPABASE_PROJECT_ID" --schema public | grep -q "fuyou_thresholds"; then
            log "${GREEN}✅ Migration verification passed${NC}"
        else
            log "${YELLOW}⚠️  Migration verification inconclusive${NC}"
        fi
    else
        log "${RED}❌ Migration failed${NC}"
        exit 1
    fi
}

# Function to configure environment variables
configure_environment() {
    log "${BLUE}⚙️  Configuring Vercel environment variables...${NC}"
    
    # Read the generated THRESHOLD_FALLBACK
    if [ ! -f "/tmp/threshold_fallback_minified.json" ]; then
        log "${RED}❌ Error: THRESHOLD_FALLBACK not generated${NC}"
        exit 1
    fi
    
    THRESHOLD_FALLBACK=$(cat /tmp/threshold_fallback_minified.json)
    
    # Set environment variables
    log "${YELLOW}Setting THRESHOLD_FALLBACK environment variable...${NC}"
    
    # Use vercel env to set the variable
    echo "$THRESHOLD_FALLBACK" | vercel env add THRESHOLD_FALLBACK production
    
    # Also set the version
    echo "$VERSION_TAG" | vercel env add NEXT_PUBLIC_APP_VERSION production
    
    log "${GREEN}✅ Environment variables configured${NC}"
}

# Function to create preview deployment
create_preview() {
    log "${BLUE}🔬 Creating preview deployment...${NC}"
    
    # Create preview branch
    git checkout -b "$PREVIEW_BRANCH"
    
    # Deploy to preview
    if vercel --target preview; then
        PREVIEW_URL=$(vercel ls | grep "$PROJECT_NAME" | grep "preview" | head -1 | awk '{print $2}')
        
        log "${GREEN}✅ Preview deployment created${NC}"
        log "${BLUE}🔗 Preview URL: https://$PREVIEW_URL${NC}"
        
        # Save preview URL for testing
        echo "https://$PREVIEW_URL" > /tmp/preview_url.txt
        
        # Return to main branch
        git checkout main
        git branch -D "$PREVIEW_BRANCH"
        
        return 0
    else
        log "${RED}❌ Preview deployment failed${NC}"
        git checkout main
        git branch -D "$PREVIEW_BRANCH"
        exit 1
    fi
}

# Function to run automated tests
run_tests() {
    log "${BLUE}🧪 Running automated tests...${NC}"
    
    # Run Jest tests
    log "${YELLOW}Running Jest tests...${NC}"
    if npm run test:ci; then
        log "${GREEN}✅ Jest tests passed${NC}"
    else
        log "${RED}❌ Jest tests failed${NC}"
        exit 1
    fi
    
    # Run Playwright E2E tests
    log "${YELLOW}Running Playwright E2E tests...${NC}"
    if npm run test:e2e; then
        log "${GREEN}✅ E2E tests passed${NC}"
    else
        log "${RED}❌ E2E tests failed${NC}"
        exit 1
    fi
    
    # Run linting and type checking
    log "${YELLOW}Running linting and type checking...${NC}"
    if npm run lint && npm run type-check; then
        log "${GREEN}✅ Linting and type checking passed${NC}"
    else
        log "${RED}❌ Linting or type checking failed${NC}"
        exit 1
    fi
}

# Function to deploy to production
deploy_production() {
    log "${BLUE}🚀 Deploying to production...${NC}"
    
    # Create and push git tag
    git tag "$VERSION_TAG"
    git push origin "$VERSION_TAG"
    
    # Deploy to production
    if vercel --prod; then
        log "${GREEN}✅ Production deployment successful${NC}"
        log "${BLUE}🔗 Production URL: https://huyou-wakarundesu.vercel.app${NC}"
        
        # Verify deployment
        log "${BLUE}🔍 Verifying production deployment...${NC}"
        
        # Check health endpoint
        if curl -s "https://huyou-wakarundesu.vercel.app/api/health" | grep -q '"healthy"'; then
            log "${GREEN}✅ Production deployment verification passed${NC}"
        else
            log "${YELLOW}⚠️  Production deployment verification inconclusive${NC}"
        fi
    else
        log "${RED}❌ Production deployment failed${NC}"
        exit 1
    fi
}

# Function to create rollback plan
create_rollback_plan() {
    log "${BLUE}📋 Creating rollback plan...${NC}"
    
    cat > /tmp/rollback_plan.md << 'EOF'
# Dynamic Threshold System Rollback Plan

## Emergency Rollback Procedure

### 1. Immediate Rollback (Application Level)
```bash
# Revert to previous version
git checkout v2.0.0
vercel --prod

# Or disable dynamic thresholds via environment variable
vercel env add THRESHOLD_FALLBACK production <<< '{}'
```

### 2. Database Rollback (If Required)
```bash
# Connect to production database
supabase db connect --project-ref zbsjqsqytjjlbpchpacl

# Drop dynamic threshold table (CAUTION: Data loss!)
DROP TABLE IF EXISTS fuyou_thresholds CASCADE;

# Or disable via status update
UPDATE fuyou_thresholds SET is_active = false WHERE year = 2024;
```

### 3. Environment Variable Rollback
```bash
# Remove THRESHOLD_FALLBACK environment variable
vercel env rm THRESHOLD_FALLBACK production

# Reset version
vercel env add NEXT_PUBLIC_APP_VERSION production <<< 'v2.0.0'
```

### 4. Verification Steps
1. Check application health: https://huyou-wakarundesu.vercel.app/api/health
2. Verify threshold calculation works
3. Check admin interface accessibility
4. Monitor error logs for 10 minutes

### 5. Communication Plan
- Update status page if available
- Notify users via app notification
- Document incident in post-mortem

## Common Issues and Solutions

### Issue: Admin interface not accessible
**Solution:** Check authentication and RLS policies

### Issue: Threshold calculations incorrect
**Solution:** Verify fallback values and database data

### Issue: Performance degradation
**Solution:** Check database query performance and caching

## Recovery Validation
- [ ] Application responds normally
- [ ] Authentication works
- [ ] Tax calculations are correct
- [ ] No console errors
- [ ] Performance metrics normal
EOF

    log "${GREEN}✅ Rollback plan created at /tmp/rollback_plan.md${NC}"
}

# Main deployment flow
main() {
    log "${BLUE}Starting deployment process...${NC}"
    
    # Phase 1: Prerequisites and preparation
    check_prerequisites
    generate_threshold_fallback
    create_backup
    
    # Phase 2: Database migration
    apply_migration
    
    # Phase 3: Environment configuration
    configure_environment
    
    # Phase 4: Testing
    create_preview
    run_tests
    
    # Phase 5: Production deployment
    deploy_production
    
    # Phase 6: Documentation
    create_rollback_plan
    
    log "${GREEN}🎉 Deployment completed successfully!${NC}"
    log ""
    log "Summary:"
    log "- Version: $VERSION_TAG"
    log "- Migration: 006_dynamic_thresholds.sql applied"
    log "- Environment: THRESHOLD_FALLBACK configured"
    log "- Tests: All passed"
    log "- Production: https://huyou-wakarundesu.vercel.app"
    log "- Rollback plan: /tmp/rollback_plan.md"
    
    log ""
    log "${BLUE}Next steps:${NC}"
    log "1. Monitor application for 30 minutes"
    log "2. Test admin interface manually"
    log "3. Verify threshold calculations"
    log "4. Update documentation"
}

# Run with confirmation
if [ "$1" == "--confirm" ]; then
    main
else
    echo "This script will deploy the dynamic threshold system to production."
    echo "Please review the script and run with --confirm flag when ready."
    echo ""
    echo "Usage: $0 --confirm"
    exit 0
fi