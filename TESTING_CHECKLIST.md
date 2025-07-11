# Vercel Preview Environment Testing Checklist

## Test URLs
- Primary: `https://huyou-wakarundesu-git-feature-onboarding-v2-junp1ayers-projects.vercel.app/`
- Alternative: `https://huyou-wakarundesu-feature-onboarding-v2.vercel.app/`

## 1. Authentication Flow Testing

### Google Login Test
- [ ] Click Google login button on login page
- [ ] Complete Google authentication in popup/redirect
- [ ] Verify successful login with proper session cookies
- [ ] Check automatic redirect to dashboard or onboarding page
- [ ] Verify no 401/authentication errors in Network tab

**Expected Console Logs:**
```
[MIDDLEWARE] POST /api/auth/callback/google
[MIDDLEWARE] Cookies: xxx chars, preview: sb-zbsjqsqytjjlbpchpacl-auth-token=...
[AUTH-DEBUG] Session response: { hasSession: true, hasUser: true, userId: "xxxxxxxx..." }
```

## 2. Onboarding Flow Testing

### Step-by-Step Question Flow
- [ ] **Step 1/3**: Student confirmation question displays
  - Options: "はい、学生です" / "いいえ、学生ではありません"
- [ ] **Step 2/3**: Health insurance confirmation displays
  - Options: "はい、家族の保険証を使っています" / "いいえ、自分で加入しています"
- [ ] **Step 3/3**: Working hours contract confirmation displays
  - Options: "はい、20時間以上です" / "いいえ、20時間未満です"
- [ ] Progress bar shows correct step (1/3, 2/3, 3/3)
- [ ] Each answer advances to next step
- [ ] Final answer triggers API call to `/api/profile/complete`

### API Call Testing
- [ ] Loading spinner displays: "設定を保存中..."
- [ ] Network tab shows POST to `/api/profile/complete` with status 200
- [ ] Request includes proper cookies and headers
- [ ] Response contains `{ success: true, allowance: number, profile: {...} }`
- [ ] Redirect to `/result?allowance=XXX` occurs

**Expected Request Payload:**
```json
{
  "isStudent": true,
  "annualIncome": 1000000,
  "isDependent": true,
  "isOver20hContract": false
}
```

**Expected Console Logs:**
```
[DEBUG] handleOnboardingComplete 呼ばれた
[DEBUG] Sending request with payload: {...}
[API] POST /api/profile/complete - 2025-01-XX...
[CONFIG] Configuration status: VALID
[AUTH-DEBUG] Session response: { hasSession: true, hasUser: true }
[API] Session validation successful for user: xxxxxxxx
✅ allowance 103
✅ 全保存処理完了 - 結果ページへ移動中
```

## 3. Result Page Testing

### Result Display
- [ ] Result page loads at `/result?allowance=XXX`
- [ ] Allowance amount displays correctly (103, 130, or 150)
- [ ] "万円" unit is shown
- [ ] "ダッシュボードへ" button works
- [ ] "設定を変更" button works

### Expected Allowance Values
Based on answers:
- Student + Dependent + Income ≤ 130万: **130万円**
- Student + Dependent + Income > 130万: **150万円**
- Non-student + Dependent + Income ≤ 103万: **103万円**
- Non-student + Dependent + Income > 103万: **130万円**
- Not dependent: **0万円**

## 4. Error Handling Testing

### Network Error Simulation
- [ ] Temporarily disable network → Should show retry messages
- [ ] Server errors (5xx) → Should retry up to 3 times
- [ ] Timeout (>30s) → Should show timeout message

### Session Error Testing
- [ ] Expired session → Should redirect to `/login`
- [ ] Missing session → Should show authentication error
- [ ] Invalid session → Should handle gracefully

**Expected Error Console Logs:**
```
🔄 Server error (500) - retrying in 2 seconds (attempt 1/3)
🔄 Network error - retrying in 3 seconds (attempt 2/3)
🔄 認証エラー - ログインページへリダイレクト
```

## 5. Production Environment Validation

### Configuration Check
- [ ] All required environment variables present
- [ ] No development URLs in production
- [ ] Proper CORS headers set
- [ ] Security headers applied

**Expected Config Logs:**
```
[CONFIG] Environment: production
[CONFIG] Configuration status: VALID
[CONFIG] Details: { supabase: { hasUrl: true, hasAnonKey: true, urlFormat: "valid" }, google: { hasClientId: true, hasClientSecret: true } }
```

### Security Validation
- [ ] No sensitive data in console logs (production)
- [ ] Proper cookie security flags
- [ ] HTTPS enforced
- [ ] No CORS violations

## 6. Mobile Responsiveness (Optional)

### Mobile Testing
- [ ] Touch-friendly button sizes (min 44px)
- [ ] Proper viewport scaling
- [ ] Readable text on small screens
- [ ] Loading spinner displays correctly

## Troubleshooting Guide

### If 401 Errors Persist:
1. Check Network tab for missing cookies
2. Verify CORS headers in response
3. Check Console for [AUTH-DEBUG] logs
4. Confirm environment variables in Vercel dashboard

### If Spinner Doesn't Close:
1. Check Console for JavaScript errors
2. Verify API response format
3. Check Network tab for failed requests
4. Look for [DEBUG] logs showing completion flow

### If Questions Don't Display:
1. Check Console for component rendering errors
2. Verify no hydration mismatches
3. Check Network tab for failed asset loads

---

**Note**: All logs marked with [DEBUG], [AUTH-DEBUG], [MIDDLEWARE], [API], [CONFIG] are added by our ultra think mode improvements and will help identify any remaining issues.