#!/bin/bash

# Quick OAuth 404 Test - Minimal diagnostic
echo "🔍 Quick OAuth 404 Test"
echo "====================="
echo ""

# Test 1: Check .env.local
echo "1. Checking .env.local..."
if [ -f ".env.local" ]; then
    echo "✅ .env.local exists"
    
    # Check if it has real values
    if grep -q "supabase.co" .env.local && ! grep -q "YOUR_PROJECT" .env.local; then
        echo "✅ Contains Supabase configuration"
        
        # Extract and show project ref
        PROJECT_REF=$(grep "NEXT_PUBLIC_SUPABASE_URL" .env.local | sed -n 's/.*https:\/\/\([^.]*\)\.supabase\.co.*/\1/p')
        echo "📌 Project: $PROJECT_REF"
    else
        echo "❌ Missing or invalid Supabase configuration"
        echo ""
        echo "FIX: Copy .env.local from OLD PC or create from template:"
        echo "     cp .env.local.template .env.local"
        echo "     Then edit with your Supabase credentials"
        exit 1
    fi
else
    echo "❌ .env.local not found!"
    echo ""
    echo "FIX: This is likely your issue. Do one of:"
    echo "     1. Copy .env.local from OLD PC"
    echo "     2. cp .env.example .env.local && edit it"
    echo "     3. cp .env.local.template .env.local && edit it"
    exit 1
fi

echo ""
echo "2. Quick fixes to try:"
echo "   a) Clear cookies: Chrome → Settings → Privacy → Clear browsing data"
echo "   b) Allow cookies: Chrome → Settings → Cookies → Allow all"
echo "   c) Restart: npm run dev"
echo ""
echo "3. Test login at: http://localhost:3000/login"