#!/bin/bash

# ===========================================
# Dynamic Threshold System Verification Script
# ===========================================
# Verifies the deployment of v2.1.0 with comprehensive testing

set -e

# Configuration
PRODUCTION_URL="https://huyou-wakarundesu.vercel.app"
PREVIEW_URL_FILE="/tmp/preview_url.txt"
VERSION_TAG="v2.1.0"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Dynamic Threshold System Verification - v2.1.0${NC}"
echo "=================================================="

# Function to log with timestamp
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check API endpoint
check_api_endpoint() {
    local url=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    
    log "${BLUE}Testing: $description${NC}"
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$url$endpoint")
    
    if [ "$response" -eq "$expected_status" ]; then
        log "${GREEN}✅ $description - Status: $response${NC}"
        return 0
    else
        log "${RED}❌ $description - Expected: $expected_status, Got: $response${NC}"
        return 1
    fi
}

# Function to check API with JSON response
check_api_json() {
    local url=$1
    local endpoint=$2
    local expected_field=$3
    local description=$4
    
    log "${BLUE}Testing: $description${NC}"
    
    local response=$(curl -s "$url$endpoint")
    
    if echo "$response" | jq -e ".$expected_field" > /dev/null 2>&1; then
        log "${GREEN}✅ $description - JSON field '$expected_field' exists${NC}"
        echo "Response: $response" | jq .
        return 0
    else
        log "${RED}❌ $description - JSON field '$expected_field' missing${NC}"
        echo "Response: $response"
        return 1
    fi
}

# Function to test threshold calculation
test_threshold_calculation() {
    local url=$1
    local description=$2
    
    log "${BLUE}Testing: $description${NC}"
    
    # Test payload for threshold calculation
    local payload='{
        "profile": {
            "isStudent": false,
            "isMarried": true,
            "hasDependents": false,
            "workingHoursPerWeek": 25,
            "employeeCount": 500
        },
        "monthlyData": [
            {"year": 2024, "month": 1, "income": 90000, "source": "part_time"},
            {"year": 2024, "month": 2, "income": 95000, "source": "part_time"},
            {"year": 2024, "month": 3, "income": 88000, "source": "part_time"}
        ]
    }'
    
    local response=$(curl -s -X POST "$url/api/calculate-fuyou-v2" \
        -H "Content-Type: application/json" \
        -d "$payload")
    
    if echo "$response" | jq -e ".result" > /dev/null 2>&1; then
        log "${GREEN}✅ $description - Calculation successful${NC}"
        echo "Sample calculation result:" | jq .
        echo "$response" | jq .result
        return 0
    else
        log "${RED}❌ $description - Calculation failed${NC}"
        echo "Response: $response"
        return 1
    fi
}

# Function to test admin interface
test_admin_interface() {
    local url=$1
    local description=$2
    
    log "${BLUE}Testing: $description${NC}"
    
    # Test admin threshold page accessibility
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$url/admin/thresholds")
    
    if [ "$response" -eq 200 ] || [ "$response" -eq 401 ]; then
        log "${GREEN}✅ $description - Admin interface accessible (Status: $response)${NC}"
        return 0
    else
        log "${RED}❌ $description - Admin interface not accessible (Status: $response)${NC}"
        return 1
    fi
}

# Function to test dynamic threshold API
test_dynamic_threshold_api() {
    local url=$1
    local description=$2
    
    log "${BLUE}Testing: $description${NC}"
    
    # Test threshold retrieval API
    local response=$(curl -s "$url/api/thresholds/2024")
    
    if echo "$response" | jq -e ".fuyou_103" > /dev/null 2>&1; then
        log "${GREEN}✅ $description - Dynamic thresholds accessible${NC}"
        echo "Available thresholds:"
        echo "$response" | jq 'keys[]'
        return 0
    else
        log "${RED}❌ $description - Dynamic thresholds not accessible${NC}"
        echo "Response: $response"
        return 1
    fi
}

# Function to check database connectivity
check_database_connectivity() {
    local url=$1
    local description=$2
    
    log "${BLUE}Testing: $description${NC}"
    
    # Test database health via API
    local response=$(curl -s "$url/api/health")
    
    if echo "$response" | jq -e '.database' > /dev/null 2>&1; then
        local db_status=$(echo "$response" | jq -r '.database.status')
        if [ "$db_status" == "connected" ]; then
            log "${GREEN}✅ $description - Database connected${NC}"
            return 0
        else
            log "${YELLOW}⚠️  $description - Database status: $db_status${NC}"
            return 1
        fi
    else
        log "${RED}❌ $description - Database status unknown${NC}"
        return 1
    fi
}

# Function to verify environment variables
verify_environment_variables() {
    local url=$1
    local description=$2
    
    log "${BLUE}Testing: $description${NC}"
    
    # Check if demo mode is disabled
    local response=$(curl -s "$url/api/health")
    
    if echo "$response" | jq -e '.mode' > /dev/null 2>&1; then
        local mode=$(echo "$response" | jq -r '.mode')
        if [ "$mode" == "production" ]; then
            log "${GREEN}✅ $description - Production mode enabled${NC}"
            return 0
        else
            log "${YELLOW}⚠️  $description - Mode: $mode${NC}"
            return 1
        fi
    else
        log "${RED}❌ $description - Mode not reported${NC}"
        return 1
    fi
}

