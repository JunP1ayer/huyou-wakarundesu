#!/bin/bash

# ===========================================
# THRESHOLD_FALLBACK Environment Variable Setup
# ===========================================
# Configures dynamic threshold fallback values for production

set -e

# Configuration
PROJECT_NAME="huyou-wakarundesu"
VERSION_TAG="v2.1.0"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 THRESHOLD_FALLBACK Environment Variable Setup${NC}"
echo "================================================"

# Function to log with timestamp
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to generate complete threshold fallback JSON
generate_complete_fallback() {
    log "${BLUE}📝 Generating complete THRESHOLD_FALLBACK configuration...${NC}"
    
    cat > /tmp/threshold_fallback_complete.json << 'EOF'
{
  "fuyou_103": {
    "key": "fuyou_103",
    "kind": "tax",
    "year": 2024,
    "yen": 1030000,
    "label": "配偶者控除（103万円の壁）",
    "description": "年収103万円以下で配偶者控除38万円が適用される",
    "is_active": true,
    "category": "spouse_deduction",
    "applies_to": ["part_time", "contract", "freelance"],
    "conditions": {
      "income_type": "gross_annual",
      "includes_bonus": true,
      "calculation_method": "calendar_year"
    }
  },
  "fuyou_106": {
    "key": "fuyou_106",
    "kind": "social",
    "year": 2024,
    "yen": 1060000,
    "label": "社会保険加入義務（106万円の壁）",
    "description": "年収106万円以上で社会保険加入義務が発生（従業員101人以上の企業）",
    "is_active": true,
    "category": "social_insurance",
    "applies_to": ["part_time"],
    "conditions": {
      "employee_count_threshold": 101,
      "working_hours_per_week": 20,
      "working_days_per_week": 3,
      "contract_duration_months": 12
    }
  },
  "fuyou_130": {
    "key": "fuyou_130",
    "kind": "social",
    "year": 2024,
    "yen": 1300000,
    "label": "社会保険扶養除外（130万円の壁）",
    "description": "年収130万円以上で配偶者の社会保険扶養から外れる",
    "is_active": true,
    "category": "dependent_exclusion",
    "applies_to": ["part_time", "contract", "freelance"],
    "conditions": {
      "income_type": "gross_annual",
      "includes_bonus": true,
      "includes_allowances": true,
      "calculation_method": "rolling_12_months"
    }
  },
  "fuyou_150": {
    "key": "fuyou_150",
    "kind": "tax",
    "year": 2024,
    "yen": 1500000,
    "label": "配偶者特別控除上限（150万円の壁）",
    "description": "年収150万円以上で配偶者特別控除が段階的に減額される",
    "is_active": true,
    "category": "spouse_special_deduction",
    "applies_to": ["part_time", "contract", "freelance"],
    "conditions": {
      "income_type": "gross_annual",
      "includes_bonus": true,
      "spouse_income_threshold": 11000000,
      "deduction_phases": [
        {"max_income": 1550000, "deduction": 380000},
        {"max_income": 1600000, "deduction": 310000},
        {"max_income": 1667000, "deduction": 260000}
      ]
    }
  },
  "fuyou_201": {
    "key": "fuyou_201",
    "kind": "tax",
    "year": 2024,
    "yen": 2010000,
    "label": "配偶者特別控除完全消失（201万円の壁）",
    "description": "年収201万円以上で配偶者特別控除が完全に消失する",
    "is_active": true,
    "category": "spouse_special_deduction_limit",
    "applies_to": ["part_time", "contract", "freelance", "full_time"],
    "conditions": {
      "income_type": "gross_annual",
      "includes_bonus": true,
      "deduction_amount": 0
    }
  }
}
EOF

    # Also create a minimal version for basic fallback
    cat > /tmp/threshold_fallback_minimal.json << 'EOF'
{
  "fuyou_103": {
    "key": "fuyou_103",
    "kind": "tax",
    "year": 2024,
    "yen": 1030000,
    "label": "配偶者控除（103万円の壁）",
    "is_active": true
  },
  "fuyou_106": {
    "key": "fuyou_106",
    "kind": "social",
    "year": 2024,
    "yen": 1060000,
    "label": "社会保険加入義務（106万円の壁）",
    "is_active": true
  },
  "fuyou_130": {
    "key": "fuyou_130",
    "kind": "social",
    "year": 2024,
    "yen": 1300000,
    "label": "社会保険扶養除外（130万円の壁）",
    "is_active": true
  },
  "fuyou_150": {
    "key": "fuyou_150",
    "kind": "tax",
    "year": 2024,
    "yen": 1500000,
    "label": "配偶者特別控除上限（150万円の壁）",
    "is_active": true
  }
}
EOF

    log "${GREEN}✅ Threshold fallback configurations generated${NC}"
    
    # Display the configurations
    echo ""
    log "${BLUE}📋 Complete Configuration Preview:${NC}"
    cat /tmp/threshold_fallback_complete.json | jq .
    
    echo ""
    log "${BLUE}📋 Minimal Configuration Preview:${NC}"
    cat /tmp/threshold_fallback_minimal.json | jq .
}

