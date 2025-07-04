#!/bin/bash

# ===========================================
# Production Endpoint Testing Script
# ===========================================
# Tests the production deployment

set -e

PRODUCTION_URL="https://huyou-wakarundesu.vercel.app"
LOG_FILE="./logs/e2e-test-results.log"

echo "🧪 Testing Production Deployment: $PRODUCTION_URL"
echo "📝 Results will be logged to: $LOG_FILE"

# Create logs directory if it doesn't exist
mkdir -p logs

# Clear previous log
> "$LOG_FILE"

echo "=== Production Endpoint Test - $(date) ===" >> "$LOG_FILE"

# Test 1: Basic connectivity
echo "🔍 Test 1: Basic connectivity..."
if curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL" | grep -q "200"; then
    echo "✅ Homepage responds: 200 OK" | tee -a "$LOG_FILE"
else
    echo "❌ Homepage failed to respond" | tee -a "$LOG_FILE"
fi

# Test 2: Login page accessibility
echo "🔍 Test 2: Login page accessibility..."
LOGIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL/login")
if [ "$LOGIN_RESPONSE" = "200" ]; then
    echo "✅ Login page responds: 200 OK" | tee -a "$LOG_FILE"
else
    echo "❌ Login page failed: HTTP $LOGIN_RESPONSE" | tee -a "$LOG_FILE"
fi

# Test 3: API health check
echo "🔍 Test 3: API health check..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL/api/health" || echo "failed")
if [ "$API_RESPONSE" = "200" ]; then
    echo "✅ API health endpoint: 200 OK" | tee -a "$LOG_FILE"
else
    echo "❌ API health endpoint failed: $API_RESPONSE" | tee -a "$LOG_FILE"
fi

# Test 4: Check for critical errors in page content
echo "🔍 Test 4: Checking for error indicators..."
PAGE_CONTENT=$(curl -s "$PRODUCTION_URL/login" || echo "")
if echo "$PAGE_CONTENT" | grep -q "Configuration Required\|Demo Mode\|Missing Environment"; then
    echo "❌ Configuration errors detected in page content" | tee -a "$LOG_FILE"
else
    echo "✅ No obvious configuration errors in page content" | tee -a "$LOG_FILE"
fi

# Test 5: Check if Google OAuth button is present
if echo "$PAGE_CONTENT" | grep -q "Google.*ログイン\|googleLogin\|oauth"; then
    echo "✅ Google OAuth elements detected in login page" | tee -a "$LOG_FILE"
else
    echo "❌ Google OAuth elements not found in login page" | tee -a "$LOG_FILE"
fi

echo "" | tee -a "$LOG_FILE"
echo "🎯 Manual testing required:" | tee -a "$LOG_FILE"
echo "1. Open: $PRODUCTION_URL/login" | tee -a "$LOG_FILE"
echo "2. Click 'Google でログイン' button" | tee -a "$LOG_FILE"
echo "3. Complete Google OAuth flow" | tee -a "$LOG_FILE"
echo "4. Verify redirect to dashboard" | tee -a "$LOG_FILE"
echo "5. Check DevTools for console/network errors" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

echo "📋 Test completed. Check $LOG_FILE for full results."
echo "🌐 Production URL: $PRODUCTION_URL/login"