# Function to run comprehensive verification
run_comprehensive_verification() {
    local url=$1
    local env_name=$2
    
    log "${BLUE}🔍 Comprehensive verification for $env_name${NC}"
    log "URL: $url"
    
    local failures=0
    
    # Basic connectivity tests
    check_api_endpoint "$url" "/" 200 "Homepage accessibility" || ((failures++))
    check_api_endpoint "$url" "/api/health" 200 "Health endpoint" || ((failures++))
    
    # Health and status checks
    check_api_json "$url" "/api/health" "healthy" "Health status check" || ((failures++))
    verify_environment_variables "$url" "Environment variables" || ((failures++))
    check_database_connectivity "$url" "Database connectivity" || ((failures++))
    
    # Dynamic threshold system tests
    test_dynamic_threshold_api "$url" "Dynamic threshold API" || ((failures++))
    test_threshold_calculation "$url" "Threshold calculation" || ((failures++))
    
    # Admin interface tests
    test_admin_interface "$url" "Admin interface" || ((failures++))
    
    # Authentication tests
    check_api_endpoint "$url" "/login" 200 "Login page" || ((failures++))
    check_api_endpoint "$url" "/auth/callback" 200 "Auth callback endpoint" || ((failures++))
    
    # Static assets
    check_api_endpoint "$url" "/favicon.ico" 200 "Favicon" || ((failures++))
    check_api_endpoint "$url" "/manifest.json" 200 "PWA manifest" || ((failures++))
    
    log ""
    if [ $failures -eq 0 ]; then
        log "${GREEN}🎉 All verification tests passed for $env_name!${NC}"
        return 0
    else
        log "${RED}❌ $failures verification tests failed for $env_name${NC}"
        return 1
    fi
}

# Function to generate verification report
generate_verification_report() {
    local timestamp=$(date '+%Y-%m-%d_%H-%M-%S')
    local report_file="/tmp/verification_report_${timestamp}.md"
    
    cat > "$report_file" << EOF
# Dynamic Threshold System Verification Report

**Date:** $(date)
**Version:** $VERSION_TAG
**Environment:** Production

## Verification Results

### Production Environment
- **URL:** $PRODUCTION_URL
- **Status:** $([ $prod_result -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")

### Preview Environment
- **URL:** $([ -f "$PREVIEW_URL_FILE" ] && cat "$PREVIEW_URL_FILE" || echo "N/A")
- **Status:** $([ $preview_result -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")

## Manual Verification Checklist

### Functional Tests
- [ ] User can access homepage
- [ ] User can login with Google OAuth
- [ ] User can navigate to dashboard
- [ ] User can calculate tax thresholds
- [ ] Threshold calculations are accurate
- [ ] Admin interface is accessible (for admins)
- [ ] Dynamic thresholds are loading from database

### Performance Tests
- [ ] Page load time < 3 seconds
- [ ] API response time < 1 second
- [ ] No JavaScript errors in console
- [ ] No network errors in DevTools

### Security Tests
- [ ] HTTPS is enforced
- [ ] Authentication is required for protected pages
- [ ] Admin routes are protected
- [ ] No sensitive data exposed in client

### Data Integrity Tests
- [ ] Threshold values match expected amounts
- [ ] Year-based threshold selection works
- [ ] Fallback mechanism works when database is unavailable
- [ ] Cache invalidation works properly

## Recommendations

1. **Monitor application logs** for the first 24 hours
2. **Set up alerts** for error rates and performance degradation
3. **Verify backup procedures** are working
4. **Test rollback procedure** in development environment
5. **Update documentation** with any changes

## Sign-off

- [ ] Technical verification completed
- [ ] Functional verification completed
- [ ] Performance verification completed
- [ ] Security verification completed
- [ ] Ready for production use

**Verified by:** [Name]
**Date:** $(date)
EOF

    log "${GREEN}✅ Verification report generated: $report_file${NC}"
    echo "Report location: $report_file"
}

# Main verification flow
main() {
    log "${BLUE}Starting verification process...${NC}"
    
    local prod_result=0
    local preview_result=0
    
    # Test production environment
    log "${BLUE}🚀 Testing Production Environment${NC}"
    run_comprehensive_verification "$PRODUCTION_URL" "Production" || prod_result=$?
    
    # Test preview environment if available
    if [ -f "$PREVIEW_URL_FILE" ]; then
        local preview_url=$(cat "$PREVIEW_URL_FILE")
        log "${BLUE}🔬 Testing Preview Environment${NC}"
        run_comprehensive_verification "$preview_url" "Preview" || preview_result=$?
    else
        log "${YELLOW}⚠️  Preview environment not available${NC}"
        preview_result=1
    fi
    
    # Generate report
    generate_verification_report
    
    # Final summary
    log ""
    log "${BLUE}📊 Verification Summary${NC}"
    log "Production: $([ $prod_result -eq 0 ] && echo "${GREEN}PASSED${NC}" || echo "${RED}FAILED${NC}")"
    log "Preview: $([ $preview_result -eq 0 ] && echo "${GREEN}PASSED${NC}" || echo "${RED}FAILED${NC}")"
    
    if [ $prod_result -eq 0 ]; then
        log "${GREEN}🎉 Production deployment verification successful!${NC}"
        log ""
        log "Next steps:"
        log "1. Complete manual verification checklist"
        log "2. Monitor application for 30 minutes"
        log "3. Update team on deployment success"
        return 0
    else
        log "${RED}❌ Production deployment verification failed!${NC}"
        log ""
        log "Required actions:"
        log "1. Review failed tests above"
        log "2. Consider rollback if critical issues"
        log "3. Fix issues and redeploy"
        return 1
    fi
}

# Run verification
main "$@"