# Function to set environment variables
set_environment_variables() {
    local env_type=$1
    local fallback_file=$2
    
    log "${BLUE}⚙️  Setting environment variables for $env_type...${NC}"
    
    # Read the fallback configuration
    local fallback_json=$(cat "$fallback_file" | jq -c .)
    
    # Set THRESHOLD_FALLBACK
    log "${YELLOW}Setting THRESHOLD_FALLBACK...${NC}"
    echo "$fallback_json" | vercel env add THRESHOLD_FALLBACK "$env_type"
    
    # Set version
    log "${YELLOW}Setting NEXT_PUBLIC_APP_VERSION...${NC}"
    echo "$VERSION_TAG" | vercel env add NEXT_PUBLIC_APP_VERSION "$env_type"
    
    # Set threshold system enabled flag
    log "${YELLOW}Setting THRESHOLD_SYSTEM_ENABLED...${NC}"
    echo "true" | vercel env add THRESHOLD_SYSTEM_ENABLED "$env_type"
    
    # Set fallback strategy
    log "${YELLOW}Setting THRESHOLD_FALLBACK_STRATEGY...${NC}"
    echo "db_env_hardcoded" | vercel env add THRESHOLD_FALLBACK_STRATEGY "$env_type"
    
    log "${GREEN}✅ Environment variables set for $env_type${NC}"
}

# Function to verify environment variables
verify_environment_variables() {
    local env_type=$1
    
    log "${BLUE}🔍 Verifying environment variables for $env_type...${NC}"
    
    # List environment variables
    local env_vars=$(vercel env ls "$env_type" | grep -E "(THRESHOLD|VERSION)")
    
    if echo "$env_vars" | grep -q "THRESHOLD_FALLBACK"; then
        log "${GREEN}✅ THRESHOLD_FALLBACK is set${NC}"
    else
        log "${RED}❌ THRESHOLD_FALLBACK is not set${NC}"
        return 1
    fi
    
    if echo "$env_vars" | grep -q "NEXT_PUBLIC_APP_VERSION"; then
        log "${GREEN}✅ NEXT_PUBLIC_APP_VERSION is set${NC}"
    else
        log "${RED}❌ NEXT_PUBLIC_APP_VERSION is not set${NC}"
        return 1
    fi
    
    log "${GREEN}✅ Environment variables verification passed${NC}"
}

