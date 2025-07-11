# 🔍 Google OAuth Flow Debug Analysis Guide

## 🎯 Current Task: Identify Google OAuth 400 Error Root Cause

### 📊 Latest Deployment Status
- **Branch**: `feature/onboarding-v2`
- **Latest Commit**: `5febf19` - Comprehensive auth debugging system active
- **Debug Features**: ✅ Enabled with extensive logging

---

## 📋 Step 1: Access Deployment Logs

### Vercel Preview Deployment Logs
1. **Access Vercel Dashboard**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select `huyou-wakarundesu` project
   - Find the latest Preview deployment for `feature/onboarding-v2`

2. **View Function Logs**:
   ```bash
   # Look for these specific log entries:
   [AUTH CALLBACK] 認証コールバック処理開始
   [AUTH CALLBACK] exchangeCodeForSession実行詳細
   [AUTH CALLBACK] exchangeCodeForSession結果詳細
   [LOGIN DEBUG] Google login initiated
   [LOGIN DEBUG] signInWithOAuth result
   ```

3. **Test OAuth Flow**:
   - Navigate to Preview URL + `/login`
   - Click "Login with Google"
   - Monitor the function logs during the process

### Expected Log Analysis Points:
```javascript
// Key logs to examine:
[AUTH CALLBACK] exchangeCodeForSession実行詳細: {
  codeFormat: "...",           // ✅ Check code format
  codeLength: 123,             // ✅ Verify reasonable length
  requestOrigin: "...",        // ✅ Confirm matches Supabase config
  userAgent: "..."
}

[AUTH CALLBACK] セッション取得エラー詳細: {
  message: "...",              // 🔍 Main error message
  status: 400,                 // 🔍 HTTP status
  code: "...",                 // 🔍 Supabase error code
  details: "...",              // 🔍 Additional details
  hint: "..."                  // 🔍 Supabase hint
}
```

---

## 📋 Step 2: Verify Supabase Redirect URLs

### Current Required URLs:
```
Development:
http://localhost:3000/auth/callback

Preview:
https://huyou-wakarundesu-feature-onboarding-v2.vercel.app/auth/callback

Production:
https://huyou-wakarundesu.vercel.app/auth/callback

Wildcard (if supported):
https://huyou-wakarundesu-*.vercel.app/auth/callback
```

### Verification Steps:
1. **Supabase Dashboard**:
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Navigate to Authentication → URL Configuration
   - Verify ALL above URLs are listed in "Redirect URLs"

2. **Get Exact Preview URL**:
   ```bash
   # From Vercel Dashboard, copy the exact Preview URL
   # Example: https://huyou-wakarundesu-git-feature-onboarding-v2-junp1ayers-projects.vercel.app
   ```

3. **Add Specific Preview URL**:
   - Add the exact Preview URL + `/auth/callback` to Supabase
   - Example: `https://huyou-wakarundesu-git-feature-onboarding-v2-junp1ayers-projects.vercel.app/auth/callback`

---

## 📋 Step 3: Verify Google OAuth Configuration

### Google Cloud Console Check:
1. **Access Google Cloud Console**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project
   - Navigate to APIs & Services → Credentials

2. **OAuth 2.0 Client IDs**:
   - Find your Web application client
   - Check "Authorized redirect URIs"
   - Should contain: `https://zbsjqsqytjjlbpchpacl.supabase.co/auth/v1/callback`

3. **Authorized JavaScript Origins**:
   - Should include your domain origins:
   ```
   http://localhost:3000
   https://huyou-wakarundesu.vercel.app
   https://huyou-wakarundesu-git-feature-onboarding-v2-junp1ayers-projects.vercel.app
   ```

---

## 📋 Step 4: Extract Supabase Auth Logs

### Supabase Dashboard Analysis:
1. **Access Auth Logs**:
   - Go to Supabase Dashboard → Authentication → Logs
   - Filter by time range (last 1 hour)
   - Look for failed login attempts

2. **Key Log Patterns to Find**:
   ```json
   {
     "level": "error",
     "msg": "exchangeCodeForSession failed",
     "error": "...",
     "timestamp": "...",
     "user_id": null
   }
   ```

3. **Export Log Data**:
   - Copy relevant error logs
   - Note timestamps and error patterns
   - Look for correlation with your test attempts

---

## 📋 Step 5: Cookie Store Analysis

### Current Implementation Check:
The auth callback route uses:
```typescript
const supabase = createRouteHandlerClient<Database>({ cookies })
```

### Debug Points:
1. **Verify Cookie Headers**:
   - Check if cookies are being passed correctly
   - Look for `[AUTH CALLBACK] リクエスト詳細` logs
   - Confirm `cookies` function is available

2. **Session Storage**:
   - Verify Supabase can store session in cookies
   - Check for cookie-related errors in logs

---

## 🚨 Common OAuth 400 Error Causes

### 1. **Invalid Authorization Code**
```
Error: "invalid_grant" 
Cause: Code expired, reused, or malformed
Solution: Check code format and timing
```

### 2. **Redirect URI Mismatch**
```
Error: "redirect_uri_mismatch"
Cause: Supabase callback URL not in Google OAuth config
Solution: Add exact URL to Google Cloud Console
```

### 3. **Client Configuration**
```
Error: "unauthorized_client"
Cause: Google Client ID/Secret mismatch
Solution: Verify environment variables match Google Console
```

### 4. **PKCE Issues**
```
Error: "invalid_request"
Cause: PKCE code challenge/verifier mismatch
Solution: Check Supabase OAuth flow implementation
```

---

## 🔧 Action Items

### Immediate Steps:
1. ✅ Access Preview deployment and test OAuth flow
2. ✅ Copy all console logs from browser and Vercel function logs
3. ✅ Verify Supabase redirect URLs include exact Preview URL
4. ✅ Check Google Cloud Console redirect URIs
5. ✅ Extract Supabase Auth logs for error patterns

### Log Collection Template:
```markdown
## OAuth Flow Test Results

### Test Environment:
- Preview URL: [EXACT_URL]
- Test Time: [TIMESTAMP]
- Browser: [USER_AGENT]

### Vercel Function Logs:
```
[Paste all [AUTH CALLBACK] and [LOGIN DEBUG] logs here]
```

### Browser Console Logs:
```
[Paste all console.log output from browser]
```

### Supabase Auth Logs:
```
[Paste relevant error logs from Supabase Dashboard]
```

### Error Analysis:
- **Root Cause**: [IDENTIFIED_ISSUE]
- **Error Code**: [HTTP_STATUS] 
- **Supabase Error**: [ERROR_CODE]
- **Action Taken**: [SOLUTION_APPLIED]
```

---

## 🎯 Expected Resolution Path

1. **Identify**: Pinpoint exact error from comprehensive logs
2. **Verify**: Confirm all URLs match across platforms
3. **Fix**: Apply targeted solution based on error type
4. **Test**: Verify OAuth flow works end-to-end
5. **Deploy**: Push to production after successful testing

---

**📝 Ready for Log Analysis**: Please follow Step 1 to access deployment logs and share the results for detailed analysis.