# Function to create environment documentation
create_environment_documentation() {
    log "${BLUE}📄 Creating environment documentation...${NC}"
    
    cat > /tmp/environment_setup_guide.md << 'EOF'
# Dynamic Threshold Environment Setup Guide

## Environment Variables Overview

### THRESHOLD_FALLBACK
**Purpose:** Provides fallback threshold values when database is unavailable
**Format:** JSON object with threshold definitions
**Environment:** Production, Preview, Development

### NEXT_PUBLIC_APP_VERSION
**Purpose:** Displays current application version
**Format:** String (e.g., "v2.1.0")
**Environment:** Production, Preview, Development

### THRESHOLD_SYSTEM_ENABLED
**Purpose:** Enables/disables dynamic threshold system
**Format:** Boolean ("true" or "false")
**Environment:** Production, Preview, Development

### THRESHOLD_FALLBACK_STRATEGY
**Purpose:** Defines fallback strategy order
**Format:** String ("db_env_hardcoded")
**Environment:** Production, Preview, Development

## Fallback Strategy

1. **Database First:** Try to load thresholds from fuyou_thresholds table
2. **Environment Variables:** Use THRESHOLD_FALLBACK if database unavailable
3. **Hardcoded Values:** Use built-in defaults as last resort

## Configuration Examples

### Production Environment
```bash
# Set complete fallback configuration
vercel env add THRESHOLD_FALLBACK production < threshold_fallback_complete.json

# Set version
vercel env add NEXT_PUBLIC_APP_VERSION production <<< "v2.1.0"

# Enable system
vercel env add THRESHOLD_SYSTEM_ENABLED production <<< "true"
```

### Development Environment
```bash
# Set minimal fallback configuration
vercel env add THRESHOLD_FALLBACK development < threshold_fallback_minimal.json

# Set version
vercel env add NEXT_PUBLIC_APP_VERSION development <<< "v2.1.0-dev"
```

## Troubleshooting

### Issue: Thresholds not loading
**Check:** THRESHOLD_FALLBACK is valid JSON
**Solution:** Validate JSON with `jq` before setting

### Issue: Version not displaying
**Check:** NEXT_PUBLIC_APP_VERSION is set
**Solution:** Ensure environment variable is public (NEXT_PUBLIC_)

### Issue: System falling back to hardcoded values
**Check:** Database connectivity and THRESHOLD_FALLBACK format
**Solution:** Verify database connection and JSON structure

## Monitoring

Monitor these endpoints to verify environment configuration:
- `/api/health` - System health including threshold source
- `/api/thresholds/2024` - Current threshold values
- `/api/version` - Application version information
EOF

    log "${GREEN}✅ Environment documentation created: /tmp/environment_setup_guide.md${NC}"
}

# Main setup flow
main() {
    local env_type=${1:-production}
    local fallback_type=${2:-complete}
    
    log "${BLUE}Starting environment setup for $env_type...${NC}"
    
    # Generate fallback configurations
    generate_complete_fallback
    
    # Select fallback file based on type
    local fallback_file="/tmp/threshold_fallback_${fallback_type}.json"
    
    if [ ! -f "$fallback_file" ]; then
        log "${RED}❌ Fallback file not found: $fallback_file${NC}"
        exit 1
    fi
    
    # Set environment variables
    set_environment_variables "$env_type" "$fallback_file"
    
    # Verify environment variables
    verify_environment_variables "$env_type"
    
    # Create documentation
    create_environment_documentation
    
    log "${GREEN}🎉 Environment setup completed successfully!${NC}"
    log ""
    log "Summary:"
    log "- Environment: $env_type"
    log "- Fallback type: $fallback_type"
    log "- Configuration file: $fallback_file"
    log "- Documentation: /tmp/environment_setup_guide.md"
    log ""
    log "Next steps:"
    log "1. Deploy application to pick up new environment variables"
    log "2. Test threshold loading with /api/thresholds/2024"
    log "3. Verify fallback behavior by temporarily disabling database"
}

# Show usage if no arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 <environment> [fallback_type]"
    echo ""
    echo "Arguments:"
    echo "  environment    Environment to configure (production|preview|development)"
    echo "  fallback_type  Fallback configuration type (complete|minimal)"
    echo ""
    echo "Examples:"
    echo "  $0 production complete    # Set complete fallback for production"
    echo "  $0 development minimal    # Set minimal fallback for development"
    echo "  $0 preview complete       # Set complete fallback for preview"
    exit 1
fi

# Run main function
main "$@"